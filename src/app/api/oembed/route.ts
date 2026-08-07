import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CACHE_SECONDS = 60 * 60 * 24 // 24 hours

const ENDPOINTS: Record<string, string> = {
  youtube: 'https://www.youtube.com/oembed?format=json&url=',
  pinterest: 'https://www.pinterest.com/oembed.json?url=',
  tiktok: 'https://www.tiktok.com/oembed?url=',
  instagram: 'https://graph.facebook.com/v25.0/instagram_oembed?url=',
  facebook: 'https://graph.facebook.com/v25.0/oembed_video?url=',
}

/** Instagram posts use oembed_post; reels use oembed_video. */
const FACEBOOK_POST_ENDPOINT = 'https://graph.facebook.com/v25.0/oembed_post?url='

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: CACHE_SECONDS },
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

function extractOg(html: string): { title: string | null; image: string | null } {
  const title =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1] ?? null
  const image =
    html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i)?.[1] ?? null
  return {
    title: title ? decodeEntities(title) : null,
    image: image ? decodeEntities(image) : null,
  }
}

function facebookVideoId(url: string): string | null {
  const m = url.match(/(?:reel|watch|videos)\/?[\w/=]*(?:v=)?(\d{10,})/)
  return m ? m[1] : null
}

function normalizeSlashes(s: string): string {
  return s.replace(/\\\//g, '/').replace(/&amp;/g, '&')
}

function extractCoverImage(html: string): string | null {
  const m = html.match(/https?:\\?\/\\?\/[^"'\\\s]*t15\.5256[^"'\\\s]*\.jpg/i)
  return m ? normalizeSlashes(m[0]) : null
}

async function scrapeInstagram(
  url: string,
  debug?: string[],
): Promise<{ title: string | null; thumbnail: string | null }> {
  const type = url.match(/instagram\.com\/(reel|p|tv|stories)\//)?.[1] ?? 'p'
  const code = url.match(/instagram\.com\/(?:reel|p|tv|stories)\/([A-Za-z0-9_-]+)/)?.[1] ?? ''
  if (!code) return { title: null, thumbnail: null }
  const variants = [
    `https://www.instagram.com/${type}/${code}/embed/captioned/`,
    `https://www.instagram.com/${type}/${code}/embed/`,
    `https://www.instagram.com/p/${code}/embed/captioned/`,
  ]
  for (const target of variants) {
    try {
      const { ok, status, text } = await fetchText(target)
      debug?.push(`ig ${status} ${target} len=${text.length}`)
      if (!ok) continue
      const thumb =
        text.match(/src="(https:\/\/[^"]*scontent[^"]*\.(?:jpg|png)[^"]*)"/i)?.[1] ?? null
      if (thumb) return { title: null, thumbnail: normalizeSlashes(thumb) }
    } catch (err) {
      debug?.push(`ig ERR ${target}: ${String(err).slice(0, 120)}`)
    }
  }
  debug?.push('ig: no thumbnail from any surface')
  console.error(`[oembed] instagram: no media obtainable token-free for ${url}`)
  return { title: null, thumbnail: null }
}

async function scrapeFacebook(
  url: string,
  debug?: string[],
): Promise<{ title: string | null; thumbnail: string | null }> {
  const videoId = facebookVideoId(url)
  const surfaces: { url: string; kind: 'og' | 'cover' }[] = videoId
    ? [
        { url: `https://www.facebook.com/watch?v=${videoId}`, kind: 'og' },
        { url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`, kind: 'cover' },
      ]
    : [
        { url, kind: 'og' },
        { url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`, kind: 'cover' },
      ]
  let title: string | null = null
  let thumbnail: string | null = null
  for (const surface of surfaces) {
    try {
      const { ok, status, text } = await fetchText(surface.url)
      debug?.push(`fb ${status} ${surface.url} len=${text.length}`)
      if (!ok) continue
      if (surface.kind === 'og') {
        const og = extractOg(text)
        if (og.title) title = og.title
        if (og.image) thumbnail = og.image
      } else {
        const cover = extractCoverImage(text)
        if (cover) thumbnail = cover
      }
      if (title && thumbnail) break
    } catch (err) {
      debug?.push(`fb ERR ${surface.url}: ${String(err).slice(0, 120)}`)
    }
  }
  if (!title && !thumbnail) {
    console.error(`[oembed] facebook: no media obtainable for ${url}`)
  }
  return { title, thumbnail }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') ?? ''
  const url = searchParams.get('url') ?? ''
  const endpoint = ENDPOINTS[platform]

  if (!endpoint || !url) {
    return NextResponse.json(
      { title: null, thumbnail: null, error: 'invalid params' },
      { status: 400 },
    )
  }

  try {
    // 1) Meta/YouTube/Pinterest/TikTok public oEmbed
    let res = await fetchText(`${endpoint}${encodeURIComponent(url)}`)
    if (platform === 'facebook' && !res.ok) {
      res = await fetchText(`${FACEBOOK_POST_ENDPOINT}${encodeURIComponent(url)}`)
    }
    if (!res.ok) {
      console.error(
        `[oembed] ${platform} oEmbed HTTP ${res.status} for ${url} — body: ${res.text.slice(0, 300)}`,
      )
      return NextResponse.json(
        { title: null, thumbnail: null, error: `oEmbed HTTP ${res.status}` },
        { status: 502 },
      )
    }

    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(res.text) as Record<string, unknown>
    } catch {
      /* non-JSON body — fall through to scrape */
    }
    const title = typeof data.title === 'string' ? data.title : null
    const thumbnail = typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null

    if (title || thumbnail) {
      return NextResponse.json({ title, thumbnail })
    }

    // 2) oEmbed succeeded but no media data (Meta returns embed html only) — scrape real media
    console.error(
      `[oembed] ${platform} oEmbed returned no title/thumbnail for ${url}, scraping media…`,
    )
    const debug = searchParams.get('debug') === '1' ? [] : null
    if (platform === 'instagram') {
      const ig = await scrapeInstagram(url, debug ?? undefined)
      return NextResponse.json(
        { title: ig.title, thumbnail: ig.thumbnail },
        debug ? { headers: { 'x-debug': debug.join(' | ') } } : undefined,
      )
    }
    if (platform === 'facebook') {
      const fb = await scrapeFacebook(url, debug ?? undefined)
      return NextResponse.json(
        { title: fb.title, thumbnail: fb.thumbnail },
        debug ? { headers: { 'x-debug': debug.join(' | ') } } : undefined,
      )
    }
    return NextResponse.json({ title: null, thumbnail: null })
  } catch (err) {
    console.error(`[oembed] ${platform} fetch failed for ${url}:`, err)
    return NextResponse.json(
      { title: null, thumbnail: null, error: String(err) },
      { status: 502 },
    )
  }
}
