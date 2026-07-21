const API_URL = 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?pub=nwtsv&fileformat=mp4&langwritten=T'

interface JWVideoResult {
  url: string
  title: string
}

let cache: JWVideoResult[] | null = null

export async function getBookIntroVideo(bookNum: number): Promise<JWVideoResult | null> {
  try {
    if (!cache) {
      const res = await fetch(API_URL)
      if (!res.ok) return null
      const data = await res.json()
      cache = []
      const books = data.books
      if (!Array.isArray(books)) return null
      for (const book of books) {
        const videos = book.videos
        if (!Array.isArray(videos) || videos.length === 0) continue
        const v = videos[0]
        const mp4s = v.MP4
        if (!Array.isArray(mp4s) || mp4s.length === 0) continue
        const sorted = [...mp4s].sort((a: any, b: any) => (b.height || 0) - (a.height || 0))
        const best = sorted[0]
        if (best?.file?.url) {
          cache.push({ url: best.file.url, title: v.title })
        }
      }
    }
    const result = cache[bookNum - 1]
    return result || null
  } catch {
    return null
  }
}
