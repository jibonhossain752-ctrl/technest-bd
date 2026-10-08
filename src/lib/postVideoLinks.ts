import { POSTS } from '@/data/posts'
import { VIDEOS } from '@/data/videos'
import { normalizeVideoUrl } from '@/lib/video'

/**
 * Homepage "Watch & Shop" card destinations.
 *
 * Each card points at the blog post whose `videoUrl` matches the card's own
 * video URL (Instagram /reels/ is normalized to /reel/ before comparing), so
 * the video plays inside that post instead of on the external platform. The
 * links are derived from the post data at build time, which keeps them in sync
 * if a post's videoUrl changes. A card whose video has no matching post is
 * simply absent from the map and keeps its original external href.
 *
 * Server-only: importing the post data here keeps it out of the client bundle.
 */
export function getVideoPostLinks(): Record<string, string> {
  const links: Record<string, string> = {}
  for (const video of VIDEOS) {
    const target = normalizeVideoUrl(video.href)
    const post = POSTS.find(
      (p) => p.videoUrl && normalizeVideoUrl(p.videoUrl) === target,
    )
    if (post) links[video.id] = `/blog/${post.slug}?play=1#video`
  }
  return links
}
