import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ENDPOINTS: Record<string, string> = {
  youtube: 'https://www.youtube.com/oembed?format=json&url=',
  pinterest: 'https://www.pinterest.com/oembed.json?url=',
  tiktok: 'https://www.tiktok.com/oembed?url=',
  instagram: 'https://graph.facebook.com/v17.0/instagram_oembed?url=',
  facebook: 'https://graph.facebook.com/v17.0/oembed_post?url=',
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
    const res = await fetch(`${endpoint}${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechnestBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error(`[oembed] ${platform} HTTP ${res.status} for ${url}`)
      return NextResponse.json(
        { title: null, thumbnail: null, error: `oEmbed HTTP ${res.status}` },
        { status: 502 },
      )
    }
    const data = await res.json()
    const title = typeof data.title === 'string' ? data.title : null
    const thumbnail = typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null
    if (!title && !thumbnail) {
      console.error(`[oembed] ${platform} returned no title/thumbnail for ${url}:`, JSON.stringify(data).slice(0, 200))
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
