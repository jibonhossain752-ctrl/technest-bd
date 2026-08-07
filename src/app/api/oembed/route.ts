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

async function fetchOEmbed(endpoint: string, url: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${endpoint}${encodeURIComponent(url)}`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(12000),
    next: { revalidate: CACHE_SECONDS },
  })
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    console.error(
      `[oembed] ${endpoint.includes('oembed_post') ? 'facebook(oembed_post)' : endpoint.includes('oembed_video') ? 'facebook(oembed_video)' : endpoint.includes('instagram_oembed') ? 'instagram' : 'unknown'} ` +
        `HTTP ${res.status} for ${url} — body: ${String(text).slice(0, 300)}`,
    )
  }
  return { ok: res.ok, status: res.status, data }
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
    let result = await fetchOEmbed(endpoint, url)

    // Reels require oembed_video; regular posts oembed_post. Fall back across.
    if (platform === 'facebook' && !result.ok) {
      result = await fetchOEmbed(FACEBOOK_POST_ENDPOINT, url)
    }

    if (!result.ok) {
      return NextResponse.json(
        { title: null, thumbnail: null, error: `oEmbed HTTP ${result.status}` },
        { status: 502 },
      )
    }

    const data = result.data as Record<string, unknown>
    const title = typeof data.title === 'string' ? data.title : null
    const thumbnail = typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null
    if (!title && !thumbnail) {
      console.error(
        `[oembed] ${platform} returned no title/thumbnail for ${url}:`,
        JSON.stringify(data).slice(0, 200),
      )
      return NextResponse.json(
        { title: null, thumbnail: null, error: 'oEmbed returned no media data' },
        { status: 502 },
      )
    }
    return NextResponse.json({ title, thumbnail })
  } catch (err) {
    console.error(`[oembed] ${platform} fetch failed for ${url}:`, err)
    return NextResponse.json(
      { title: null, thumbnail: null, error: String(err) },
      { status: 502 },
    )
  }
}
