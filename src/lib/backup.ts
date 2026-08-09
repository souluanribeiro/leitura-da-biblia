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

const ALLOWED_EXACT_KEYS = new Set(['reading_start_date', 'reading_schedule', 'app_theme', 'dashboard_compact'])
const MAX_IMPORT_ITEMS = 2000

function isAllowedKey(key: string): boolean {
  return ALLOWED_EXACT_KEYS.has(key) || key.startsWith('checked_') || key.startsWith(CACHE_PREFIX)
}

function isValidValue(key: string, value: string): boolean {
  if (key === 'reading_start_date') return !Number.isNaN(Date.parse(value))
  if (key === 'reading_schedule' || key === 'app_theme' || key === 'dashboard_compact') return value.length <= 2000
  if (key.startsWith('checked_')) {
    if (value === 'true' || value === 'false' || /^\d+$/.test(value)) return true
    try {
      const obj = JSON.parse(value)
      return typeof obj === 'object' && obj !== null && !Array.isArray(obj) &&
        Object.values(obj).every(v => typeof v === 'boolean')
    } catch {
      return false
    }
  }
  return true
}

export function importProgress(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { success: false, message: 'Formato de arquivo inválido' }
    }
    let count = 0
    let skipped = 0
    for (const [key, value] of Object.entries(parsed.data)) {
      if (count >= MAX_IMPORT_ITEMS) break
      if (typeof value !== 'string' || !isAllowedKey(key) || !isValidValue(key, value)) {
        skipped++
        continue
      }
      localStorage.setItem(key, value)
      count++
    }
    return { success: true, message: `${count} itens importados com sucesso` }
  } catch {
    return { success: false, message: 'Erro ao ler o arquivo' }
  }
}
