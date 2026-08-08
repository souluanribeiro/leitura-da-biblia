import { supabase } from './supabase'
import { setReadingStartDate, clearReadingStartDate, getReadingStartDate } from './reading-plan'

export interface UserProfile {
  name: string
  age: string
  baptized: boolean
  baptismDate: string | null
  intendsToGetBaptized: boolean | null
  photo: string | null
}

const PROFILE_KEY = 'user_profile'
const ONBOARDING_STEP_KEY = 'onboarding_step'
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed'
const THEME_KEY = 'app_theme'
const USER_KEY = 'app_user_id'
const CACHE_PREFIX = 'biblia_cache_'

export function isSameDeviceUser(userId: string): boolean {
  return localStorage.getItem(USER_KEY) === userId
}

export function rememberDeviceUser(userId: string) {
  localStorage.setItem(USER_KEY, userId)
}

export function clearUserLocalData() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (
      k.startsWith('checked_') ||
      k.startsWith(CACHE_PREFIX) ||
      k === PROFILE_KEY ||
      k === 'reading_start_date' ||
      k === 'reading_schedule' ||
      k === ONBOARDING_STEP_KEY ||
      k === ONBOARDING_COMPLETED_KEY ||
      k === 'dashboard_compact'
    ) {
      keys.push(k)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProfile(p: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  void syncProfileToServer(p)
}

async function syncProfileToServer(p: UserProfile) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        name: p.name || null,
        age: p.age || null,
        baptized: p.baptized,
        baptism_date: p.baptismDate || null,
        intends_to_get_baptized: p.intendsToGetBaptized,
        photo: p.photo || null,
      },
      { onConflict: 'id' }
    )
  } catch { /* offline: perfil continua salvo localmente */ }
}

export async function syncProfileFromServer(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, age, baptized, baptism_date, intends_to_get_baptized, photo, reading_start_date')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return

    if (data.name || data.age || data.photo) {
      const p: UserProfile = {
        name: data.name || '',
        age: data.age || '',
        baptized: data.baptized ?? false,
        baptismDate: data.baptism_date || null,
        intendsToGetBaptized: data.intends_to_get_baptized ?? null,
        photo: data.photo || null,
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
      localStorage.removeItem(ONBOARDING_STEP_KEY)
    }

    if (data.reading_start_date) {
      setReadingStartDate(new Date(data.reading_start_date))
    } else {
      const local = getReadingStartDate()
      const isToday = local ? new Date(local).toDateString() === new Date().toDateString() : false
      if (!isToday) clearReadingStartDate()
    }
  } catch { /* offline */ }
}

export function loadOnboardingStep(): number {
  try {
    return parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || '0', 10)
  } catch { return 0 }
}

export function saveOnboardingStep(s: number) {
  localStorage.setItem(ONBOARDING_STEP_KEY, String(s))
}

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
}

export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  localStorage.removeItem(ONBOARDING_STEP_KEY)
}

export type Theme = 'dark' | 'light'

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null
  return stored || 'dark'
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
}
