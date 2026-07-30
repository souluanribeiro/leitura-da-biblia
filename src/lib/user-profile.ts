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

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProfile(p: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
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
