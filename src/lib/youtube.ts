/**
 * Extract 11-character YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  )
  return match ? match[1] : null
}

export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
