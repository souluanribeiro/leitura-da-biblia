const API_URL = 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?pub=nwtsv&fileformat=mp4&langwritten=T'

interface JWVideoResult {
  url: string
  title: string
  poster: string
}

interface VideoEntry {
  url: string
  title: string
  poster: string
  height: number
}

let cache: (VideoEntry | null)[] | null = null

function getResolution(file: any): number {
  const h = Number(file?.frameHeight)
  if (Number.isFinite(h) && h > 0) return h
  const label = String(file?.label || '').match(/(\d+)/)
  return label ? Number(label[1]) : 0
}

export async function getBookIntroVideo(bookNum: number): Promise<JWVideoResult | null> {
  try {
    if (!cache) {
      const res = await fetch(API_URL)
      if (!res.ok) return null
      const data = await res.json()
      const files = data?.files?.T?.MP4
      if (!Array.isArray(files)) return null

      const byBook = new Map<number, VideoEntry>()
      for (const file of files) {
        const url = file?.file?.url
        if (typeof url !== 'string') continue
        const code = parseInt(url.match(/_T_(\d+)_/)?.[1] || '', 10)
        if (!Number.isFinite(code) || code % 10 !== 0) continue
        const fileBookNum = code / 10
        if (fileBookNum < 1 || fileBookNum > 66) continue

        const height = getResolution(file)
        const current = byBook.get(fileBookNum)
        if (current && height <= current.height) continue
        byBook.set(fileBookNum, {
          url,
          title: file?.title || '',
          poster: file?.trackImage?.url || '',
          height,
        })
      }

      cache = Array.from({ length: 66 }, (_, i) => byBook.get(i + 1) || null)
    }

    const entry = bookNum >= 1 && bookNum <= 66 ? cache[bookNum - 1] : null
    if (!entry) return null
    return { url: entry.url, title: entry.title, poster: entry.poster }
  } catch {
    return null
  }
}