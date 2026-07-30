const CACHE_PREFIX = 'biblia_cache_'
const CACHE_VERSION = 'v1'

interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
}

export function cacheSet<T>(key: string, data: T, _ttlMs: number = 24 * 60 * 60 * 1000) {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION }
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {}
}

export function cacheGet<T>(key: string, ttlMs: number = 24 * 60 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (entry.version !== CACHE_VERSION) return null
    if (Date.now() - entry.timestamp > ttlMs) return null
    return entry.data
  } catch {
    return null
  }
}

export function cacheRemove(key: string) {
  localStorage.removeItem(CACHE_PREFIX + key)
}

export function exportProgress(): string {
  const data: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('checked_') || key.startsWith(CACHE_PREFIX) || key === 'reading_start_date' || key === 'reading_schedule' || key === 'app_theme' || key === 'dashboard_compact')) {
      data[key] = localStorage.getItem(key) || ''
    }
  }
  return JSON.stringify({ exported: new Date().toISOString(), version: CACHE_VERSION, data }, null, 2)
}

export function importProgress(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { success: false, message: 'Formato de arquivo inválido' }
    }
    let count = 0
    for (const [key, value] of Object.entries(parsed.data)) {
      if (typeof value === 'string') {
        localStorage.setItem(key, value)
        count++
      }
    }
    return { success: true, message: `${count} itens importados com sucesso` }
  } catch {
    return { success: false, message: 'Erro ao ler o arquivo' }
  }
}
