# Codigo Completo - Leitura da Biblia

> Arquivo de referencia com todo o codigo funcional do app.
> Ultima atualizacao: 24/07/2026

---

## 1. Configuracoes

### package.json
```json
{
  "name": "leitura-da-biblia",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.110.7",
    "lucide-react": "^1.25.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^7.0.2",
    "vite": "^8.1.5"
  }
}

```

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})

```

### index.html
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <meta name="theme-color" content="#0f0f1a" />
    <meta name="description" content="Leia a BÃ­blia inteira em 1 ano com a TraduÃ§Ã£o do Novo Mundo" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Leitura da BÃ­blia em 1 Ano â€” TNM</title>

    <meta property="og:type" content="website" />
    <meta property="og:title" content="Leitura da BÃ­blia em 1 Ano â€” TNM" />
    <meta property="og:description" content="Plano de leitura diÃ¡ria para ler a BÃ­blia inteira em 366 dias com a TraduÃ§Ã£o do Novo Mundo." />
    <meta property="og:url" content="https://leitura-da-biblia.vercel.app" />
    <meta property="og:image" content="https://leitura-da-biblia.vercel.app/og-image.png" />
    <meta property="og:locale" content="pt_BR" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Leitura da BÃ­blia em 1 Ano â€” TNM" />
    <meta name="twitter:description" content="Plano de leitura diÃ¡ria para ler a BÃ­blia inteira em 366 dias." />
    <meta name="twitter:image" content="https://leitura-da-biblia.vercel.app/og-image.png" />

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Leitura da BÃ­blia em 1 Ano",
      "description": "Plano de leitura diÃ¡ria para ler a BÃ­blia inteira em 366 dias com a TraduÃ§Ã£o do Novo Mundo.",
      "url": "https://leitura-da-biblia.vercel.app",
      "applicationCategory": "ReligiousApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL"
      }
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### public/manifest.json
```json
{
  "name": "Leitura da BÃ­blia",
  "short_name": "BÃ­blia 366",
  "description": "Leia a BÃ­blia inteira em 1 ano com a TraduÃ§Ã£o do Novo Mundo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f1a",
  "theme_color": "#0f0f1a",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### public/sw.js
```js
const CACHE_NAME = 'leitura-v1'
const SHELL_ASSETS = [
  '/',
  '/index.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  if (url.hostname.includes('wol.jw.org')) {
    event.respondWith(
      caches.open('wol-cache').then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          }).catch(() => cached)
          return cached || fetched
        })
      )
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetched
    })
  )
})

```

---

## 2. Source Code

### src/main.tsx
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

```

### src/App.tsx
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReadingDayPage = lazy(() => import('./pages/ReadingDayPage'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Sections = lazy(() => import('./pages/Sections'))
const Instructions = lazy(() => import('./pages/Instructions'))
const Notes = lazy(() => import('./pages/Notes'))
const Stats = lazy(() => import('./pages/Stats'))
const Profile = lazy(() => import('./pages/Profile'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="text-accent text-xl animate-pulse">Carregando...</div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="text-accent text-xl animate-pulse">Carregando...</div>
      </div>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route element={<ProtectedRoute user={user} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ler/:day" element={<ReadingDayPage />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/secoes" element={<Sections />} />
            <Route path="/notas" element={<Notes />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/instrucoes" element={<Instructions />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}
```

### src/types.ts
```ts
export interface ReadingDay {
  day: number
  book: string
  bookNum: number
  title: string
  chapters: string
  section: Section
  marker: 'ðŸ”¸' | 'ðŸ”¹' | ''
}

export interface Section {
  id: string
  name: string
  color: string
  icon: string
}

```

### src/index.css
```css
@import "tailwindcss";

:root {
  --bg-primary: #0f0f1a;
  --bg-card: #1a1a2e;
  --bg-hover: #252540;
  --text-primary: #f0f0f5;
  --text-muted: #8888aa;
  --accent: #3b82f6;
  --accent-dim: rgba(59, 130, 246, 0.15);
  --accent-glow: rgba(59, 130, 246, 0.25);
  --purple: #5a3b87;
  --purple-dim: rgba(90, 59, 135, 0.15);
}

@theme {
  --color-bg-primary: var(--bg-primary);
  --color-bg-card: var(--bg-card);
  --color-bg-hover: var(--bg-hover);
  --color-text-primary: var(--text-primary);
  --color-text-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-accent-dim: var(--accent-dim);
  --color-accent-glow: var(--accent-glow);
  --color-purple: var(--purple);
  --color-purple-dim: var(--purple-dim);
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

/* Micro-interactions */
.btn-primary {
  transition: all 0.15s ease;
}
.btn-primary:hover {
  transform: scale(1.03);
  box-shadow: 0 0 20px var(--accent-glow);
}
.btn-primary:active {
  transform: scale(0.97);
}

.btn-ghost {
  transition: all 0.15s ease;
}
.btn-ghost:hover {
  background: var(--bg-hover);
  transform: scale(1.02);
}
.btn-ghost:active {
  transform: scale(0.97);
}

.card {
  transition: all 0.2s ease;
}
.card:hover {
  border-color: rgba(76, 109, 170, 0.2);
  box-shadow: 0 0 15px rgba(76, 109, 170, 0.08);
}

.icon-btn {
  transition: all 0.15s ease;
}
.icon-btn:hover {
  transform: scale(1.1);
  color: var(--accent);
}
.icon-btn:active {
  transform: scale(0.9);
}

.tab-btn {
  transition: all 0.15s ease;
}
.tab-btn:active {
  transform: scale(0.95);
}

/* Streak flame pulse */
@keyframes flame-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4)); }
  50% { filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.7)); }
}
.flame-animate {
  animation: flame-pulse 2s ease-in-out infinite;
}

/* Checkbox check animation */
@keyframes check-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.check-animate {
  animation: check-pop 0.25s ease;
}

/* Progress ring fill animation */
@keyframes ring-fill {
  from { stroke-dashoffset: 283; }
}
.progress-ring {
  animation: ring-fill 1s ease-out;
}

/* Skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg-hover) 25%, rgba(255,255,255,0.04) 50%, var(--bg-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.75rem;
}

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in {
  animation: fade-in 0.3s ease;
}

/* Hide scrollbar */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Confetti animation */
@keyframes confetti-fall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  width: 8px;
  height: 8px;
  top: -10px;
  z-index: 9999;
  pointer-events: none;
  animation: confetti-fall 2s ease-out forwards;
}

/* Completion pulse */
@keyframes completion-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
.completion-pulse {
  animation: completion-pulse 0.8s ease-out;
}

```

---

## 3. Components

### src/components/Layout.tsx
```tsx
import { Outlet, NavLink } from 'react-router-dom'
import { CalendarDays, LayoutGrid, Home, GraduationCap, StickyNote, User } from 'lucide-react'
import { loadProfile } from '../lib/user-profile'

export default function Layout() {
  const profile = loadProfile()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs px-3 py-2 rounded-xl transition-colors btn-ghost ${
      isActive ? 'text-accent bg-bg-hover' : 'text-text-muted hover:text-text-secondary'
    }`

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <header className="sticky top-0 z-10 bg-bg-dark/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-accent font-bold">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#3b82f6" d="M25.0625 38.457C26.754 35.7227 32.6641 32.3516 44.7266 34.8828C44.8281 34.9023 44.9258 34.8789 45.0078 34.8125C45.0898 34.75 45.1328 34.6563 45.1328 34.5547L45.0859 11.3711C45.0859 11.25 45.1406 11.1484 45.2461 11.0859C45.3438 11.0195 45.4609 11.0156 45.5703 11.0664L47.3047 11.9102C47.4258 11.9688 47.4922 12.082 47.4922 12.2148L47.5039 38.0234C47.5039 38.1172 47.4688 38.1953 47.4063 38.2617C47.3398 38.3281 47.2578 38.3594 47.168 38.3594L27.8438 38.3008C25.8281 41.7188 22.1641 41.7188 20.1484 38.3008L0.828125 38.3594C0.734375 38.3594 0.652344 38.3242 0.589844 38.2617C0.523438 38.1953 0.488281 38.1172 0.488281 38.0234L0.5 12.2148C0.5 12.082 0.570312 11.9688 0.6875 11.9102L2.42188 11.0664C2.53125 11.0117 2.64844 11.0195 2.75 11.0859C2.85156 11.1484 2.90625 11.25 2.90625 11.3711L2.86328 34.5547C2.86328 34.6602 2.90625 34.75 2.98438 34.8125C3.06641 34.8789 3.16406 34.9023 3.26563 34.8828C15.3281 32.3516 21.2383 35.7227 22.9297 38.457C23.3242 39.0938 24.7031 39.043 25.0625 38.457Z" fillRule="evenodd"/>
            <path fill="#3b82f6" d="M24.7539 34.6094L24.7617 11.2539C24.7617 11.0586 24.8359 10.8906 24.9805 10.7578C26.3047 9.53906 33.5703 3.48828 43.4688 7.51953C43.7266 7.625 43.8867 7.86328 43.8867 8.14453V32.1289C43.8867 32.3438 43.7969 32.5273 43.6328 32.6563C43.4688 32.7891 43.2734 32.8359 43.0664 32.7852C40.5156 32.1797 32.4648 30.7852 25.7813 35.1719C25.5703 35.3086 25.3203 35.3203 25.1016 35.1992C24.8789 35.0781 24.7539 34.8594 24.7539 34.6055V34.6094Z" fillRule="evenodd"/>
            <path fill="#3b82f6" d="M23.2969 34.6094L23.2891 11.2539C23.2891 11.0586 23.2109 10.8906 23.0703 10.7578C21.7461 9.53906 14.4805 3.48828 4.58203 7.51953C4.32422 7.625 4.16406 7.86328 4.16406 8.14453V32.1289C4.16406 32.3438 4.25391 32.5273 4.41797 32.6563C4.58203 32.7891 4.77734 32.8359 4.98047 32.7852C7.53516 32.1797 15.582 30.7852 22.2695 35.1719C22.4805 35.3086 22.7305 35.3203 22.9492 35.1992C23.168 35.0781 23.2969 34.8594 23.2969 34.6055V34.6094Z" fillRule="evenodd"/>
          </svg>
          <span className="text-sm">Leitura da BÃ­blia</span>
        </NavLink>
        <NavLink to="/perfil" className="text-text-muted hover:text-accent p-0.5 icon-btn">
          {profile?.photo ? (
            <img src={profile.photo} alt="Perfil" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <User size={18} />
          )}
        </NavLink>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-dark/95 backdrop-blur-sm border-t border-white/5 px-2 py-2 flex justify-around">
        <NavLink to="/calendario" className={linkClass}>
          <CalendarDays size={20} />
          <span>CalendÃ¡rio</span>
        </NavLink>
        <NavLink to="/secoes" className={linkClass}>
          <LayoutGrid size={20} />
          <span>SeÃ§Ãµes</span>
        </NavLink>
        <NavLink to="/" end className={linkClass}>
          <Home size={22} />
          <span className="font-medium">Hoje</span>
        </NavLink>
        <NavLink to="/notas" className={linkClass}>
          <StickyNote size={20} />
          <span>Notas</span>
        </NavLink>
        <NavLink to="/instrucoes" className={linkClass}>
          <GraduationCap size={20} />
          <span>InstruÃ§Ãµes</span>
        </NavLink>
      </nav>
    </div>
  )
}

```

### src/components/ProtectedRoute.tsx
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'

export default function ProtectedRoute({ user }: { user: User | null }) {
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

```

### src/components/Skeleton.tsx
```tsx
function Pulse({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pulse className="w-8 h-8 rounded-full" />
          <div className="space-y-1.5">
            <Pulse className="w-10 h-6" />
            <Pulse className="w-16 h-3" />
          </div>
        </div>
        <Pulse className="w-20 h-5" />
      </div>

      <div className="flex justify-center py-2">
        <Pulse className="w-40 h-40 rounded-full" />
      </div>

      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Pulse className="w-28 h-5" />
          <Pulse className="w-24 h-9 rounded-xl" />
        </div>
        <div className="p-4 space-y-3">
          <Pulse className="w-full h-4" />
          <Pulse className="w-3/4 h-4" />
        </div>
      </div>

      <Pulse className="w-full h-16 rounded-2xl" />
      <Pulse className="w-full h-12 rounded-2xl" />
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <Pulse className="w-24 h-6" />
      <Pulse className="w-48 h-3" />
      <div className="flex gap-1.5 bg-bg-card rounded-xl p-1 border border-white/5">
        {[1, 2, 3, 4].map(i => <Pulse key={i} className="flex-1 h-7 rounded-lg" />)}
      </div>
      <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Pulse className="w-32 h-5" />
          <div className="flex gap-2"><Pulse className="w-8 h-8 rounded-xl" /><Pulse className="w-8 h-8 rounded-xl" /></div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Pulse key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReadingDaySkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <Pulse className="w-16 h-4" />
      <div className="flex items-center justify-between">
        <Pulse className="w-24 h-6" />
        <Pulse className="w-28 h-9 rounded-xl" />
      </div>
      <Pulse className="w-full h-16 rounded-2xl" />
      <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3">
        <Pulse className="w-20 h-3" />
        <Pulse className="w-full h-10 rounded-xl" />
        <Pulse className="w-full h-10 rounded-xl" />
        <Pulse className="w-3/4 h-10 rounded-xl" />
      </div>
    </div>
  )
}

```

---

## 4. Lib

### src/lib/supabase.ts
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

```

### src/lib/user-profile.ts
```ts
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

```

### src/lib/share.ts
```ts
export async function shareContent(title: string, text: string, url?: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch {
      return false
    }
  }

  const fullText = url ? `${text}\n\n${url}` : text
  try {
    await navigator.clipboard.writeText(fullText)
    return true
  } catch {
    return false
  }
}

export function getShareText(params: {
  dayNumber: number
  title: string
  book: string
  chapters?: string
  sectionName?: string
}): string {
  const { dayNumber, title, book, chapters, sectionName } = params
  let text = `ðŸ“– Leitura da BÃ­blia â€” Dia ${dayNumber}\n${title}`
  if (chapters) text += `\nðŸ“š ${book} ${chapters}`
  if (sectionName) text += `\nðŸ“‚ ${sectionName}`
  text += `\n\nðŸ”— Leia em: https://leitura-da-biblia.vercel.app/ler/${dayNumber}`
  return text
}

export function getShareNoteText(params: {
  dayNumber: number
  noteContent: string
}): string {
  const { dayNumber, noteContent } = params
  return `ðŸ“ Minha anotaÃ§Ã£o â€” Dia ${dayNumber}\n\n"${noteContent}"\n\nðŸ“– Leitura da BÃ­blia em 1 Ano`
}

```

### src/lib/push.ts
```ts
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPermissionState(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return Notification.permission
}

export async function subscribeToPush(preferredHour: number): Promise<boolean> {
  if (!isPushSupported()) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.ready

  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await existing.unsubscribe()
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  const { endpoint } = subscription
  const key = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')

  if (!key || !auth) return false

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)))
  const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)))

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return false

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth: authStr,
      preferred_hour: preferredHour,
      active: true,
    },
    { onConflict: 'user_id,endpoint' }
  )

  return !error
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return true

  await subscription.unsubscribe()

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return false

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', subscription.endpoint)

  return !error
}

export async function getSubscriptionStatus(): Promise<{
  subscribed: boolean
  preferredHour: number | null
}> {
  if (!isPushSupported()) return { subscribed: false, preferredHour: null }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return { subscribed: false, preferredHour: null }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return { subscribed: false, preferredHour: null }

  const { data } = await supabase
    .from('push_subscriptions')
    .select('preferred_hour')
    .eq('user_id', user.id)
    .eq('endpoint', subscription.endpoint)
    .eq('active', true)
    .maybeSingle()

  return {
    subscribed: true,
    preferredHour: data?.preferred_hour ?? null,
  }
}

export async function updatePreferredHour(hour: number): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return false

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ preferred_hour: hour })
    .eq('user_id', user.id)
    .eq('active', true)

  return !error
}

```

### src/lib/jw-media.ts
```ts
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

```

### src/lib/reading-plan.ts
```ts
import type { ReadingDay, Section } from '../types'

export const sections: Section[] = [
  { id: 'moses', name: 'Escritos de MoisÃ©s', color: '#d4a853', icon: 'scroll' },
  { id: 'terra-prometida', name: 'Israel Entra na Terra Prometida', color: '#c0842f', icon: 'cookie' },
  { id: 'reis', name: 'Quando os Reis Governavam Israel', color: '#f59e0b', icon: 'crown' },
  { id: 'exilio', name: 'Os Judeus Retornam do ExÃ­lio', color: '#dc2626', icon: 'house' },
  { id: 'cantico-sabedoria', name: 'CÃ¢nticos e Sabedoria PrÃ¡tica', color: '#ef4444', icon: 'music' },
  { id: 'profetas', name: 'Os Profetas', color: '#22c55e', icon: 'message-square' },
  { id: 'jesus', name: 'Relatos da Vida de Jesus', color: '#3b82f6', icon: 'dove' },
  { id: 'congregacao', name: 'Crescimento da CongregaÃ§Ã£o', color: '#6366f1', icon: 'users' },
  { id: 'cartas-paulo', name: 'As Cartas de Paulo', color: '#a855f7', icon: 'mail' },
  { id: 'outros-apostolos', name: 'Escritos de Outros ApÃ³stolos', color: '#f97316', icon: 'pen-tool' },
  { id: 'tratos-israel', name: 'ðŸ”¸Tratos de Deus com os Israelitas', color: '#f97316', icon: 'scroll' },
  { id: 'congregacao-crista', name: 'ðŸ”¹Desenvolvimento da CongregaÃ§Ã£o CristÃ£', color: '#3b82f6', icon: 'dove' },
]

const bookSectionMap: Record<number, Section> = {
  1: sections[0], 2: sections[0], 3: sections[0], 4: sections[0], 5: sections[0], 18: sections[0],
  6: sections[1], 7: sections[1], 8: sections[1],
  9: sections[2], 10: sections[2], 11: sections[2], 12: sections[2], 13: sections[2], 14: sections[2],
  15: sections[3], 16: sections[3], 17: sections[3],
  19: sections[4], 20: sections[4], 21: sections[4], 22: sections[4],
  23: sections[5], 24: sections[5], 25: sections[5], 26: sections[5], 27: sections[5],
  28: sections[5], 29: sections[5], 30: sections[5], 31: sections[5], 32: sections[5],
  33: sections[5], 34: sections[5], 35: sections[5], 36: sections[5], 37: sections[5],
  38: sections[5], 39: sections[5],
  40: sections[6], 41: sections[6], 42: sections[6], 43: sections[6],
  44: sections[7],
  45: sections[8], 46: sections[8], 47: sections[8], 48: sections[8], 49: sections[8],
  50: sections[8], 51: sections[8], 52: sections[8], 53: sections[8], 54: sections[8],
  55: sections[8], 56: sections[8], 57: sections[8], 58: sections[8],
  59: sections[9], 60: sections[9], 61: sections[9], 62: sections[9], 63: sections[9],
  64: sections[9], 65: sections[9], 66: sections[9],
}

function sec(bookNum: number): Section {
  return bookSectionMap[bookNum] || sections[0]
}

const O = 'ðŸ”¸' as const
const B = 'ðŸ”¹' as const
const N = '' as const

const _rawPlan: Omit<ReadingDay, 'section'>[] = [
  { day: 1,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 1â€“3',      chapters: '1â€“3', marker: N },
  { day: 2,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 4â€“6',      chapters: '4â€“6', marker: N },
  { day: 3,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 7â€“9',      chapters: '7â€“9', marker: N },
  { day: 4,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 10â€“12',    chapters: '10â€“12', marker: O },
  { day: 5,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 13â€“16',    chapters: '13â€“16', marker: O },
  { day: 6,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 17â€“20',    chapters: '17â€“20', marker: O },
  { day: 7,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 21â€“24',    chapters: '21â€“24', marker: O },
  { day: 8,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 25â€“27',    chapters: '25â€“27', marker: O },
  { day: 9,   book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 28â€“31',    chapters: '28â€“31', marker: O },
  { day: 10,  book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 32â€“35',    chapters: '32â€“35', marker: O },
  { day: 11,  book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 36â€“38',    chapters: '36â€“38', marker: O },
  { day: 12,  book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 39â€“42',    chapters: '39â€“42', marker: O },
  { day: 13,  book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 43â€“45',    chapters: '43â€“45', marker: O },
  { day: 14,  book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 46â€“48',    chapters: '46â€“48', marker: O },
  { day: 15,  book: 'GÃªnesis', bookNum: 1,  title: 'GÃªnesis 49â€“50',    chapters: '49â€“50', marker: O },
  { day: 16,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 1â€“3',        chapters: '1â€“3', marker: O },
  { day: 17,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 4â€“6',        chapters: '4â€“6', marker: O },
  { day: 18,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 7â€“9',        chapters: '7â€“9', marker: O },
  { day: 19,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 10â€“12',      chapters: '10â€“12', marker: O },
  { day: 20,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 13â€“15',      chapters: '13â€“15', marker: O },
  { day: 21,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 16â€“18',      chapters: '16â€“18', marker: O },
  { day: 22,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 19â€“21',      chapters: '19â€“21', marker: O },
  { day: 23,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 22â€“24',      chapters: '22â€“24', marker: N },
  { day: 24,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 25â€“27',      chapters: '25â€“27', marker: N },
  { day: 25,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 28â€“30',      chapters: '28â€“30', marker: N },
  { day: 26,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 31â€“34',      chapters: '31â€“34', marker: O },
  { day: 27,  book: 'ÃŠxodo', bookNum: 2,    title: 'ÃŠxodo 35â€“40',      chapters: '35â€“40', marker: O },
  { day: 28,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 1â€“3',     chapters: '1â€“3', marker: N },
  { day: 29,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 4â€“6',     chapters: '4â€“6', marker: N },
  { day: 30,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 7â€“9',     chapters: '7â€“9', marker: N },
  { day: 31,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 10â€“12',   chapters: '10â€“12', marker: N },
  { day: 32,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 13â€“14',   chapters: '13â€“14', marker: N },
  { day: 33,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 15â€“18',   chapters: '15â€“18', marker: N },
  { day: 34,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 19â€“22',   chapters: '19â€“22', marker: N },
  { day: 35,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 23â€“24',   chapters: '23â€“24', marker: N },
  { day: 36,  book: 'LevÃ­tico', bookNum: 3, title: 'LevÃ­tico 25â€“27',   chapters: '25â€“27', marker: N },
  { day: 37,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 1â€“3',      chapters: '1â€“3', marker: N },
  { day: 38,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 4â€“6',      chapters: '4â€“6', marker: N },
  { day: 39,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 7â€“10',     chapters: '7â€“10', marker: O },
  { day: 40,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 11â€“14',    chapters: '11â€“14', marker: O },
  { day: 41,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 15â€“18',    chapters: '15â€“18', marker: O },
  { day: 42,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 19â€“22',    chapters: '19â€“22', marker: O },
  { day: 43,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 23â€“27',    chapters: '23â€“27', marker: O },
  { day: 44,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 28â€“31',    chapters: '28â€“31', marker: O },
  { day: 45,  book: 'NÃºmeros', bookNum: 4,  title: 'NÃºmeros 32â€“36',    chapters: '32â€“36', marker: O },
  { day: 46,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 1â€“4',  chapters: '1â€“4', marker: O },
  { day: 47,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 5â€“7',  chapters: '5â€“7', marker: N },
  { day: 48,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 8â€“11', chapters: '8â€“11', marker: N },
  { day: 49,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 12â€“15', chapters: '12â€“15', marker: N },
  { day: 50,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 16â€“19', chapters: '16â€“19', marker: O },
  { day: 51,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 20â€“23', chapters: '20â€“23', marker: N },
  { day: 52,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 24â€“27', chapters: '24â€“27', marker: N },
  { day: 53,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 28â€“30', chapters: '28â€“30', marker: O },
  { day: 54,  book: 'DeuteronÃ´mio', bookNum: 5, title: 'DeuteronÃ´mio 31â€“34', chapters: '31â€“34', marker: O },
  { day: 55,  book: 'JosuÃ©', bookNum: 6,     title: 'JosuÃ© 1â€“4',        chapters: '1â€“4', marker: O },
  { day: 56,  book: 'JosuÃ©', bookNum: 6,     title: 'JosuÃ© 5â€“8',        chapters: '5â€“8', marker: O },
  { day: 57,  book: 'JosuÃ©', bookNum: 6,     title: 'JosuÃ© 9â€“12',       chapters: '9â€“12', marker: O },
  { day: 58,  book: 'JosuÃ©', bookNum: 6,     title: 'JosuÃ© 13â€“16',      chapters: '13â€“16', marker: O },
  { day: 59,  book: 'JosuÃ©', bookNum: 6,     title: 'JosuÃ© 17â€“21',      chapters: '17â€“21', marker: O },
  { day: 60,  book: 'JosuÃ©', bookNum: 6,     title: 'JosuÃ© 22â€“24',      chapters: '22â€“24', marker: O },
  { day: 61,  book: 'JuÃ­zes', bookNum: 7,    title: 'JuÃ­zes 1â€“4',       chapters: '1â€“4', marker: O },
  { day: 62,  book: 'JuÃ­zes', bookNum: 7,    title: 'JuÃ­zes 5â€“8',       chapters: '5â€“8', marker: O },
  { day: 63,  book: 'JuÃ­zes', bookNum: 7,    title: 'JuÃ­zes 9â€“12',      chapters: '9â€“12', marker: O },
  { day: 64,  book: 'JuÃ­zes', bookNum: 7,    title: 'JuÃ­zes 13â€“16',     chapters: '13â€“16', marker: O },
  { day: 65,  book: 'JuÃ­zes', bookNum: 7,    title: 'JuÃ­zes 17â€“21',     chapters: '17â€“21', marker: O },
  { day: 66,  book: 'Rute', bookNum: 8,      title: 'Rute 1â€“4',         chapters: '1â€“4', marker: O },
  { day: 67,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 1â€“4',     chapters: '1â€“4', marker: O },
  { day: 68,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 5â€“8',     chapters: '5â€“8', marker: O },
  { day: 69,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 9â€“12',    chapters: '9â€“12', marker: O },
  { day: 70,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 13â€“16',   chapters: '13â€“16', marker: O },
  { day: 71,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 17â€“20',   chapters: '17â€“20', marker: O },
  { day: 72,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 21â€“25',   chapters: '21â€“25', marker: O },
  { day: 73,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 26â€“28',   chapters: '26â€“28', marker: O },
  { day: 74,  book: '1 Samuel', bookNum: 9,  title: '1 Samuel 29â€“31',   chapters: '29â€“31', marker: O },
  { day: 75,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 1â€“4',     chapters: '1â€“4', marker: O },
  { day: 76,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 5â€“8',     chapters: '5â€“8', marker: O },
  { day: 77,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 9â€“12',    chapters: '9â€“12', marker: O },
  { day: 78,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 13â€“15',   chapters: '13â€“15', marker: O },
  { day: 79,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 16â€“18',   chapters: '16â€“18', marker: O },
  { day: 80,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 19â€“21',   chapters: '19â€“21', marker: O },
  { day: 81,  book: '2 Samuel', bookNum: 10, title: '2 Samuel 22â€“24',   chapters: '22â€“24', marker: O },
  { day: 82,  book: '1 Reis', bookNum: 11,   title: '1 Reis 1â€“4',       chapters: '1â€“4', marker: O },
  { day: 83,  book: '1 Reis', bookNum: 11,   title: '1 Reis 5â€“8',       chapters: '5â€“8', marker: O },
  { day: 84,  book: '1 Reis', bookNum: 11,   title: '1 Reis 9â€“11',      chapters: '9â€“11', marker: O },
  { day: 85,  book: '1 Reis', bookNum: 11,   title: '1 Reis 12â€“15',     chapters: '12â€“15', marker: O },
  { day: 86,  book: '1 Reis', bookNum: 11,   title: '1 Reis 16â€“18',     chapters: '16â€“18', marker: O },
  { day: 87,  book: '1 Reis', bookNum: 11,   title: '1 Reis 19â€“22',     chapters: '19â€“22', marker: O },
  { day: 88,  book: '2 Reis', bookNum: 12,   title: '2 Reis 1â€“5',       chapters: '1â€“5', marker: O },
  { day: 89,  book: '2 Reis', bookNum: 12,   title: '2 Reis 6â€“9',       chapters: '6â€“9', marker: O },
  { day: 90,  book: '2 Reis', bookNum: 12,   title: '2 Reis 10â€“13',     chapters: '10â€“13', marker: O },
  { day: 91,  book: '2 Reis', bookNum: 12,   title: '2 Reis 14â€“17',     chapters: '14â€“17', marker: O },
  { day: 92,  book: '2 Reis', bookNum: 12,   title: '2 Reis 18â€“21',     chapters: '18â€“21', marker: O },
  { day: 93,  book: '2 Reis', bookNum: 12,   title: '2 Reis 22â€“25',     chapters: '22â€“25', marker: O },
  { day: 94,  book: '1 CrÃ´nicas', bookNum: 13, title: '1 CrÃ´nicas 1â€“5', chapters: '1â€“5', marker: N },
  { day: 95,  book: '1 CrÃ´nicas', bookNum: 13, title: '1 CrÃ´nicas 6â€“10', chapters: '6â€“10', marker: N },
  { day: 96,  book: '1 CrÃ´nicas', bookNum: 13, title: '1 CrÃ´nicas 11â€“15', chapters: '11â€“15', marker: N },
  { day: 97,  book: '1 CrÃ´nicas', bookNum: 13, title: '1 CrÃ´nicas 16â€“21', chapters: '16â€“21', marker: N },
  { day: 98,  book: '1 CrÃ´nicas', bookNum: 13, title: '1 CrÃ´nicas 22â€“26', chapters: '22â€“26', marker: N },
  { day: 99,  book: '1 CrÃ´nicas', bookNum: 13, title: '1 CrÃ´nicas 27â€“29', chapters: '27â€“29', marker: N },
  { day: 100, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 1â€“5', chapters: '1â€“5', marker: N },
  { day: 101, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 6â€“10', chapters: '6â€“10', marker: N },
  { day: 102, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 11â€“15', chapters: '11â€“15', marker: N },
  { day: 103, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 16â€“21', chapters: '16â€“21', marker: N },
  { day: 104, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 22â€“26', chapters: '22â€“26', marker: N },
  { day: 105, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 27â€“31', chapters: '27â€“31', marker: N },
  { day: 106, book: '2 CrÃ´nicas', bookNum: 14, title: '2 CrÃ´nicas 32â€“36', chapters: '32â€“36', marker: N },
  { day: 107, book: 'Esdras', bookNum: 15,  title: 'Esdras 1â€“4',        chapters: '1â€“4', marker: O },
  { day: 108, book: 'Esdras', bookNum: 15,  title: 'Esdras 5â€“10',       chapters: '5â€“10', marker: O },
  { day: 109, book: 'Neemias', bookNum: 16, title: 'Neemias 1â€“5',       chapters: '1â€“5', marker: O },
  { day: 110, book: 'Neemias', bookNum: 16, title: 'Neemias 6â€“9',       chapters: '6â€“9', marker: O },
  { day: 111, book: 'Neemias', bookNum: 16, title: 'Neemias 10â€“13',     chapters: '10â€“13', marker: O },
  { day: 112, book: 'Ester', bookNum: 17,   title: 'Ester 1â€“5',         chapters: '1â€“5', marker: O },
  { day: 113, book: 'Ester', bookNum: 17,   title: 'Ester 6â€“10',        chapters: '6â€“10', marker: O },
  { day: 114, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 1â€“5',            chapters: '1â€“5', marker: N },
  { day: 115, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 6â€“10',           chapters: '6â€“10', marker: N },
  { day: 116, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 11â€“15',          chapters: '11â€“15', marker: N },
  { day: 117, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 16â€“21',          chapters: '16â€“21', marker: N },
  { day: 118, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 22â€“28',          chapters: '22â€“28', marker: N },
  { day: 119, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 29â€“34',          chapters: '29â€“34', marker: N },
  { day: 120, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 35â€“39',          chapters: '35â€“39', marker: N },
  { day: 121, book: 'JÃ³', bookNum: 18,      title: 'JÃ³ 40â€“42',          chapters: '40â€“42', marker: N },
  { day: 122, book: 'Salmos', bookNum: 19,  title: 'Salmos 1â€“6',        chapters: '1â€“6', marker: N },
  { day: 123, book: 'Salmos', bookNum: 19,  title: 'Salmos 7â€“11',       chapters: '7â€“11', marker: N },
  { day: 124, book: 'Salmos', bookNum: 19,  title: 'Salmos 12â€“17',      chapters: '12â€“17', marker: N },
  { day: 125, book: 'Salmos', bookNum: 19,  title: 'Salmos 18â€“22',      chapters: '18â€“22', marker: N },
  { day: 126, book: 'Salmos', bookNum: 19,  title: 'Salmos 23â€“28',      chapters: '23â€“28', marker: N },
  { day: 127, book: 'Salmos', bookNum: 19,  title: 'Salmos 29â€“34',      chapters: '29â€“34', marker: N },
  { day: 128, book: 'Salmos', bookNum: 19,  title: 'Salmos 35â€“39',      chapters: '35â€“39', marker: N },
  { day: 129, book: 'Salmos', bookNum: 19,  title: 'Salmos 40â€“45',      chapters: '40â€“45', marker: N },
  { day: 130, book: 'Salmos', bookNum: 19,  title: 'Salmos 46â€“51',      chapters: '46â€“51', marker: N },
  { day: 131, book: 'Salmos', bookNum: 19,  title: 'Salmos 52â€“59',      chapters: '52â€“59', marker: N },
  { day: 132, book: 'Salmos', bookNum: 19,  title: 'Salmos 60â€“66',      chapters: '60â€“66', marker: N },
  { day: 133, book: 'Salmos', bookNum: 19,  title: 'Salmos 67â€“72',      chapters: '67â€“72', marker: N },
  { day: 134, book: 'Salmos', bookNum: 19,  title: 'Salmos 73â€“78',      chapters: '73â€“78', marker: N },
  { day: 135, book: 'Salmos', bookNum: 19,  title: 'Salmos 79â€“84',      chapters: '79â€“84', marker: N },
  { day: 136, book: 'Salmos', bookNum: 19,  title: 'Salmos 85â€“90',      chapters: '85â€“90', marker: N },
  { day: 137, book: 'Salmos', bookNum: 19,  title: 'Salmos 91â€“98',      chapters: '91â€“98', marker: N },
  { day: 138, book: 'Salmos', bookNum: 19,  title: 'Salmos 99â€“104',     chapters: '99â€“104', marker: N },
  { day: 139, book: 'Salmos', bookNum: 19,  title: 'Salmos 105â€“108',    chapters: '105â€“108', marker: N },
  { day: 140, book: 'Salmos', bookNum: 19,  title: 'Salmos 109â€“113',    chapters: '109â€“113', marker: N },
  { day: 141, book: 'Salmos', bookNum: 19,  title: 'Salmos 114â€“119',    chapters: '114â€“119', marker: N },
  { day: 142, book: 'Salmos', bookNum: 19,  title: 'Salmos 120â€“126',    chapters: '120â€“126', marker: N },
  { day: 143, book: 'Salmos', bookNum: 19,  title: 'Salmos 127â€“132',    chapters: '127â€“132', marker: N },
  { day: 144, book: 'Salmos', bookNum: 19,  title: 'Salmos 133â€“139',    chapters: '133â€“139', marker: N },
  { day: 145, book: 'Salmos', bookNum: 19,  title: 'Salmos 140â€“145',    chapters: '140â€“145', marker: N },
  { day: 146, book: 'Salmos', bookNum: 19,  title: 'Salmos 146â€“150',    chapters: '146â€“150', marker: N },
  { day: 147, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 1â€“4', chapters: '1â€“4', marker: N },
  { day: 148, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 5â€“9', chapters: '5â€“9', marker: N },
  { day: 149, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 10â€“13', chapters: '10â€“13', marker: N },
  { day: 150, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 14â€“18', chapters: '14â€“18', marker: N },
  { day: 151, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 19â€“22', chapters: '19â€“22', marker: N },
  { day: 152, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 23â€“26', chapters: '23â€“26', marker: N },
  { day: 153, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 27â€“31', chapters: '27â€“31', marker: N },
  { day: 154, book: 'Eclesiastes', bookNum: 21, title: 'Eclesiastes 1â€“6', chapters: '1â€“6', marker: N },
  { day: 155, book: 'Eclesiastes', bookNum: 21, title: 'Eclesiastes 7â€“12', chapters: '7â€“12', marker: N },
  { day: 156, book: 'CÃ¢ntico de SalomÃ£o', bookNum: 22, title: 'CÃ¢ntico de SalomÃ£o 1â€“8', chapters: '1â€“8', marker: N },
  { day: 157, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 1â€“5',        chapters: '1â€“5', marker: N },
  { day: 158, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 6â€“10',       chapters: '6â€“10', marker: N },
  { day: 159, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 11â€“16',      chapters: '11â€“16', marker: N },
  { day: 160, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 17â€“22',      chapters: '17â€“22', marker: N },
  { day: 161, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 23â€“28',      chapters: '23â€“28', marker: N },
  { day: 162, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 29â€“34',      chapters: '29â€“34', marker: N },
  { day: 163, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 35â€“40',      chapters: '35â€“40', marker: N },
  { day: 164, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 41â€“45',      chapters: '41â€“45', marker: N },
  { day: 165, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 46â€“51',      chapters: '46â€“51', marker: N },
  { day: 166, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 52â€“57',      chapters: '52â€“57', marker: N },
  { day: 167, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 58â€“62',      chapters: '58â€“62', marker: N },
  { day: 168, book: 'IsaÃ­as', bookNum: 23,  title: 'IsaÃ­as 63â€“66',      chapters: '63â€“66', marker: N },
  { day: 169, book: 'Jeremias', bookNum: 24, title: 'Jeremias 1â€“5',     chapters: '1â€“5', marker: N },
  { day: 170, book: 'Jeremias', bookNum: 24, title: 'Jeremias 6â€“10',    chapters: '6â€“10', marker: N },
  { day: 171, book: 'Jeremias', bookNum: 24, title: 'Jeremias 11â€“15',   chapters: '11â€“15', marker: N },
  { day: 172, book: 'Jeremias', bookNum: 24, title: 'Jeremias 16â€“20',   chapters: '16â€“20', marker: N },
  { day: 173, book: 'Jeremias', bookNum: 24, title: 'Jeremias 21â€“25',   chapters: '21â€“25', marker: N },
  { day: 174, book: 'Jeremias', bookNum: 24, title: 'Jeremias 26â€“29',   chapters: '26â€“29', marker: N },
  { day: 175, book: 'Jeremias', bookNum: 24, title: 'Jeremias 30â€“33',   chapters: '30â€“33', marker: N },
  { day: 176, book: 'Jeremias', bookNum: 24, title: 'Jeremias 34â€“38',   chapters: '34â€“38', marker: N },
  { day: 177, book: 'Jeremias', bookNum: 24, title: 'Jeremias 39â€“44',   chapters: '39â€“44', marker: N },
  { day: 178, book: 'Jeremias', bookNum: 24, title: 'Jeremias 45â€“48',   chapters: '45â€“48', marker: N },
  { day: 179, book: 'Jeremias', bookNum: 24, title: 'Jeremias 49â€“52',   chapters: '49â€“52', marker: N },
  { day: 180, book: 'LamentaÃ§Ãµes', bookNum: 25, title: 'LamentaÃ§Ãµes 1â€“5', chapters: '1â€“5', marker: N },
  { day: 181, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 1â€“5',     chapters: '1â€“5', marker: N },
  { day: 182, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 6â€“10',    chapters: '6â€“10', marker: N },
  { day: 183, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 11â€“16',   chapters: '11â€“16', marker: N },
  { day: 184, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 17â€“22',   chapters: '17â€“22', marker: N },
  { day: 185, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 23â€“27',   chapters: '23â€“27', marker: N },
  { day: 186, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 28â€“33',   chapters: '28â€“33', marker: N },
  { day: 187, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 34â€“39',   chapters: '34â€“39', marker: N },
  { day: 188, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 40â€“44',   chapters: '40â€“44', marker: N },
  { day: 189, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 45â€“48',   chapters: '45â€“48', marker: N },
  { day: 190, book: 'Daniel', bookNum: 27,  title: 'Daniel 1â€“4',        chapters: '1â€“4', marker: N },
  { day: 191, book: 'Daniel', bookNum: 27,  title: 'Daniel 5â€“8',        chapters: '5â€“8', marker: N },
  { day: 192, book: 'Daniel', bookNum: 27,  title: 'Daniel 9â€“12',       chapters: '9â€“12', marker: N },
  { day: 193, book: 'Oseias', bookNum: 28,  title: 'Oseias 1â€“7',        chapters: '1â€“7', marker: N },
  { day: 194, book: 'Oseias', bookNum: 28,  title: 'Oseias 8â€“14',       chapters: '8â€“14', marker: N },
  { day: 195, book: 'Joel', bookNum: 29,    title: 'Joel 1â€“3',          chapters: '1â€“3', marker: N },
  { day: 196, book: 'AmÃ³s', bookNum: 30,    title: 'AmÃ³s 1â€“5',          chapters: '1â€“5', marker: N },
  { day: 197, book: 'AmÃ³s', bookNum: 30,    title: 'AmÃ³s 6â€“9',          chapters: '6â€“9', marker: N },
  { day: 198, book: 'Obadias', bookNum: 31, title: 'Obadias',            chapters: '1', marker: N },
  { day: 198, book: 'Jonas', bookNum: 32,   title: 'Jonas 1â€“4',         chapters: '1â€“4', marker: N },
  { day: 199, book: 'Miqueias', bookNum: 33, title: 'Miqueias 1â€“7',    chapters: '1â€“7', marker: N },
  { day: 200, book: 'Naum', bookNum: 34,    title: 'Naum 1â€“3',          chapters: '1â€“3', marker: N },
  { day: 200, book: 'Habacuque', bookNum: 35, title: 'Habacuque 1â€“3',  chapters: '1â€“3', marker: N },
  { day: 201, book: 'Sofonias', bookNum: 36, title: 'Sofonias 1â€“3',    chapters: '1â€“3', marker: N },
  { day: 201, book: 'Ageu', bookNum: 37,    title: 'Ageu 1â€“2',          chapters: '1â€“2', marker: N },
  { day: 202, book: 'Zacarias', bookNum: 38, title: 'Zacarias 1â€“5',    chapters: '1â€“5', marker: N },
  { day: 203, book: 'Zacarias', bookNum: 38, title: 'Zacarias 6â€“10',   chapters: '6â€“10', marker: N },
  { day: 204, book: 'Zacarias', bookNum: 38, title: 'Zacarias 11â€“14',  chapters: '11â€“14', marker: N },
  { day: 205, book: 'Malaquias', bookNum: 39, title: 'Malaquias 1â€“4',  chapters: '1â€“4', marker: N },
  { day: 206, book: 'Mateus', bookNum: 40,  title: 'Mateus 1â€“4',        chapters: '1â€“4', marker: N },
  { day: 207, book: 'Mateus', bookNum: 40,  title: 'Mateus 5â€“7',        chapters: '5â€“7', marker: N },
  { day: 208, book: 'Mateus', bookNum: 40,  title: 'Mateus 8â€“10',       chapters: '8â€“10', marker: N },
  { day: 209, book: 'Mateus', bookNum: 40,  title: 'Mateus 11â€“13',      chapters: '11â€“13', marker: N },
  { day: 210, book: 'Mateus', bookNum: 40,  title: 'Mateus 14â€“16',      chapters: '14â€“16', marker: N },
  { day: 211, book: 'Mateus', bookNum: 40,  title: 'Mateus 17â€“19',      chapters: '17â€“19', marker: N },
  { day: 212, book: 'Mateus', bookNum: 40,  title: 'Mateus 20â€“22',      chapters: '20â€“22', marker: N },
  { day: 213, book: 'Mateus', bookNum: 40,  title: 'Mateus 23â€“25',      chapters: '23â€“25', marker: N },
  { day: 214, book: 'Mateus', bookNum: 40,  title: 'Mateus 26â€“28',      chapters: '26â€“28', marker: N },
  { day: 215, book: 'Marcos', bookNum: 41,  title: 'Marcos 1â€“3',        chapters: '1â€“3', marker: B },
  { day: 216, book: 'Marcos', bookNum: 41,  title: 'Marcos 4â€“6',        chapters: '4â€“6', marker: B },
  { day: 217, book: 'Marcos', bookNum: 41,  title: 'Marcos 7â€“9',        chapters: '7â€“9', marker: B },
  { day: 218, book: 'Marcos', bookNum: 41,  title: 'Marcos 10â€“12',      chapters: '10â€“12', marker: B },
  { day: 219, book: 'Marcos', bookNum: 41,  title: 'Marcos 13â€“16',      chapters: '13â€“16', marker: B },
  { day: 220, book: 'Lucas', bookNum: 42,   title: 'Lucas 1â€“3',         chapters: '1â€“3', marker: N },
  { day: 221, book: 'Lucas', bookNum: 42,   title: 'Lucas 4â€“6',         chapters: '4â€“6', marker: N },
  { day: 222, book: 'Lucas', bookNum: 42,   title: 'Lucas 7â€“9',         chapters: '7â€“9', marker: N },
  { day: 223, book: 'Lucas', bookNum: 42,   title: 'Lucas 10â€“12',       chapters: '10â€“12', marker: N },
  { day: 224, book: 'Lucas', bookNum: 42,   title: 'Lucas 13â€“16',       chapters: '13â€“16', marker: N },
  { day: 225, book: 'Lucas', bookNum: 42,   title: 'Lucas 17â€“20',       chapters: '17â€“20', marker: N },
  { day: 226, book: 'Lucas', bookNum: 42,   title: 'Lucas 21â€“24',       chapters: '21â€“24', marker: N },
  { day: 227, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 1â€“3',          chapters: '1â€“3', marker: N },
  { day: 228, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 4â€“6',          chapters: '4â€“6', marker: N },
  { day: 229, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 7â€“9',          chapters: '7â€“9', marker: N },
  { day: 230, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 10â€“12',        chapters: '10â€“12', marker: N },
  { day: 231, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 13â€“15',        chapters: '13â€“15', marker: N },
  { day: 232, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 16â€“18',        chapters: '16â€“18', marker: N },
  { day: 233, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 19â€“21',        chapters: '19â€“21', marker: N },
  { day: 234, book: 'Atos', bookNum: 44,    title: 'Atos 1â€“4',          chapters: '1â€“4', marker: B },
  { day: 235, book: 'Atos', bookNum: 44,    title: 'Atos 5â€“8',          chapters: '5â€“8', marker: B },
  { day: 236, book: 'Atos', bookNum: 44,    title: 'Atos 9â€“12',         chapters: '9â€“12', marker: B },
  { day: 237, book: 'Atos', bookNum: 44,    title: 'Atos 13â€“16',        chapters: '13â€“16', marker: B },
  { day: 238, book: 'Atos', bookNum: 44,    title: 'Atos 17â€“20',        chapters: '17â€“20', marker: B },
  { day: 239, book: 'Atos', bookNum: 44,    title: 'Atos 21â€“24',        chapters: '21â€“24', marker: B },
  { day: 240, book: 'Atos', bookNum: 44,    title: 'Atos 25â€“28',        chapters: '25â€“28', marker: B },
  { day: 241, book: 'Romanos', bookNum: 45, title: 'Romanos 1â€“4',       chapters: '1â€“4', marker: N },
  { day: 242, book: 'Romanos', bookNum: 45, title: 'Romanos 5â€“8',       chapters: '5â€“8', marker: N },
  { day: 243, book: 'Romanos', bookNum: 45, title: 'Romanos 9â€“12',      chapters: '9â€“12', marker: N },
  { day: 244, book: 'Romanos', bookNum: 45, title: 'Romanos 13â€“16',     chapters: '13â€“16', marker: N },
  { day: 245, book: '1 CorÃ­ntios', bookNum: 46, title: '1 CorÃ­ntios 1â€“4', chapters: '1â€“4', marker: N },
  { day: 246, book: '1 CorÃ­ntios', bookNum: 46, title: '1 CorÃ­ntios 5â€“8', chapters: '5â€“8', marker: N },
  { day: 247, book: '1 CorÃ­ntios', bookNum: 46, title: '1 CorÃ­ntios 9â€“11', chapters: '9â€“11', marker: N },
  { day: 248, book: '1 CorÃ­ntios', bookNum: 46, title: '1 CorÃ­ntios 12â€“14', chapters: '12â€“14', marker: N },
  { day: 249, book: '1 CorÃ­ntios', bookNum: 46, title: '1 CorÃ­ntios 15â€“16', chapters: '15â€“16', marker: N },
  { day: 250, book: '2 CorÃ­ntios', bookNum: 47, title: '2 CorÃ­ntios 1â€“4', chapters: '1â€“4', marker: N },
  { day: 251, book: '2 CorÃ­ntios', bookNum: 47, title: '2 CorÃ­ntios 5â€“9', chapters: '5â€“9', marker: N },
  { day: 252, book: '2 CorÃ­ntios', bookNum: 47, title: '2 CorÃ­ntios 10â€“13', chapters: '10â€“13', marker: N },
  { day: 253, book: 'GÃ¡latas', bookNum: 48,  title: 'GÃ¡latas 1â€“3',       chapters: '1â€“3', marker: N },
  { day: 254, book: 'GÃ¡latas', bookNum: 48,  title: 'GÃ¡latas 4â€“6',       chapters: '4â€“6', marker: N },
  { day: 255, book: 'EfÃ©sios', bookNum: 49,  title: 'EfÃ©sios 1â€“3',       chapters: '1â€“3', marker: N },
  { day: 256, book: 'EfÃ©sios', bookNum: 49,  title: 'EfÃ©sios 4â€“6',       chapters: '4â€“6', marker: N },
  { day: 257, book: 'Filipenses', bookNum: 50, title: 'Filipenses 1â€“2',  chapters: '1â€“2', marker: N },
  { day: 258, book: 'Filipenses', bookNum: 50, title: 'Filipenses 3â€“4',  chapters: '3â€“4', marker: N },
  { day: 259, book: 'Colossenses', bookNum: 51, title: 'Colossenses 1â€“2', chapters: '1â€“2', marker: N },
  { day: 260, book: 'Colossenses', bookNum: 51, title: 'Colossenses 3â€“4', chapters: '3â€“4', marker: N },
  { day: 261, book: '1 Tessalonicenses', bookNum: 52, title: '1 Tessalonicenses 1â€“5', chapters: '1â€“5', marker: N },
  { day: 262, book: '2 Tessalonicenses', bookNum: 53, title: '2 Tessalonicenses 1â€“3', chapters: '1â€“3', marker: N },
  { day: 263, book: '1 TimÃ³teo', bookNum: 54, title: '1 TimÃ³teo 1â€“3',   chapters: '1â€“3', marker: N },
  { day: 264, book: '1 TimÃ³teo', bookNum: 54, title: '1 TimÃ³teo 4â€“6',   chapters: '4â€“6', marker: N },
  { day: 265, book: '2 TimÃ³teo', bookNum: 55, title: '2 TimÃ³teo 1â€“4',   chapters: '1â€“4', marker: N },
  { day: 266, book: 'Tito', bookNum: 56,    title: 'Tito 1â€“3',          chapters: '1â€“3', marker: N },
  { day: 266, book: 'Filemom', bookNum: 57, title: 'Filemom',            chapters: '1', marker: N },
  { day: 267, book: 'Hebreus', bookNum: 58, title: 'Hebreus 1â€“4',       chapters: '1â€“4', marker: N },
  { day: 268, book: 'Hebreus', bookNum: 58, title: 'Hebreus 5â€“7',       chapters: '5â€“7', marker: N },
  { day: 269, book: 'Hebreus', bookNum: 58, title: 'Hebreus 8â€“10',      chapters: '8â€“10', marker: N },
  { day: 270, book: 'Hebreus', bookNum: 58, title: 'Hebreus 11â€“13',     chapters: '11â€“13', marker: N },
  { day: 271, book: 'Tiago', bookNum: 59,   title: 'Tiago 1â€“5',         chapters: '1â€“5', marker: N },
  { day: 272, book: '1 Pedro', bookNum: 60, title: '1 Pedro 1â€“5',       chapters: '1â€“5', marker: N },
  { day: 273, book: '2 Pedro', bookNum: 61, title: '2 Pedro 1â€“3',       chapters: '1â€“3', marker: N },
  { day: 274, book: '1 JoÃ£o', bookNum: 62,  title: '1 JoÃ£o 1â€“5',        chapters: '1â€“5', marker: N },
  { day: 275, book: '2 JoÃ£o', bookNum: 63,  title: '2 JoÃ£o',             chapters: '1', marker: N },
  { day: 275, book: '3 JoÃ£o', bookNum: 64,  title: '3 JoÃ£o',             chapters: '1', marker: N },
  { day: 275, book: 'Judas', bookNum: 65,   title: 'Judas',              chapters: '1', marker: N },
  { day: 276, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 1â€“3', chapters: '1â€“3', marker: N },
  { day: 277, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 4â€“6', chapters: '4â€“6', marker: N },
  { day: 278, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 7â€“9', chapters: '7â€“9', marker: N },
  { day: 279, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 10â€“13', chapters: '10â€“13', marker: N },
  { day: 280, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 14â€“16', chapters: '14â€“16', marker: N },
  { day: 281, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 17â€“19', chapters: '17â€“19', marker: N },
  { day: 282, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 20â€“22', chapters: '20â€“22', marker: N },

  // Extra days: slower pace through the NT and selected Psalms
  { day: 283, book: 'Salmos', bookNum: 19,  title: 'Salmos 1â€“5',        chapters: '1â€“5', marker: N },
  { day: 284, book: 'Salmos', bookNum: 19,  title: 'Salmos 6â€“10',       chapters: '6â€“10', marker: N },
  { day: 285, book: 'Salmos', bookNum: 19,  title: 'Salmos 11â€“15',      chapters: '11â€“15', marker: N },
  { day: 286, book: 'Salmos', bookNum: 19,  title: 'Salmos 16â€“20',      chapters: '16â€“20', marker: N },
  { day: 287, book: 'Salmos', bookNum: 19,  title: 'Salmos 21â€“25',      chapters: '21â€“25', marker: N },
  { day: 288, book: 'Salmos', bookNum: 19,  title: 'Salmos 26â€“30',      chapters: '26â€“30', marker: N },
  { day: 289, book: 'Salmos', bookNum: 19,  title: 'Salmos 31â€“35',      chapters: '31â€“35', marker: N },
  { day: 290, book: 'Salmos', bookNum: 19,  title: 'Salmos 36â€“40',      chapters: '36â€“40', marker: N },
  { day: 291, book: 'Salmos', bookNum: 19,  title: 'Salmos 41â€“45',      chapters: '41â€“45', marker: N },
  { day: 292, book: 'Salmos', bookNum: 19,  title: 'Salmos 46â€“50',      chapters: '46â€“50', marker: N },
  { day: 293, book: 'Salmos', bookNum: 19,  title: 'Salmos 51â€“55',      chapters: '51â€“55', marker: N },
  { day: 294, book: 'Salmos', bookNum: 19,  title: 'Salmos 56â€“60',      chapters: '56â€“60', marker: N },
  { day: 295, book: 'Salmos', bookNum: 19,  title: 'Salmos 61â€“65',      chapters: '61â€“65', marker: N },
  { day: 296, book: 'Salmos', bookNum: 19,  title: 'Salmos 66â€“70',      chapters: '66â€“70', marker: N },
  { day: 297, book: 'Salmos', bookNum: 19,  title: 'Salmos 71â€“75',      chapters: '71â€“75', marker: N },
  { day: 298, book: 'Salmos', bookNum: 19,  title: 'Salmos 76â€“80',      chapters: '76â€“80', marker: N },
  { day: 299, book: 'Salmos', bookNum: 19,  title: 'Salmos 81â€“85',      chapters: '81â€“85', marker: N },
  { day: 300, book: 'Salmos', bookNum: 19,  title: 'Salmos 86â€“90',      chapters: '86â€“90', marker: N },
  { day: 301, book: 'Salmos', bookNum: 19,  title: 'Salmos 91â€“95',      chapters: '91â€“95', marker: N },
  { day: 302, book: 'Salmos', bookNum: 19,  title: 'Salmos 96â€“100',     chapters: '96â€“100', marker: N },
  { day: 303, book: 'Salmos', bookNum: 19,  title: 'Salmos 101â€“105',    chapters: '101â€“105', marker: N },
  { day: 304, book: 'Salmos', bookNum: 19,  title: 'Salmos 106â€“110',    chapters: '106â€“110', marker: N },
  { day: 305, book: 'Salmos', bookNum: 19,  title: 'Salmos 111â€“115',    chapters: '111â€“115', marker: N },
  { day: 306, book: 'Salmos', bookNum: 19,  title: 'Salmos 116â€“118',    chapters: '116â€“118', marker: N },
  { day: 306, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (1â€“8)',   chapters: '119:1-8', marker: N },
  { day: 307, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (9â€“16)',  chapters: '119:9-16', marker: N },
  { day: 308, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (17â€“24)', chapters: '119:17-24', marker: N },
  { day: 309, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (25â€“32)', chapters: '119:25-32', marker: N },
  { day: 310, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (33â€“40)', chapters: '119:33-40', marker: N },
  { day: 311, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (41â€“48)', chapters: '119:41-48', marker: N },
  { day: 312, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (49â€“56)', chapters: '119:49-56', marker: N },
  { day: 313, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (57â€“64)', chapters: '119:57-64', marker: N },
  { day: 314, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (65â€“72)', chapters: '119:65-72', marker: N },
  { day: 315, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (73â€“80)', chapters: '119:73-80', marker: N },
  { day: 316, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (81â€“88)', chapters: '119:81-88', marker: N },
  { day: 317, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (89â€“96)', chapters: '119:89-96', marker: N },
  { day: 318, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (97â€“104)', chapters: '119:97-104', marker: N },
  { day: 319, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (105â€“112)', chapters: '119:105-112', marker: N },
  { day: 320, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (113â€“120)', chapters: '119:113-120', marker: N },
  { day: 321, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (121â€“128)', chapters: '119:121-128', marker: N },
  { day: 322, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (129â€“136)', chapters: '119:129-136', marker: N },
  { day: 323, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (137â€“144)', chapters: '119:137-144', marker: N },
  { day: 324, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (145â€“152)', chapters: '119:145-152', marker: N },
  { day: 325, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (153â€“160)', chapters: '119:153-160', marker: N },
  { day: 326, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (161â€“168)', chapters: '119:161-168', marker: N },
  { day: 327, book: 'Salmos', bookNum: 19,  title: 'Salmo 119 (169â€“176)', chapters: '119:169-176', marker: N },
  { day: 328, book: 'Salmos', bookNum: 19,  title: 'Salmos 120â€“130',     chapters: '120â€“130', marker: N },
  { day: 329, book: 'Salmos', bookNum: 19,  title: 'Salmos 131â€“140',     chapters: '131â€“140', marker: N },
  { day: 330, book: 'Salmos', bookNum: 19,  title: 'Salmos 141â€“150',     chapters: '141â€“150', marker: N },
  { day: 331, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 1â€“5', chapters: '1â€“5', marker: N },
  { day: 332, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 6â€“10', chapters: '6â€“10', marker: N },
  { day: 333, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 11â€“15', chapters: '11â€“15', marker: N },
  { day: 334, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 16â€“20', chapters: '16â€“20', marker: N },
  { day: 335, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 21â€“26', chapters: '21â€“26', marker: N },
  { day: 336, book: 'ProvÃ©rbios', bookNum: 20, title: 'ProvÃ©rbios 27â€“31', chapters: '27â€“31', marker: N },
  { day: 337, book: 'Mateus', bookNum: 40,  title: 'Mateus 1â€“5',        chapters: '1â€“5', marker: N },
  { day: 338, book: 'Mateus', bookNum: 40,  title: 'Mateus 6â€“10',       chapters: '6â€“10', marker: N },
  { day: 339, book: 'Mateus', bookNum: 40,  title: 'Mateus 11â€“15',      chapters: '11â€“15', marker: N },
  { day: 340, book: 'Mateus', bookNum: 40,  title: 'Mateus 16â€“20',      chapters: '16â€“20', marker: N },
  { day: 341, book: 'Mateus', bookNum: 40,  title: 'Mateus 21â€“24',      chapters: '21â€“24', marker: N },
  { day: 342, book: 'Mateus', bookNum: 40,  title: 'Mateus 25â€“28',      chapters: '25â€“28', marker: N },
  { day: 343, book: 'Lucas', bookNum: 42,   title: 'Lucas 1â€“4',         chapters: '1â€“4', marker: N },
  { day: 344, book: 'Lucas', bookNum: 42,   title: 'Lucas 5â€“8',         chapters: '5â€“8', marker: N },
  { day: 345, book: 'Lucas', bookNum: 42,   title: 'Lucas 9â€“12',        chapters: '9â€“12', marker: N },
  { day: 346, book: 'Lucas', bookNum: 42,   title: 'Lucas 13â€“16',       chapters: '13â€“16', marker: N },
  { day: 347, book: 'Lucas', bookNum: 42,   title: 'Lucas 17â€“20',       chapters: '17â€“20', marker: N },
  { day: 348, book: 'Lucas', bookNum: 42,   title: 'Lucas 21â€“24',       chapters: '21â€“24', marker: N },
  { day: 349, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 1â€“4',          chapters: '1â€“4', marker: N },
  { day: 350, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 5â€“8',          chapters: '5â€“8', marker: N },
  { day: 351, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 9â€“12',         chapters: '9â€“12', marker: N },
  { day: 352, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 13â€“17',        chapters: '13â€“17', marker: N },
  { day: 353, book: 'JoÃ£o', bookNum: 43,    title: 'JoÃ£o 18â€“21',        chapters: '18â€“21', marker: N },
  { day: 354, book: 'Atos', bookNum: 44,    title: 'Atos 1â€“4',          chapters: '1â€“4', marker: B },
  { day: 355, book: 'Atos', bookNum: 44,    title: 'Atos 5â€“8',          chapters: '5â€“8', marker: B },
  { day: 356, book: 'Atos', bookNum: 44,    title: 'Atos 9â€“12',         chapters: '9â€“12', marker: B },
  { day: 357, book: 'Atos', bookNum: 44,    title: 'Atos 13â€“16',        chapters: '13â€“16', marker: B },
  { day: 358, book: 'Atos', bookNum: 44,    title: 'Atos 17â€“20',        chapters: '17â€“20', marker: B },
  { day: 359, book: 'Atos', bookNum: 44,    title: 'Atos 21â€“24',        chapters: '21â€“24', marker: B },
  { day: 360, book: 'Atos', bookNum: 44,    title: 'Atos 25â€“28',        chapters: '25â€“28', marker: B },
  { day: 361, book: 'Romanos', bookNum: 45, title: 'Romanos 1â€“4',       chapters: '1â€“4', marker: N },
  { day: 362, book: 'Romanos', bookNum: 45, title: 'Romanos 5â€“8',       chapters: '5â€“8', marker: N },
  { day: 363, book: 'Romanos', bookNum: 45, title: 'Romanos 9â€“12',      chapters: '9â€“12', marker: N },
  { day: 364, book: 'Romanos', bookNum: 45, title: 'Romanos 13â€“16',     chapters: '13â€“16', marker: N },
  { day: 365, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 1â€“11', chapters: '1â€“11', marker: N },
  { day: 366, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 12â€“22', chapters: '12â€“22', marker: N },
]

export const readingPlan: ReadingDay[] = _rawPlan.map(e => ({
  ...e,
  section: sec(e.bookNum),
}))

export function getNextUncompletedDay(completedDays: Set<number>): number {
  for (let d = 1; d <= 366; d++) {
    if (!completedDays.has(d)) return d
  }
  return 366
}

export function getReadingForDay(day: number): ReadingDay[] {
  return readingPlan.filter(d => d.day === day)
}

const markerSectionMap: Record<string, string> = {
  'tratos-israel': O,
  'congregacao-crista': B,
}

export function getDaysInSection(sectionId: string): ReadingDay[] {
  const marker = markerSectionMap[sectionId]
  if (marker !== undefined) {
    return readingPlan.filter(d => d.marker === marker)
  }
  return readingPlan.filter(d => d.section.id === sectionId)
}

export function getBookVideoUrl(bookNum: number): string | null {
  const slugs: Record<number, string> = {
    1: 'genesis', 2: 'exodo', 3: 'levitico', 4: 'numeros', 5: 'deuteronomio',
    6: 'josue', 7: 'juizes', 8: 'rute', 9: '1-samuel', 10: '2-samuel',
    11: '1-reis', 12: '2-reis', 13: '1-cronicas', 14: '2-cronicas',
    15: 'esdras', 16: 'neemias', 17: 'ester', 18: 'jo', 19: 'salmos',
    20: 'proverbios', 21: 'eclesiastes', 22: 'cantico-de-salomao',
    23: 'isaias', 24: 'jeremias', 25: 'lamentacoes', 26: 'ezequiel',
    27: 'daniel', 28: 'oseias', 29: 'joel', 30: 'amos', 31: 'obadias',
    32: 'jonas', 33: 'miqueias', 34: 'naum', 35: 'habacuque', 36: 'sofonias',
    37: 'ageu', 38: 'zacarias', 39: 'malaquias', 40: 'mateus',
    41: 'marcos', 42: 'lucas', 43: 'joao', 44: 'atos', 45: 'romanos',
    46: '1-corintios', 47: '2-corintios', 48: 'galatas', 49: 'efesios',
    50: 'filipenses', 51: 'colossenses', 52: '1-tessalonicenses',
    53: '2-tessalonicenses', 54: '1-timoteo', 55: '2-timoteo', 56: 'tito',
    57: 'filemom', 58: 'hebreus', 59: 'tiago', 60: '1-pedro', 61: '2-pedro',
    62: '1-joao', 63: '2-joao', 64: '3-joao', 65: 'judas', 66: 'apocalipse',
  }
  const slug = slugs[bookNum]
  if (!slug) return null
  return `https://www.jw.org/pt/biblioteca/videos/introducao-livros-da-biblia/livro-de-${slug}/`
}

export function getWolUrl(bookNum: number, chapter: number): string {
  return `https://wol.jw.org/pt/wol/b/r5/lp-t/nwtsty/${bookNum}/${chapter}`
}

const START_DATE_KEY = 'reading_start_date'

export function isReadingStarted(): boolean {
  return localStorage.getItem(START_DATE_KEY) !== null
}

export function getReadingStartDate(): Date | null {
  const stored = localStorage.getItem(START_DATE_KEY)
  return stored ? new Date(stored) : null
}

export function setReadingStartDate(date: Date): void {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  localStorage.setItem(START_DATE_KEY, d.toISOString())
}

export function clearReadingStartDate(): void {
  localStorage.removeItem(START_DATE_KEY)
}

export function getReadingDayForDate(date: Date): number | null {
  const stored = localStorage.getItem(START_DATE_KEY)
  if (!stored) return null
  const start = new Date(stored)
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000)
  const day = diffDays + 1
  return day >= 1 && day <= 366 ? day : null
}

export function getDateForReadingDay(day: number): Date | null {
  const stored = localStorage.getItem(START_DATE_KEY)
  if (!stored) return null
  const start = new Date(stored)
  const d = new Date(start)
  d.setDate(d.getDate() + day - 1)
  return d
}

export function getTodayReadingDay(): number | null {
  return getReadingDayForDate(new Date())
}

export function getChaptersList(chapters: string): number[] {
  const clean = chapters.replace(/\s/g, '')
  const parts = clean.split(/[â€“-]/)
  let startStr = parts[0]
  if (startStr.includes(':')) startStr = startStr.split(':')[0]
  const endStr = parts[1] ? (parts[1].includes(':') ? parts[1].split(':')[0] : parts[1]) : startStr
  const start = parseInt(startStr)
  const end = parseInt(endStr)
  if (isNaN(start)) return []
  const list: number[] = []
  for (let i = start; i <= end; i++) list.push(i)
  return list
}

export function calcStreak(completedDays: Set<number>): number {
  const today = getTodayReadingDay()
  if (!today) return 0
  let streak = 0
  for (let d = today; d >= 1; d--) {
    if (completedDays.has(d)) streak++
    else break
  }
  return streak
}

```

---

## 5. Pages

### src/pages/Dashboard.tsx
```tsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getReadingForDay, getBookVideoUrl, getNextUncompletedDay,
  isReadingStarted, setReadingStartDate,
  getReadingDayForDate, getChaptersList, calcStreak,
} from '../lib/reading-plan'
import { BookOpen, Flame, ChevronLeft, ChevronRight, CheckCircle, Play, ChevronDown, ChevronUp, Bell, BellOff, BarChart3 } from 'lucide-react'
import { DashboardSkeleton } from '../components/Skeleton'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getSubscriptionStatus, updatePreferredHour } from '../lib/push'
import { loadProfile, saveProfile, loadOnboardingStep, saveOnboardingStep, completeOnboarding, isOnboardingCompleted, type UserProfile } from '../lib/user-profile'

async function syncStartDateToSupabase(date: Date) {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, reading_start_date: date.toISOString().slice(0, 10) }, { onConflict: 'id' })
    }
  } catch { /* ignore */ }
}

function saveAllChaptersChecked(day: number, readings: { chapters: string }[]) {
  const allChecked: Record<string, boolean> = {}
  readings.forEach((r, i) => {
    getChaptersList(r.chapters).forEach(ch => {
      allChecked[`${i}-${ch}`] = true
    })
  })
  localStorage.setItem(`checked_${day}`, JSON.stringify(allChecked))
}

function clearAllChapters(day: number) {
  localStorage.setItem(`checked_${day}`, JSON.stringify({}))
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<number | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushDenied, setPushDenied] = useState(false)
  const [pushHour, setPushHour] = useState(8)
  const [pushLoading, setPushLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [baptismAnniversary, setBaptismAnniversary] = useState<{ years: number; name: string } | null>(null)

  const onboardingDone = isOnboardingCompleted()
  const started = isReadingStarted()
  const [currentDay, setCurrentDay] = useState(() => {
    if (!started) return 0
    const today = getReadingDayForDate(new Date())
    return today || getNextUncompletedDay(completedDays)
  })

  useEffect(() => { loadProgress(); loadPushStatus(); checkBaptismAnniversary() }, [])

  const checkBaptismAnniversary = () => {
    const profile = loadProfile()
    if (!profile?.baptismDate) return
    const today = new Date()
    const baptism = new Date(profile.baptismDate)
    if (today.getMonth() === baptism.getMonth() && today.getDate() === baptism.getDate()) {
      const years = today.getFullYear() - baptism.getFullYear()
      if (years > 0) {
        setBaptismAnniversary({ years, name: profile.name })
        if (Notification.permission === 'granted') {
          new Notification('Feliz aniversÃ¡rio de batismo!', {
            body: `${profile.name}, parabÃ©ns! Hoje completam ${years} ano${years > 1 ? 's' : ''} do seu batismo. Que bÃªnÃ§Ã£o!</data:`,
            icon: '/favicon.ico',
          })
        }
      }
    }
  }

  useEffect(() => {
    if (!isReadingStarted()) {
      const today = getReadingDayForDate(new Date())
      const day = today || getNextUncompletedDay(new Set())
      setCurrentDay(day)
    }
  }, [])

  useEffect(() => {
    if (completedDays.size > 0) {
      const today = getReadingDayForDate(new Date())
      setCurrentDay(today || getNextUncompletedDay(completedDays))
    }
  }, [completedDays])

  const loadProgress = async () => {
    const { data, error: err } = await supabase.from('reading_progress').select('day_number').order('day_number')
    if (err) {
      setError('Erro ao carregar progresso. Verifique sua conexÃ£o.')
      setLoading(false)
      return
    }
    if (data) setCompletedDays(new Set(data.map(r => r.day_number)))
    setLoading(false)
  }

  const loadPushStatus = async () => {
    if (!isPushSupported()) return
    setPushSupported(true)
    if ('Notification' in window && Notification.permission === 'denied') {
      setPushDenied(true)
      return
    }
    const status = await getSubscriptionStatus()
    setPushSubscribed(status.subscribed)
    if (status.preferredHour !== null) setPushHour(status.preferredHour)
  }

  const togglePush = async () => {
    setPushLoading(true)
    if (pushSubscribed) {
      await unsubscribeFromPush()
      setPushSubscribed(false)
    } else {
      const ok = await subscribeToPush(pushHour)
      setPushSubscribed(ok)
    }
    setPushLoading(false)
  }

  const changePushHour = async (hour: number) => {
    setPushHour(hour)
    if (pushSubscribed) await updatePreferredHour(hour)
  }

  const readings = currentDay > 0 ? getReadingForDay(currentDay) : []
  const daysRead = completedDays.size
  const streak = calcStreak(completedDays)
  const pct = daysRead > 0 ? Math.round((daysRead / 366) * 100) : 0
  const isComplete = currentDay > 0 && completedDays.has(currentDay)
  const planComplete = daysRead === 366

  const nextDays: { day: number; title: string; book: string }[] = []
  if (currentDay > 0) {
    let found = 0
    for (let dd = currentDay + 1; dd <= 366 && found < 3; dd++) {
      if (!completedDays.has(dd)) {
        const r = getReadingForDay(dd)
        if (r.length > 0) { nextDays.push({ day: dd, title: r[0].title, book: r[0].book }); found++ }
      }
    }
  }

  const pastDays: { day: number; title: string; book: string }[] = []
  if (currentDay > 0) {
    for (let dd = currentDay - 1; dd >= 1 && pastDays.length < 3; dd--) {
      if (completedDays.has(dd)) {
        const r = getReadingForDay(dd)
        if (r.length > 0) pastDays.unshift({ day: dd, title: r[0].title, book: r[0].book })
      }
    }
  }

  const toggleComplete = async (day: number) => {
    setChecking(day)
    setError(null)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setChecking(null); return }
    if (!started) {
      setReadingStartDate(new Date())
      syncStartDateToSupabase(new Date())
    }
    if (completedDays.has(day)) {
      const { error: err } = await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', day)
      if (err) { setError('Erro ao salvar. Tente novamente.'); setChecking(null); return }
      setCompletedDays(prev => { const n = new Set(prev); n.delete(day); return n })
      clearAllChapters(day)
    } else {
      const { error: err } = await supabase.from('reading_progress').insert({ user_id: user.id, day_number: day })
      if (err) { setError('Erro ao salvar. Tente novamente.'); setChecking(null); return }
      setCompletedDays(prev => { const n = new Set(prev); n.add(day); return n })
      saveAllChaptersChecked(day, readings)
    }
    setChecking(null)
  }

  if (loading) return <DashboardSkeleton />

  if (!onboardingDone) {
    return (
      <Onboarding
        onComplete={() => {
          completeOnboarding()
          const now = new Date()
          setReadingStartDate(now)
          syncStartDateToSupabase(now)
          const today = getReadingDayForDate(new Date())
          const day = today || getNextUncompletedDay(new Set())
          setCurrentDay(day)
          navigate('/')
        }}
      />
    )
  }

  if (planComplete) {
    return (
      <div className="p-4 text-center py-16 space-y-4 max-w-lg mx-auto">
        <CheckCircle size={56} className="text-accent mx-auto" />
        <h1 className="text-2xl font-bold text-accent">BÃ­blia completa!</h1>
        <p className="text-text-muted">VocÃª leu a BÃ­blia inteira em 366 dias. IncrÃ­vel!</p>
        <button
          onClick={() => navigate('/calendario')}
          className="text-sm text-accent hover:text-accent-light transition-colors"
        >
          Ver calendÃ¡rio
        </button>
      </div>
    )
  }

  const ringR = 52
  const circumference = 2 * Math.PI * ringR
  const offset = circumference * (1 - daysRead / 366)

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs ml-2">âœ•</button>
        </div>
      )}
      {baptismAnniversary && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center space-y-1">
          <p className="text-purple-400 text-sm font-medium">Feliz aniversÃ¡rio de batismo! ðŸŽ‰</p>
          <p className="text-text-muted text-xs">
            {baptismAnniversary.name}, parabÃ©ns! Hoje completam <span className="text-purple-400 font-bold">{baptismAnniversary.years} ano{baptismAnniversary.years > 1 ? 's' : ''}</span> do seu batismo. Que bÃªnÃ§Ã£o!
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Flame size={32} className="text-orange-500 flame-animate" />
              {streak > 0 && streak % 7 === 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary leading-none">{streak}</div>
              <div className="text-xs text-text-muted mt-1">dias seguidos</div>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <CheckCircle size={20} className="text-green-400" />
            <div>
              <div className="text-2xl font-bold text-text-primary leading-none">{daysRead}</div>
              <div className="text-xs text-text-muted mt-1">dias lidos</div>
            </div>
          </div>
        </div>
        {isComplete ? (
          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
            <CheckCircle size={16} />
            <span>Leitura concluÃ­da</span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/stats')}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent text-sm transition-colors"
          >
            <BarChart3 size={14} />
            <span>EstatÃ­sticas</span>
          </button>
        )}
      </div>

      <div className="flex justify-center py-2">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={ringR} fill="none" stroke="#1e3050" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={ringR} fill="none" stroke="#4c6daa" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
               className="transition-all duration-1000 progress-ring"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-text-primary">{pct}%</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => currentDay > 1 && setCurrentDay(currentDay - 1)}
          disabled={currentDay <= 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-card border border-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed btn-ghost"
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>
        <button
          onClick={() => currentDay < 366 && setCurrentDay(currentDay + 1)}
          disabled={currentDay >= 366}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-card border border-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed btn-ghost"
        >
          <span>PrÃ³ximo</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-accent" />
            <div>
              <h2 className="font-semibold text-text-primary">Leitura atual</h2>
              <p className="text-xs text-text-muted">Dia {currentDay} do plano</p>
            </div>
          </div>
          <button
            onClick={() => toggleComplete(currentDay)}
            disabled={checking === currentDay}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all btn-primary ${
              isComplete
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-orange-500 text-white hover:bg-orange-400'
            }`}
          >
            {isComplete ? 'Leitura concluÃ­da' : checking === currentDay ? '...' : 'Concluir leitura'}
          </button>
        </div>
        <div className="p-4 space-y-3">
          {readings.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`text-base font-mono ${r.marker === 'ðŸ”¸' ? 'text-orange-400' : r.marker === 'ðŸ”¹' ? 'text-blue-400' : 'text-text-muted'}`}>{r.marker}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary text-sm">{r.title}</h3>
                <p className="text-xs text-text-muted mt-0.5">{r.section.name}</p>
              </div>
              <button
                onClick={() => navigate(`/ler/${currentDay}`)}
                className="flex items-center gap-1 text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-light transition-colors shrink-0 btn-primary"
              >
                Iniciar <ChevronRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <VideoCard readings={readings} />

      {pastDays.length > 0 && (
      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden card">
          <button
            onClick={() => setShowPast(!showPast)}
            className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition-colors btn-ghost"
          >
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Dias anteriores</h3>
            {showPast ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          {showPast && (
            <div className="px-4 pb-4 space-y-1 border-t border-white/5 pt-3">
              {pastDays.map(d => (
                <button
                  key={d.day}
                  onClick={() => navigate(`/ler/${d.day}`)}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-colors"
                >
                  <CheckCircle size={14} className="text-green-400 shrink-0" />
                  <span className="text-xs text-text-muted w-10 shrink-0">Dia {d.day}</span>
                  <span className="flex-1 text-sm text-text-primary truncate">{d.title}</span>
                  <ChevronRight size={14} className="text-text-muted shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {nextDays.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 card">
          <h3 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">PrÃ³ximos dias</h3>
          <div className="space-y-1">
            {nextDays.map(d => (
              <button
                key={d.day}
                onClick={() => navigate(`/ler/${d.day}`)}
                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-colors"
              >
                <span className="text-xs text-text-muted w-10 shrink-0">Dia {d.day}</span>
                <span className="flex-1 text-sm text-text-primary truncate">{d.title}</span>
                <ChevronRight size={14} className="text-text-muted shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {pushSupported && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 card">
          {pushDenied ? (
            <div className="flex items-center gap-3">
              <BellOff size={18} className="text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">Lembrete diÃ¡rio</p>
                <p className="text-xs text-text-muted">
                  NotificaÃ§Ãµes bloqueadas. Ative nas configuraÃ§Ãµes do navegador.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {pushSubscribed ? <Bell size={18} className="text-accent" /> : <BellOff size={18} className="text-text-muted" />}
                  <div>
                    <p className="text-sm font-medium text-text-primary">Lembrete diÃ¡rio</p>
                    <p className="text-xs text-text-muted">
                      {pushSubscribed ? `NotificaÃ§Ã£o Ã s ${String(pushHour).padStart(2, '0')}:00` : 'Ative para receber um lembrete'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={togglePush}
                  disabled={pushLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors btn-ghost ${
                    pushSubscribed ? 'bg-accent' : 'bg-bg-hover'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    pushSubscribed ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
              {pushSubscribed && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">HorÃ¡rio:</span>
                    <div className="flex gap-1 flex-wrap">
                      {[7, 8, 9, 12, 18, 20].map(h => (
                        <button
                          key={h}
                          onClick={() => changePushHour(h)}
                          className={`px-2 py-1 rounded-lg text-xs transition-colors btn-ghost ${
                            pushHour === h ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted'
                          }`}
                        >
                          {String(h).padStart(2, '0')}:00
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function VideoCard({ readings }: { readings: { bookNum: number; book: string }[] }) {
  const r = readings[0]
  if (!r) return null
  const videoUrl = getBookVideoUrl(r.bookNum)
  if (!videoUrl) return null
  return (
    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block bg-purple rounded-2xl p-3 hover:bg-purple/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Play size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">VÃ­deo: IntroduÃ§Ã£o a {r.book}</p>
          <p className="text-xs text-white/70 truncate">Assistir vÃ­deo</p>
        </div>
      </div>
    </a>
  )
}

function Onboarding({ onComplete }: { onComplete: () => void }) {
  const saved = loadProfile()
  const [step, setStep] = useState(() => loadOnboardingStep())
  const [profile, setProfile] = useState<UserProfile>(saved || { name: '', age: '', baptized: false, baptismDate: null, intendsToGetBaptized: null, photo: null })
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 0 || step === 1) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (step === 3) {
      setTimeout(() => dateRef.current?.focus(), 100)
    }
  }, [step])

  const goStep = (s: number) => {
    setStep(s)
    saveOnboardingStep(s)
  }

  const handleNext = () => {
    if (step === 0) {
      if (!input.trim()) return
      const newProfile = { ...profile, name: input.trim() }
      setProfile(newProfile)
      saveProfile(newProfile)
      setInput('')
      goStep(1)
    } else if (step === 1) {
      if (!input.trim()) return
      const newProfile = { ...profile, age: input.trim() }
      setProfile(newProfile)
      saveProfile(newProfile)
      setInput('')
      goStep(2)
    }
  }

  const handleBaptized = (yes: boolean) => {
    const newProfile = { ...profile, baptized: yes }
    setProfile(newProfile)
    saveProfile(newProfile)
    goStep(yes ? 3 : 4)
  }

  const handleBaptismDate = () => {
    if (!input.trim()) return
    const newProfile = { ...profile, baptismDate: input.trim() }
    setProfile(newProfile)
    saveProfile(newProfile)
    setInput('')
    goStep(5)
  }

  const handleIntends = (yes: boolean) => {
    const newProfile = { ...profile, intendsToGetBaptized: yes }
    setProfile(newProfile)
    saveProfile(newProfile)
    goStep(5)
  }

  const handleStart = () => {
    saveProfile(profile)
    localStorage.removeItem('onboarding_step')
    onComplete()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNext()
  }

  if (step === 5) {
    return (
      <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
        <div className="text-center py-4 space-y-3">
          <h1 className="text-xl font-bold text-text-primary">Ler a BÃ­blia Ã© sempre bom, nÃ©?</h1>
          <p className="text-text-muted text-sm">Vou te explicar como funciona:</p>
        </div>

        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            VocÃª pode ler os livros da BÃ­blia pela ordem ou por assunto, com base nas categorias
            na aba SeÃ§Ãµes. Se ler um grupo de capÃ­tulos por dia, vocÃª lerÃ¡ a BÃ­blia inteira em um ano.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">ðŸ”¸</span>
              <p>Leia os dias com o marcador <span className="font-semibold text-orange-400">Laranja</span> para ter uma visÃ£o histÃ³rica geral dos tratos de Deus com os israelitas.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">ðŸ”¹</span>
              <p>Leia os dias com o marcador <span className="font-semibold text-blue-400">Azul</span> para ter uma visÃ£o cronolÃ³gica geral do desenvolvimento da congregaÃ§Ã£o cristÃ£.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors btn-primary"
        >
          ComeÃ§ar agora
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pt-16 fade-in">
      {step === 0 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            OlÃ¡, que bom ver vocÃª aqui!<br />
            Antes de comeÃ§armos, me diga seu nome:
          </h1>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite seu nome"
            className="w-full px-4 py-3 rounded-xl bg-bg-card border border-white/10 text-text-primary text-center text-lg focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
          />
          <button
            onClick={handleNext}
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            PrÃ³ximo
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Prazer em conhecer vocÃª, <span className="font-bold">{profile.name}</span>!<br />
            <span className="font-normal">Pode me dizer sua idade?<br />Quantos anos vocÃª tem?</span>
          </h1>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: 25"
            className="w-full px-4 py-3 rounded-xl bg-bg-card border border-white/10 text-text-primary text-center text-lg focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
          />
          <button
            onClick={handleNext}
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            PrÃ³ximo
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            VocÃª jÃ¡ dedicou sua vida<br />a JeovÃ¡ e se batizou?
          </h1>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleBaptized(true)}
              className="px-10 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary"
            >
              Sim
            </button>
            <button
              onClick={() => handleBaptized(false)}
              className="px-10 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary"
            >
              NÃ£o
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Quando vocÃª se batizou?
          </h1>
          <input
            ref={dateRef}
            type="date"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleBaptismDate() }}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl bg-bg-card border border-white/10 text-text-primary text-center text-lg focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleBaptismDate}
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            PrÃ³ximo
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            VocÃª pretende se batizar<br />como Testemunha de JeovÃ¡<br />um dia?
          </h1>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleIntends(true)}
              className="px-10 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary"
            >
              Sim
            </button>
            <button
              onClick={() => handleIntends(false)}
              className="px-10 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors btn-primary"
            >
              NÃ£o
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

### src/pages/ReadingDayPage.tsx
```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getReadingForDay, getBookVideoUrl, getWolUrl, isReadingStarted, setReadingStartDate, getChaptersList } from '../lib/reading-plan'
import { getBookIntroVideo } from '../lib/jw-media'
import { ArrowLeft, CheckCircle, Play, Square, CheckSquare, ExternalLink, ChevronLeft, ChevronRight, Trash2, Share2 } from 'lucide-react'
import { ReadingDaySkeleton } from '../components/Skeleton'
import { shareContent, getShareText } from '../lib/share'

const chapterKey = (readingIdx: number, chapter: number) => `${readingIdx}-${chapter}`

export default function ReadingDayPage() {
  const { day } = useParams()
  const navigate = useNavigate()
  const dayNum = parseInt(day || '1')
  const readings = getReadingForDay(dayNum)
  const [completed, setCompleted] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteStatus, setNoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [checkedChapters, setCheckedChapters] = useState<Record<string, boolean>>({})
  const [videoUrls, setVideoUrls] = useState<Record<number, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  const totalChapters = readings.reduce((sum, r) => sum + getChaptersList(r.chapters).length, 0)
  const checkedCount = readings.reduce((sum, r, i) => {
    const chapters = getChaptersList(r.chapters)
    return sum + chapters.filter(ch => checkedChapters[chapterKey(i, ch)]).length
  }, 0)
  const allChaptersChecked = totalChapters > 0 && checkedCount === totalChapters

  const persistChecked = (next: Record<string, boolean>) => {
    localStorage.setItem(`checked_${dayNum}`, JSON.stringify(next))
  }

  const checkAllChapters = () => {
    const allChecked: Record<string, boolean> = {}
    readings.forEach((r, i) => {
      getChaptersList(r.chapters).forEach(ch => {
        allChecked[chapterKey(i, ch)] = true
      })
    })
    setCheckedChapters(allChecked)
    persistChecked(allChecked)
  }

  const uncheckAllChapters = () => {
    setCheckedChapters({})
    persistChecked({})
  }

  const ensureStartDate = () => {
    if (dayNum === 1 && !isReadingStarted()) {
      const now = new Date()
      setReadingStartDate(now)
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase.from('profiles').upsert({ id: data.user.id, reading_start_date: now.toISOString().slice(0, 10) }, { onConflict: 'id' })
        }
      })
    }
  }

  const toggleChapter = (key: string) => {
    const next = { ...checkedChapters, [key]: !checkedChapters[key] }
    setCheckedChapters(next)
    persistChecked(next)

    const checked = Object.values(next).filter(Boolean).length
    if (checked === totalChapters && !completed) {
      ensureStartDate()
      triggerConfetti()
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase.from('reading_progress').insert({ user_id: data.user.id, day_number: dayNum }).then(() => setCompleted(true))
        }
      })
    } else if (checked < totalChapters && completed) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) supabase.from('reading_progress').delete().eq('user_id', data.user.id).eq('day_number', dayNum)
      })
      setCompleted(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [dayNum])

  const loadAll = async () => {
    const { data } = await supabase.from('reading_progress').select('day_number').eq('day_number', dayNum).maybeSingle()
    const isCompleted = !!data
    setCompleted(isCompleted)

    let saved: Record<string, boolean> | null = null
    try {
      const raw = localStorage.getItem(`checked_${dayNum}`)
      if (raw) saved = JSON.parse(raw)
    } catch {}

    if (isCompleted && (!saved || Object.keys(saved).length === 0)) {
      checkAllChapters()
    } else if (saved && Object.keys(saved).length > 0) {
      setCheckedChapters(saved)
    }

    const { data: noteData } = await supabase.from('notes').select('id, content').eq('day_number', dayNum).maybeSingle()
    if (noteData) {
      setNoteContent(noteData.content)
      setNoteId(noteData.id)
    }

    const uniqueBooks = [...new Set(readings.map(r => r.bookNum))]
    const urls: Record<number, string | null> = {}
    await Promise.all(uniqueBooks.map(async (bookNum) => {
      const result = await getBookIntroVideo(bookNum)
      urls[bookNum] = result?.url || null
    }))
    setVideoUrls(urls)
    setLoading(false)
  }

  const toggleComplete = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    if (completed) {
      await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', dayNum)
      setCompleted(false)
      uncheckAllChapters()
    } else {
      ensureStartDate()
      await supabase.from('reading_progress').insert({ user_id: user.id, day_number: dayNum })
      setCompleted(true)
      checkAllChapters()
      triggerConfetti()
    }
  }

  const saveNote = useCallback(async (content: string) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    setNoteStatus('saving')
    try {
      if (noteId) {
        const { error } = await supabase.from('notes').update({ content, updated_at: new Date().toISOString() }).eq('id', noteId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('notes').insert({ user_id: user.id, day_number: dayNum, content }).select('id').single()
        if (error) throw error
        if (data) setNoteId(data.id)
      }
      setNoteStatus('saved')
    } catch {
      setNoteStatus('error')
    }
  }, [noteId, dayNum])

  const deleteNote = async () => {
    if (!noteId) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    await supabase.from('notes').delete().eq('id', noteId)
    setNoteId(null)
    setNoteContent('')
    setNoteStatus('idle')
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!noteContent.trim()) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => saveNote(noteContent), 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [noteContent, saveNote])

  if (loading) return <ReadingDaySkeleton />

  if (readings.length === 0) {
    return (
      <div className="p-4 text-center text-text-muted">
        <p>Dia {dayNum} nÃ£o encontrado</p>
        <button onClick={() => navigate('/')} className="text-accent mt-2">Voltar</button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-sm btn-ghost">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dia {dayNum}</h1>
        <button
          onClick={toggleComplete}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all btn-primary ${
            completed
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-orange-500 text-white hover:bg-orange-400'
          }`}
        >
          <CheckCircle size={16} />
          {completed ? 'ConcluÃ­do' : 'Marcar lido'}
        </button>
      </div>

      {totalChapters > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Progresso da leitura</span>
            <span className="text-xs text-text-muted">{checkedCount}/{totalChapters} capÃ­tulos</span>
          </div>
          <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${totalChapters > 0 ? (checkedCount / totalChapters) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {readings.map((r, i) => {
        const chaptersList = getChaptersList(r.chapters)
        const videoUrl = videoUrls[r.bookNum]

        return (
          <div key={i} className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden card">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <span className={`text-xl ${r.marker === 'ðŸ”¸' ? 'text-orange-400' : r.marker === 'ðŸ”¹' ? 'text-blue-400' : 'text-text-muted'}`}>{r.marker}</span>
              <div className="flex-1">
                <h2 className="font-semibold text-text-primary">{r.title}</h2>
                <p className="text-xs text-text-muted mt-0.5">{r.section.name}</p>
              </div>
              <button
                onClick={() => shareContent(
                  `Dia ${dayNum} â€” ${r.title}`,
                  getShareText({ dayNumber: dayNum, title: r.title, book: r.book, sectionName: r.section.name }),
                  `https://leitura-da-biblia.vercel.app/ler/${dayNum}`
                )}
                className="text-text-muted hover:text-accent p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                <Share2 size={16} />
              </button>
            </div>

            {videoUrl && (
              <div className="border-b border-white/5">
                <video
                  src={videoUrl}
                  controls
                  preload="metadata"
                  className="w-full aspect-video bg-black/40"
                  poster={videoUrl.replace(/\.mp4$/, '.jpg')}
                >
                  <p>Seu navegador nÃ£o suporta vÃ­deo.</p>
                </video>
              </div>
            )}
            {!videoUrl && videoUrls[r.bookNum] !== undefined && (() => {
              const fallbackUrl = getBookVideoUrl(r.bookNum)
              if (!fallbackUrl) return null
              return (
                <a
                  href={fallbackUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-accent/5 border-b border-white/5 hover:bg-accent/10 transition-colors"
                >
                  <Play size={16} className="text-accent shrink-0" />
                  <span className="text-sm text-text-primary flex-1">VÃ­deo de introduÃ§Ã£o â€” {r.book}</span>
                  <ExternalLink size={14} className="text-text-muted" />
                </a>
              )
            })()}

            <div className="p-4">
              <h3 className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wider">CapÃ­tulos</h3>
              <div className="flex flex-col gap-1.5">
                {chaptersList.map(ch => {
                  const key = chapterKey(i, ch)
                  const checked = !!checkedChapters[key]
                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChapter(key)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left ${
                        checked
                          ? 'bg-accent/10 text-accent'
                          : 'bg-bg-hover text-text-secondary hover:bg-accent/10'
                      }`}
                    >
                      {checked ? <CheckSquare size={18} className="shrink-0" /> : <Square size={18} className="shrink-0 text-text-muted" />}
                      <span className="flex-1">{r.book} {ch}</span>
                      <a
                        href={getWolUrl(r.bookNum, ch)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-white bg-accent px-2.5 py-1 rounded-lg hover:bg-accent-light transition-colors shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        Ler
                      </a>
                    </button>
                  )
                })}
              </div>
              {allChaptersChecked && (
                <div className="mt-3 flex items-center justify-center gap-2 bg-green-500/10 text-green-400 py-2.5 rounded-xl text-sm font-medium">
                  <CheckCircle size={16} /> Todos os capÃ­tulos lidos
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-muted">Suas anotaÃ§Ãµes</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              noteStatus === 'saving' ? 'text-text-muted' : noteStatus === 'error' ? 'text-red-400' : noteContent.trim() ? 'text-green-400' : 'opacity-0'
            }`}>
              {noteStatus === 'saving' ? 'Salvando...' : noteStatus === 'error' ? 'Erro ao salvar' : 'âœ“ Salvo'}
            </span>
            {noteContent.trim() && (
              <button
                onClick={() => shareContent(
                  `Minha anotaÃ§Ã£o â€” Dia ${dayNum}`,
                  `ðŸ“ Minha anotaÃ§Ã£o â€” Dia ${dayNum}\n\n"${noteContent}"\n\nðŸ“– Leitura da BÃ­blia em 1 Ano`
                )}
                className="text-text-muted hover:text-accent transition-colors p-1"
              >
                <Share2 size={14} />
              </button>
            )}
            {noteId && (
              <button onClick={deleteNote} className="text-text-muted hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="O que vocÃª aprendeu hoje?"
          maxLength={5000}
          className="w-full bg-bg-hover border border-white/5 rounded-xl p-3 text-sm text-text-primary placeholder-text-muted resize-none h-28 focus:outline-none focus:border-accent/30"
        />
      </div>

      <div className="flex gap-3">
        {dayNum > 1 && (
          <button
            onClick={() => navigate(`/ler/${dayNum - 1}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-bg-card border border-white/5 rounded-xl py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors"
          >
            <ChevronLeft size={16} /> Dia {dayNum - 1}
          </button>
        )}
        {dayNum < 366 && (
          <button
            onClick={() => navigate(`/ler/${dayNum + 1}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-bg-card border border-white/5 rounded-xl py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors"
          >
            Dia {dayNum + 1} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

```

### src/pages/Profile.tsx
```tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadProfile, saveProfile, type UserProfile } from '../lib/user-profile'
import { getReadingStartDate, calcStreak, getTodayReadingDay } from '../lib/reading-plan'
import { Flame, BookOpen, Calendar, Clock, User, Mail, LogOut, ChevronLeft, Check, Camera } from 'lucide-react'

function InlineField({ value, onSave, type = 'text' }: {
  value: string
  onSave: (v: string) => void
  type?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing) setTimeout(() => ref.current?.focus(), 50)
  }, [editing])

  function confirm() {
    const v = type === 'number' ? draft.replace(/\D/g, '') : draft.trim()
    if (v && v !== value) {
      onSave(v)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        className="w-full bg-bg-hover border border-accent/50 rounded-lg px-2 py-0.5 text-sm text-text-primary focus:outline-none"
      />
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="text-left group w-full">
      <p className="text-sm text-text-primary group-hover:text-accent transition-colors">
        {value || 'â€”'}
        {saved && <Check size={12} className="inline ml-1 text-green-400" />}
      </p>
    </button>
  )
}

function BibleIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" className={className}>
      <path fill="currentColor" d="M25.0625 38.457C26.754 35.7227 32.6641 32.3516 44.7266 34.8828C44.8281 34.9023 44.9258 34.8789 45.0078 34.8125C45.0898 34.75 45.1328 34.6563 45.1328 34.5547L45.0859 11.3711C45.0859 11.25 45.1406 11.1484 45.2461 11.0859C45.3438 11.0195 45.4609 11.0156 45.5703 11.0664L47.3047 11.9102C47.4258 11.9688 47.4922 12.082 47.4922 12.2148L47.5039 38.0234C47.5039 38.1172 47.4688 38.1953 47.4063 38.2617C47.3398 38.3281 47.2578 38.3594 47.168 38.3594L27.8438 38.3008C25.8281 41.7188 22.1641 41.7188 20.1484 38.3008L0.828125 38.3594C0.734375 38.3594 0.652344 38.3242 0.589844 38.2617C0.523438 38.1953 0.488281 38.1172 0.488281 38.0234L0.5 12.2148C0.5 12.082 0.570312 11.9688 0.6875 11.9102L2.42188 11.0664C2.53125 11.0117 2.64844 11.0195 2.75 11.0859C2.85156 11.1484 2.90625 11.25 2.90625 11.3711L2.86328 34.5547C2.86328 34.6602 2.90625 34.75 2.98438 34.8125C3.06641 34.8789 3.16406 34.9023 3.26563 34.8828C15.3281 32.3516 21.2383 35.7227 22.9297 38.457C23.3242 39.0938 24.7031 39.043 25.0625 38.457Z" fillRule="evenodd"/>
      <path fill="currentColor" d="M24.7539 34.6094L24.7617 11.2539C24.7617 11.0586 24.8359 10.8906 24.9805 10.7578C26.3047 9.53906 33.5703 3.48828 43.4688 7.51953C43.7266 7.625 43.8867 7.86328 43.8867 8.14453V32.1289C43.8867 32.3438 43.7969 32.5273 43.6328 32.6563C43.4688 32.7891 43.2734 32.8359 43.0664 32.7852C40.5156 32.1797 32.4648 30.7852 25.7813 35.1719C25.5703 35.3086 25.3203 35.3203 25.1016 35.1992C24.8789 35.0781 24.7539 34.8594 24.7539 34.6055V34.6094Z" fillRule="evenodd"/>
      <path fill="currentColor" d="M23.2969 34.6094L23.2891 11.2539C23.2891 11.0586 23.2109 10.8906 23.0703 10.7578C21.7461 9.53906 14.4805 3.48828 4.58203 7.51953C4.32422 7.625 4.16406 7.86328 4.16406 8.14453V32.1289C4.16406 32.3438 4.25391 32.5273 4.41797 32.6563C4.58203 32.7891 4.77734 32.8359 4.98047 32.7852C7.53516 32.1797 15.582 30.7852 22.2695 35.1719C22.4805 35.3086 22.7305 35.3203 22.9492 35.1992C23.168 35.0781 23.2969 34.8594 23.2969 34.6055V34.6094Z" fillRule="evenodd"/>
    </svg>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState('')
  const [daysRead, setDaysRead] = useState(0)
  const [streak, setStreak] = useState(0)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [currentDay, setCurrentDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const p = loadProfile()
      setProfile(p)

      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)

      if (user) {
        const { data: progress } = await supabase
          .from('reading_progress')
          .select('day_number')
          .eq('user_id', user.id)
        const completedDays = new Set(progress?.map(p => p.day_number) || [])
        setDaysRead(completedDays.size)
        setStreak(calcStreak(completedDays))
      }

      setStartDate(getReadingStartDate())
      setCurrentDay(getTodayReadingDay())
    } finally {
      setLoading(false)
    }
  }

  function updateProfile(patch: Partial<UserProfile>) {
    if (!profile) return
    const updated = { ...profile, ...patch }
    saveProfile(updated)
    setProfile(updated)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 200
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        const base64 = canvas.toDataURL('image/jpeg', 0.7)
        updateProfile({ photo: base64 })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function formatDate(d: Date | null) {
    if (!d) return 'â€”'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Carregando...</div>
      </div>
    )
  }

  const pct = daysRead > 0 ? Math.round((daysRead / 366) * 100) : 0

  return (
    <div className="min-h-screen bg-bg-dark pb-24">
      <div className="px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-sm mb-4">
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-3 overflow-hidden group"
        >
          {profile?.photo ? (
            <img src={profile.photo} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-accent" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <h1 className="text-xl font-bold text-text-primary">{profile?.name || 'UsuÃ¡rio'}</h1>
        <p className="text-text-muted text-sm mt-0.5">
          {profile?.age ? `${profile.age} anos` : 'Idade nÃ£o informada'}
        </p>
      </div>

      <div className="px-4 space-y-3">
        {/* Dados Pessoais */}
        <div className="bg-bg-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Dados Pessoais</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <User size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">Nome</p>
                <InlineField
                  value={profile?.name || ''}
                  onSave={v => updateProfile({ name: v })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">Idade</p>
                <InlineField
                  value={profile?.age || ''}
                  type="number"
                  onSave={v => updateProfile({ age: v })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <BibleIcon className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">Batizado</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => updateProfile({ baptized: true, baptismDate: profile?.baptismDate || new Date().toISOString().slice(0, 10) })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      profile?.baptized ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => updateProfile({ baptized: false, baptismDate: null })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      !profile?.baptized ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    NÃ£o
                  </button>
                </div>
              </div>
            </div>

            {profile?.baptized && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Calendar size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">Data de batismo</p>
                  <input
                    type="date"
                    value={profile?.baptismDate || ''}
                    onChange={e => updateProfile({ baptismDate: e.target.value })}
                    className="w-full bg-bg-hover border border-white/10 rounded-lg px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:border-accent mt-1"
                  />
                </div>
              </div>
            )}

            {profile?.baptized === false && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <BibleIcon className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">Pretende se batizar</p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => updateProfile({ intendsToGetBaptized: true })}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        profile?.intendsToGetBaptized === true ? 'bg-orange-500 text-white' : 'bg-bg-hover text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => updateProfile({ intendsToGetBaptized: false })}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        profile?.intendsToGetBaptized === false ? 'bg-orange-500 text-white' : 'bg-bg-hover text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      NÃ£o
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progresso de Leitura */}
        <div className="bg-bg-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Progresso de Leitura</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={18} className="text-orange-400" />
                <span className="text-2xl font-bold text-orange-400">{streak}</span>
              </div>
              <p className="text-xs text-text-muted">SequÃªncia atual</p>
            </div>
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen size={18} className="text-accent" />
                <span className="text-2xl font-bold text-accent">{daysRead}</span>
              </div>
              <p className="text-xs text-text-muted">Dias lidos</p>
            </div>
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-green-400">{pct}%</span>
              </div>
              <p className="text-xs text-text-muted">ConcluÃ­do</p>
            </div>
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-text-primary">{currentDay || 'â€”'}</span>
              </div>
              <p className="text-xs text-text-muted">Dia atual</p>
            </div>
          </div>
          {startDate && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-sm text-text-muted">
              <Clock size={14} />
              <span>InÃ­cio: {formatDate(startDate)}</span>
            </div>
          )}
          <div className="mt-3">
            <div className="w-full bg-bg-hover rounded-full h-2">
              <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Conta */}
        <div className="bg-bg-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Conta</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Mail size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted">E-mail</p>
              <p className="text-sm text-text-primary">{email || 'â€”'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl p-4 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium">Sair da conta</span>
        </button>
      </div>
    </div>
  )
}

```

### src/pages/Calendar.tsx
```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getReadingForDay, isReadingStarted, getReadingStartDate,
  getReadingDayForDate, clearReadingStartDate,
  getTodayReadingDay,
} from '../lib/reading-plan'
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, RotateCcw } from 'lucide-react'
import { CalendarSkeleton } from '../components/Skeleton'

const MONTHS = ['Janeiro','Fevereiro','MarÃ§o','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','SÃ¡b']

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function prevMonth(y: number, m: number) {
  return m === 0 ? [y - 1, 11] : [y, m - 1]
}

function nextMonth(y: number, m: number) {
  return m === 11 ? [y + 1, 0] : [y, m + 1]
}

function makeMonthGrid(year: number, month: number, completed: Set<number>) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const total = daysInMonth(year, month)
  const start = firstDayOfWeek(year, month)
  const cells: { date: Date; day: number; inMonth: boolean; readingDay: number | null; done: boolean; isToday: boolean }[] = []

  if (start > 0) {
    const [py, pm] = prevMonth(year, month)
    const prevTotal = daysInMonth(py, pm)
    for (let i = start - 1; i >= 0; i--) {
      const d = prevTotal - i
      const date = new Date(py, pm, d)
      const rd = getReadingDayForDate(date)
      cells.push({ date, day: d, inMonth: false, readingDay: rd, done: rd !== null && completed.has(rd), isToday: false })
    }
  }
  for (let d = 1; d <= total; d++) {
    const date = new Date(year, month, d)
    const rd = getReadingDayForDate(date)
    cells.push({ date, day: d, inMonth: true, readingDay: rd, done: rd !== null && completed.has(rd), isToday: sameDay(date, today) })
  }
  const rem = 42 - cells.length
  const [ny, nm] = nextMonth(year, month)
  for (let d = 1; d <= rem; d++) {
    const date = new Date(ny, nm, d)
    const rd = getReadingDayForDate(date)
    cells.push({ date, day: d, inMonth: false, readingDay: rd, done: false, isToday: false })
  }
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function makeWeekGrid(year: number, month: number, day: number, completed: Set<number>) {
  const anchor = new Date(year, month, day)
  const dow = anchor.getDay()
  const start = new Date(anchor)
  start.setDate(start.getDate() - dow)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cells: { date: Date; readingDay: number | null; done: boolean; isToday: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    const rd = getReadingDayForDate(d)
    cells.push({ date: d, readingDay: rd, done: rd !== null && completed.has(rd), isToday: sameDay(d, today) })
  }
  return cells
}

export default function Calendar() {
  const navigate = useNavigate()
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [view, setView] = useState<'year' | 'month' | 'week' | 'day'>('month')
  const [y, setY] = useState(() => new Date().getFullYear())
  const [m, setM] = useState(() => new Date().getMonth())
  const [d, setD] = useState(() => new Date().getDate())
  const [started, setStarted] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const { data } = await supabase.from('reading_progress').select('day_number').order('day_number')
    if (data) setCompleted(new Set(data.map(r => r.day_number)))
    setStarted(isReadingStarted())
    setStartDate(getReadingStartDate())
    setLoading(false)
  }

  const goToday = () => {
    const t = new Date()
    setY(t.getFullYear())
    setM(t.getMonth())
    setD(t.getDate())
  }

  const handleReset = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (user) await supabase.from('reading_progress').delete().eq('user_id', user.id)
    clearReadingStartDate()
    setCompleted(new Set())
    setStarted(false)
    setStartDate(null)
    setShowReset(false)
    goToday()
  }

  if (loading) return <CalendarSkeleton />

  const todayReadingDay = getTodayReadingDay()
  const daysRead = completed.size

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <h1 className="text-lg font-bold text-text-primary">CalendÃ¡rio</h1>

      {started && startDate && (
        <p className="text-xs text-text-muted">
          InÃ­cio: {startDate.toLocaleDateString('pt-BR')} Â· Progresso: {daysRead}/366 dias ({Math.round(daysRead / 366 * 100)}%)
        </p>
      )}

      {!started && todayReadingDay === null && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 text-center space-y-2">
          <BookOpen size={24} className="text-accent mx-auto" />
          <p className="text-sm text-text-muted">Comece sua primeira leitura para iniciar o cronograma.</p>
        </div>
      )}

      <div className="flex gap-1.5 bg-bg-card rounded-xl p-1 border border-white/5">
        {([['month','MÃªs'],['week','Semana'],['day','Dia'],['year','Ano']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors tab-btn ${
              view === key ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'month' && (
        <MonthView
          y={y} m={m} completed={completed}
          onPrev={() => { const [ny, nm] = prevMonth(y, m); setY(ny); setM(nm) }}
          onNext={() => { const [ny, nm] = nextMonth(y, m); setY(ny); setM(nm) }}
          onToday={goToday}
          onSelectDay={(date) => { setY(date.getFullYear()); setM(date.getMonth()); setD(date.getDate()); setView('day') }}
          navigate={navigate}
        />
      )}

      {view === 'week' && (
        <WeekView
          y={y} m={m} d={d} completed={completed}
          onPrev={() => { const p = new Date(y, m, d - 7); setY(p.getFullYear()); setM(p.getMonth()); setD(p.getDate()) }}
          onNext={() => { const p = new Date(y, m, d + 7); setY(p.getFullYear()); setM(p.getMonth()); setD(p.getDate()) }}
          onToday={goToday}
          navigate={navigate}
        />
      )}

      {view === 'day' && (
        <DayView
          y={y} m={m} d={d} completed={completed}
          onPrev={() => { const p = new Date(y, m, d - 1); setY(p.getFullYear()); setM(p.getMonth()); setD(p.getDate()) }}
          onNext={() => { const p = new Date(y, m, d + 1); setY(p.getFullYear()); setM(p.getMonth()); setD(p.getDate()) }}
          onToday={goToday}
          navigate={navigate}
          onToggleComplete={async (day) => {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) return
            if (completed.has(day)) {
              await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', day)
              setCompleted(prev => { const n = new Set(prev); n.delete(day); return n })
            } else {
              await supabase.from('reading_progress').insert({ user_id: user.id, day_number: day })
              setCompleted(prev => { const n = new Set(prev); n.add(day); return n })
            }
          }}
        />
      )}

      {view === 'year' && (
        <YearView
          year={y} completed={completed}
          onPrev={() => setY(y - 1)}
          onNext={() => setY(y + 1)}
          onToday={goToday}
          onSelectMonth={(month) => { setM(month); setView('month') }}
        />
      )}

      <button
        onClick={() => setShowReset(true)}
        className="flex items-center justify-center gap-1.5 w-full text-xs text-red-400/60 hover:text-red-400 py-2 transition-colors"
      >
        <RotateCcw size={12} /> Reiniciar cronograma
      </button>

      {showReset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowReset(false)}>
          <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full space-y-4 border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">Reiniciar cronograma?</h3>
            <p className="text-sm text-text-muted">Todo o progresso serÃ¡ apagado. Essa aÃ§Ã£o nÃ£o pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl bg-bg-hover text-text-muted text-sm font-medium">
                Cancelar
              </button>
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium">
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavHeader({ label, onPrev, onNext, onToday }: { label: string; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} className="p-2 rounded-xl hover:bg-bg-hover transition-colors icon-btn">
        <ChevronLeft size={18} className="text-text-muted" />
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <button onClick={onToday} className="text-xs text-accent hover:text-accent-light transition-colors px-2 py-0.5 rounded-lg bg-accent/10 btn-ghost">
          Hoje
        </button>
      </div>
      <button onClick={onNext} className="p-2 rounded-xl hover:bg-bg-hover transition-colors icon-btn">
        <ChevronRight size={18} className="text-text-muted" />
      </button>
    </div>
  )
}

function MonthView({ y, m, completed, onPrev, onNext, onToday, onSelectDay, navigate }: {
  y: number; m: number; completed: Set<number>
  onPrev: () => void; onNext: () => void; onToday: () => void
  onSelectDay: (date: Date) => void; navigate: (path: string) => void
}) {
  const weeks = makeMonthGrid(y, m, completed)
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3">
      <NavHeader label={`${MONTHS[m]} ${y}`} onPrev={onPrev} onNext={onNext} onToday={onToday} />
      <div className="grid grid-cols-7">
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs text-text-muted py-1 font-medium">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell, i) => {
          const hasReading = cell.readingDay !== null
          let cls = 'aspect-square rounded-lg flex items-center justify-center text-xs transition-colors relative '
          if (!cell.inMonth) cls += 'text-text-muted/30 '
          else if (cell.isToday && cell.done) cls += 'bg-accent/30 text-accent ring-1 ring-accent/50 '
          else if (cell.isToday) cls += 'bg-accent/10 text-accent ring-1 ring-accent/30 '
          else if (cell.done) cls += 'bg-green-500/15 text-green-400 '
          else if (hasReading) cls += 'bg-bg-hover text-text-secondary hover:bg-accent/10 cursor-pointer '
          else cls += 'text-text-muted/40 '

          const reading = hasReading ? getReadingForDay(cell.readingDay!) : []
          const title = hasReading ? `Dia ${cell.readingDay} â€” ${reading[0]?.title || ''}` : `Dia ${cell.day}`

          return (
            <button
              key={i}
              onClick={() => {
                if (hasReading) navigate(`/ler/${cell.readingDay}`)
                else onSelectDay(cell.date)
              }}
              className={cls}
              title={title}
            >
              {cell.day}
              {cell.done && <CheckCircle size={8} className="absolute top-0.5 right-0.5 text-green-400" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ y, m, d, completed, onPrev, onNext, onToday, navigate }: {
  y: number; m: number; d: number; completed: Set<number>
  onPrev: () => void; onNext: () => void; onToday: () => void
  navigate: (path: string) => void
}) {
  const cells = makeWeekGrid(y, m, d, completed)
  const weekStart = cells[0].date
  const weekEnd = cells[6].date
  const label = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} â€“ ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0, 3)}`

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3 card">
      <NavHeader label={label} onPrev={onPrev} onNext={onNext} onToday={onToday} />
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, i) => {
          const rd = cell.readingDay
          const reading = rd ? getReadingForDay(rd) : []
          return (
            <button
              key={i}
              onClick={() => {
                if (rd) navigate(`/ler/${rd}`)
              }}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition-colors btn-ghost ${
                cell.isToday ? 'bg-accent/10 ring-1 ring-accent/30' : ''
              } ${cell.done ? 'bg-green-500/10' : 'hover:bg-bg-hover'} ${!rd ? 'opacity-40' : ''}`}
            >
              <span className="text-text-muted text-[10px]">{DAYS[cell.date.getDay()]}</span>
              <span className={`text-sm font-semibold ${cell.done ? 'text-green-400' : cell.isToday ? 'text-accent' : 'text-text-primary'}`}>
                {cell.date.getDate()}
              </span>
              {rd && <span className="text-[10px] text-text-muted truncate w-full text-center px-0.5">{reading[0]?.book}</span>}
              {cell.done && <CheckCircle size={10} className="text-green-400" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ y, m, d, completed, onPrev, onNext, onToday, navigate, onToggleComplete }: {
  y: number; m: number; d: number; completed: Set<number>
  onPrev: () => void; onNext: () => void; onToday: () => void
  navigate: (path: string) => void
  onToggleComplete: (day: number) => void
}) {
  const date = new Date(y, m, d)
  const rd = getReadingDayForDate(date)
  const reading = rd ? getReadingForDay(rd) : []
  const done = rd !== null && completed.has(rd)
  const label = `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`

  return (
    <div className="space-y-3">
      <NavHeader label={label} onPrev={onPrev} onNext={onNext} onToday={onToday} />

      {rd ? (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-4 space-y-3 card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Dia {rd} do plano</p>
              {reading[0] && <h2 className="font-semibold text-text-primary mt-0.5">{reading[0].title}</h2>}
            </div>
            {done && <CheckCircle size={20} className="text-green-400 shrink-0" />}
          </div>

          {reading.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-accent">â€¢</span>
              <span>{r.title}</span>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => navigate(`/ler/${rd}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-light transition-colors btn-primary"
            >
              <BookOpen size={16} /> {done ? 'Revisar' : 'Iniciar'}
            </button>
            {done ? (
              <button
                onClick={() => onToggleComplete(rd)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-bg-hover text-text-muted hover:text-red-400 transition-colors btn-ghost"
              >
                Desmarcar
              </button>
            ) : (
              <button
                onClick={() => onToggleComplete(rd)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors btn-primary"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-8 text-center space-y-2">
          <BookOpen size={24} className="text-text-muted/40 mx-auto" />
          <p className="text-sm text-text-muted">Nenhuma atividade de leitura para este dia.</p>
        </div>
      )}
    </div>
  )
}

function YearView({ year, completed, onPrev, onNext, onToday, onSelectMonth }: {
  year: number; completed: Set<number>
  onPrev: () => void; onNext: () => void; onToday: () => void
  onSelectMonth: (month: number) => void
}) {
  const today = new Date()
  return (
    <div className="space-y-3">
      <NavHeader label={String(year)} onPrev={onPrev} onNext={onNext} onToday={onToday} />
      <div className="grid grid-cols-3 gap-3">
        {MONTHS.map((name, mi) => {
          const total = daysInMonth(year, mi)
          const first = firstDayOfWeek(year, mi)
          const isCurrent = today.getFullYear() === year && today.getMonth() === mi
          let doneCount = 0
          const dots: boolean[] = []
          for (let dd = 1; dd <= total; dd++) {
            const rd = getReadingDayForDate(new Date(year, mi, dd))
            const d = rd !== null && completed.has(rd)
            if (d) doneCount++
            dots.push(d)
          }
          const pct = total > 0 ? Math.round(doneCount / total * 100) : 0

          return (
            <button
              key={mi}
              onClick={() => onSelectMonth(mi)}
              className={`bg-bg-card rounded-xl p-3 border border-white/5 text-left hover:bg-bg-hover transition-colors ${isCurrent ? 'ring-1 ring-accent/30' : ''}`}
            >
              <p className="text-xs font-medium text-text-primary mb-2">{name.slice(0, 3)}</p>
              <div className="grid grid-cols-7 gap-px mb-2">
                {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: total }).map((_, i) => {
                  const done = dots[i]
                  return (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-sm ${done ? 'bg-green-400' : isCurrent && i + 1 === today.getDate() ? 'bg-accent/40' : 'bg-bg-hover/50'}`}
                    />
                  )
                })}
              </div>
              <p className="text-[10px] text-text-muted">{doneCount} dias Â· {pct}%</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

```

### src/pages/Notes.tsx
```tsx
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getReadingForDay, sections } from '../lib/reading-plan'
import { Search, StickyNote, X, BookOpen, CalendarDays, Trash2, Share2 } from 'lucide-react'
import { shareContent } from '../lib/share'

interface NoteRow {
  id: string
  day_number: number
  content: string
  updated_at: string
}

interface EnrichedNote extends NoteRow {
  book: string
  title: string
  sectionName: string
  sectionColor: string
}

function daysAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  if (diff < 7) return `hÃ¡ ${diff} dias`
  if (diff < 30) return `hÃ¡ ${Math.floor(diff / 7)} sem`
  return `hÃ¡ ${Math.floor(diff / 30)} meses`
}

const INITIAL_SHOW = 5

export default function Notes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<EnrichedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterBook, setFilterBook] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [showAllSections, setShowAllSections] = useState(false)
  const [showAllBooks, setShowAllBooks] = useState(false)

  useEffect(() => { loadNotes() }, [])

  const loadNotes = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('notes')
      .select('id, day_number, content, updated_at')
      .eq('user_id', user.id)
      .order('day_number', { ascending: false })
    if (data) {
      const enriched: EnrichedNote[] = data.map(n => {
        const readings = getReadingForDay(n.day_number)
        const first = readings[0]
        return {
          ...n,
          book: first?.book || '',
          title: first?.title || `Dia ${n.day_number}`,
          sectionName: first?.section.name || '',
          sectionColor: first?.section.color || '#888',
        }
      })
      setNotes(enriched)
    }
    setLoading(false)
  }

  const books = useMemo(() => [...new Set(notes.map(n => n.book).filter(Boolean))].sort(), [notes])

  const notesThisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return notes.filter(n => new Date(n.updated_at) >= weekAgo).length
  }, [notes])

  const topBook = useMemo(() => {
    if (books.length === 0) return 'â€”'
    const counts: Record<string, number> = {}
    notes.forEach(n => { if (n.book) counts[n.book] = (counts[n.book] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'â€”'
  }, [notes, books])

  const filtered = useMemo(() => {
    let result = notes
    if (filterSection) result = result.filter(n => n.sectionName === filterSection)
    if (filterBook) result = result.filter(n => n.book === filterBook)
    if (filterPeriod) {
      const now = new Date()
      const cutoff = new Date()
      if (filterPeriod === 'day') cutoff.setDate(now.getDate() - 1)
      else if (filterPeriod === 'week') cutoff.setDate(now.getDate() - 7)
      else if (filterPeriod === 'month') cutoff.setMonth(now.getMonth() - 1)
      else if (filterPeriod === 'year') cutoff.setFullYear(now.getFullYear() - 1)
      result = result.filter(n => new Date(n.updated_at) >= cutoff)
    }
    if (filterMonth) {
      const [year, month] = filterMonth.split('-').map(Number)
      result = result.filter(n => {
        const d = new Date(n.updated_at)
        return d.getFullYear() === year && d.getMonth() === month - 1
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.content.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.book.toLowerCase().includes(q)
      )
    }
    return result
  }, [notes, filterSection, filterBook, filterPeriod, filterMonth, search])

  const sectionsWithCount = useMemo(() =>
    sections.map(s => ({
      ...s,
      count: notes.filter(n => n.sectionName === s.name).length,
    })).filter(s => s.count > 0),
  [notes, sections])

  const booksWithCount = useMemo(() => {
    const counts: Record<string, number> = {}
    notes.forEach(n => { if (n.book) counts[n.book] = (counts[n.book] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [notes])

  const visibleSections = showAllSections ? sectionsWithCount : sectionsWithCount.slice(0, INITIAL_SHOW)
  const visibleBooks = showAllBooks ? booksWithCount : booksWithCount.slice(0, INITIAL_SHOW)

  const hasActive = filterSection || filterBook || filterPeriod || filterMonth || search.trim()

  const deleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    if (!confirm('Excluir esta anotaÃ§Ã£o?')) return
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Suas AnotaÃ§Ãµes</h1>
        <span className="text-xs text-text-muted">{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-2xl border border-white/5 p-3 text-center">
          <StickyNote size={18} className="text-accent mx-auto mb-1.5" />
          <div className="text-xl font-bold text-text-primary">{notes.length}</div>
          <div className="text-[10px] text-text-muted mt-0.5">total</div>
        </div>
        <div className="bg-bg-card rounded-2xl border border-white/5 p-3 text-center">
          <CalendarDays size={18} className="text-green-400 mx-auto mb-1.5" />
          <div className="text-xl font-bold text-text-primary">{notesThisWeek}</div>
          <div className="text-[10px] text-text-muted mt-0.5">esta semana</div>
        </div>
        <div className="bg-bg-card rounded-2xl border border-white/5 p-3 text-center">
          <BookOpen size={18} className="text-purple-400 mx-auto mb-1.5" />
          <div className="text-sm font-bold text-text-primary truncate">{topBook}</div>
          <div className="text-[10px] text-text-muted mt-0.5">mais anotado</div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar nas anotaÃ§Ãµes..."
          className="w-full bg-bg-card border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/30"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-3">
            <h3 className="text-xs font-medium text-text-muted mb-2">PerÃ­odo</h3>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: '', label: 'Todas' },
                { value: 'day', label: 'Hoje' },
                { value: 'week', label: 'Esta semana' },
                { value: 'month', label: 'Este mÃªs' },
                { value: 'year', label: 'Este ano' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => { setFilterPeriod(p.value); setFilterMonth('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterPeriod === p.value && !filterMonth ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {filterPeriod === 'year' && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => {
                  const monthVal = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`
                  const count = notes.filter(n => {
                    const d = new Date(n.updated_at)
                    return d.getFullYear() === new Date().getFullYear() && d.getMonth() === i
                  }).length
                  return (
                    <button
                      key={monthVal}
                      onClick={() => setFilterMonth(filterMonth === monthVal ? '' : monthVal)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filterMonth === monthVal ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {m} {count > 0 && <span className="opacity-70">({count})</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {sectionsWithCount.length > 0 && (
          <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-3">
              <h3 className="text-xs font-medium text-text-muted mb-2">SeÃ§Ãµes</h3>
              <div className="flex flex-wrap gap-1.5">
                {visibleSections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setFilterSection(filterSection === s.name ? '' : s.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                    style={{
                      backgroundColor: filterSection === s.name ? s.color : `${s.color}55`,
                    }}
                  >
                    {s.name} <span className="opacity-70">({s.count})</span>
                  </button>
                ))}
              </div>
              {sectionsWithCount.length > INITIAL_SHOW && (
                <button
                  onClick={() => setShowAllSections(!showAllSections)}
                  className="mt-2 text-xs font-bold text-accent hover:text-accent-light transition-colors"
                >
                  {showAllSections ? 'recolher' : `+${sectionsWithCount.length - INITIAL_SHOW} mais`}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-3">
            <h3 className="text-xs font-medium text-text-muted mb-2">Livros</h3>
            {booksWithCount.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {visibleBooks.map(b => (
                    <button
                      key={b.name}
                      onClick={() => setFilterBook(filterBook === b.name ? '' : b.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterBook === b.name ? 'bg-purple-600 text-white' : 'bg-bg-hover text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {b.name} <span className="opacity-70">({b.count})</span>
                    </button>
                  ))}
                </div>
                {booksWithCount.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setShowAllBooks(!showAllBooks)}
                    className="mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {showAllBooks ? 'recolher' : `+${booksWithCount.length - INITIAL_SHOW} mais`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-text-muted">Nenhuma anotaÃ§Ã£o com livro ainda</p>
            )}
          </div>
        </div>
      </div>

      {hasActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted">Filtrando:</span>
          {filterMonth && (
            <span className="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded-md">
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(filterMonth.split('-')[1]) - 1]}
              <button onClick={() => setFilterMonth('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filterPeriod && !filterMonth && (
            <span className="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded-md">
              {filterPeriod === 'day' ? 'Hoje' : filterPeriod === 'week' ? 'Esta semana' : filterPeriod === 'month' ? 'Este mÃªs' : 'Este ano'}
              <button onClick={() => setFilterPeriod('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filterSection && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md text-white"
              style={{ backgroundColor: sections.find(s => s.name === filterSection)?.color || '#888' }}>
              {filterSection}
              <button onClick={() => setFilterSection('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filterBook && (
            <span className="inline-flex items-center gap-1 bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-md">
              {filterBook}
              <button onClick={() => setFilterBook('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {search.trim() && (
            <span className="inline-flex items-center gap-1 bg-white/5 text-text-muted text-xs px-2 py-0.5 rounded-md">
              "{search}"
              <button onClick={() => setSearch('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          <button
            onClick={() => { setFilterSection(''); setFilterBook(''); setFilterPeriod(''); setFilterMonth(''); setSearch('') }}
            className="text-xs text-text-muted hover:text-red-400 transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
              <div className="h-3 bg-bg-hover rounded w-1/3 mb-2" />
              <div className="h-3 bg-bg-hover rounded w-2/3 mb-2" />
              <div className="h-2 bg-bg-hover rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-muted text-sm">
            {hasActive ? 'Nenhuma anotaÃ§Ã£o encontrada' : 'Suas anotaÃ§Ãµes aparecerÃ£o aqui conforme vocÃª for lendo'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <button
              key={note.id}
              onClick={() => navigate(`/ler/${note.day_number}`)}
              className="w-full text-left bg-bg-card rounded-2xl border border-white/5 overflow-hidden hover:bg-bg-hover transition-colors card"
            >
              <div className="h-1.5" style={{ backgroundColor: note.sectionColor }} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-muted">Dia {note.day_number}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted">{daysAgo(note.updated_at)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        shareContent(
                          `Minha anotaÃ§Ã£o â€” Dia ${note.day_number}`,
                          `ðŸ“ ${note.title}\n\n"${note.content}"\n\nðŸ“– Leitura da BÃ­blia em 1 Ano`
                        )
                      }}
                      className="text-text-muted hover:text-accent transition-colors p-0.5"
                    >
                      <Share2 size={12} />
                    </button>
                    <button
                      onClick={(e) => deleteNote(e, note.id)}
                      className="text-text-muted hover:text-red-400 transition-colors p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-text-primary text-sm mb-1">{note.title}</h3>
                <p className="text-xs mb-2 px-2 py-0.5 rounded-md inline-block text-white/90" style={{ backgroundColor: `${note.sectionColor}cc` }}>
                  {note.sectionName}
                </p>
                <p className="text-sm text-text-secondary line-clamp-2 mt-2">{note.content}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

```

### src/pages/Sections.tsx
```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sections, getDaysInSection } from '../lib/reading-plan'
import {
  CheckCircle, ScrollText, Music, MessageSquare,
  Crown, Home, Bird, Users, Mail, PenTool, BookOpen, Cookie,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  scroll: <ScrollText size={22} />,
  crown: <Crown size={22} />,
  house: <Home size={22} />,
  music: <Music size={22} />,
  'message-square': <MessageSquare size={22} />,
  dove: <Bird size={22} />,
  users: <Users size={22} />,
  mail: <Mail size={22} />,
  'pen-tool': <PenTool size={22} />,
  cookie: <Cookie size={22} />,
}

const markerSectionIds = new Set(['tratos-israel', 'congregacao-crista'])

export default function Sections() {
  const navigate = useNavigate()
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.from('reading_progress').select('day_number').then(({ data }) => {
      if (data) setCompletedDays(new Set(data.map(r => r.day_number)))
    })
  }, [])

  const markerSections = sections.filter(s => markerSectionIds.has(s.id))
  const bookSections = sections.filter(s => !markerSectionIds.has(s.id))

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <h1 className="text-lg font-bold text-text-primary">SeÃ§Ãµes da BÃ­blia</h1>

      {markerSections.map(section => {
        const days = getDaysInSection(section.id)
        const completed = days.filter(d => completedDays.has(d.day)).length
        const total = days.length
        const pct = Math.round((completed / total) * 100)

        return (
          <div key={section.id} className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden card">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <h2 className="font-semibold text-text-primary text-sm">{section.name}</h2>
                  <p className="text-xs text-text-muted">{completed}/{total} textos â€¢ {pct}%</p>
                </div>
                {pct === 100 ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : null}
              </div>

              <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: section.color }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(expanded.has(section.id) ? days : days.slice(0, 20)).map((d, idx) => {
                  const isDone = completedDays.has(d.day)
                  return (
                    <button
                      key={d.day}
                      onClick={() => navigate(`/ler/${d.day}`)}
                      className={`h-10 min-w-[40px] px-2 rounded-lg text-xs flex items-center gap-1 transition-colors btn-ghost ${
                        isDone
                          ? 'text-white'
                          : 'bg-bg-hover text-text-secondary hover:bg-accent/10'
                      }`}
                      style={isDone ? { backgroundColor: section.color } : {}}
                      title={`${d.title}${isDone ? ' âœ“' : ''}`}
                    >
                      <span className="text-[10px]">{d.marker}</span>
                      <span>{idx + 1}</span>
                    </button>
                  )
                })}
                {days.length > 20 && !expanded.has(section.id) && (
                  <button
                    onClick={() => setExpanded(prev => new Set(prev).add(section.id))}
                    className="h-10 px-3 rounded-lg text-xs font-bold flex items-center bg-accent text-white hover:bg-accent/80 transition-colors"
                  >
                    +{days.length - 20}
                  </button>
                )}
                {expanded.has(section.id) && days.length > 20 && (
                  <button
                    onClick={() => setExpanded(prev => { const next = new Set(prev); next.delete(section.id); return next })}
                    className="h-10 px-3 rounded-lg text-xs font-bold flex items-center bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                  >
                    recolher
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {bookSections.map(section => {
        const days = getDaysInSection(section.id)
        const completed = days.filter(d => completedDays.has(d.day)).length
        const total = days.length
        const pct = Math.round((completed / total) * 100)

        return (
          <div key={section.id} className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden card">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-accent">{iconMap[section.icon] || <BookOpen size={22} />}</span>
                <div className="flex-1">
                  <h2 className="font-semibold text-text-primary text-sm">{section.name}</h2>
                  <p className="text-xs text-text-muted">{completed}/{total} dias â€¢ {pct}%</p>
                </div>
                {pct === 100 ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : null}
              </div>

              <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: section.color }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(expanded.has(section.id) ? days : days.slice(0, 20)).map(d => {
                  const isDone = completedDays.has(d.day)
                  return (
                    <button
                      key={d.day}
                      onClick={() => navigate(`/ler/${d.day}`)}
                      className={`w-10 h-10 rounded-lg text-xs flex items-center justify-center transition-colors btn-ghost ${
                        isDone
                          ? 'text-white'
                          : 'bg-bg-hover text-text-secondary hover:bg-accent/10'
                      }`}
                      style={isDone ? { backgroundColor: section.color } : {}}
                      title={`Dia ${d.day}${isDone ? ' âœ“' : ''}`}
                    >
                      {d.day}
                    </button>
                  )
                })}
                {days.length > 20 && !expanded.has(section.id) && (
                  <button
                    onClick={() => setExpanded(prev => new Set(prev).add(section.id))}
                    className="h-10 px-3 rounded-lg text-xs font-bold flex items-center bg-accent text-white hover:bg-accent/80 transition-colors"
                  >
                    +{days.length - 20}
                  </button>
                )}
                {expanded.has(section.id) && days.length > 20 && (
                  <button
                    onClick={() => setExpanded(prev => { const next = new Set(prev); next.delete(section.id); return next })}
                    className="h-10 px-3 rounded-lg text-xs font-bold flex items-center bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                  >
                    recolher
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

```

### src/pages/Stats.tsx
```tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sections, getDaysInSection, getTodayReadingDay, calcStreak } from '../lib/reading-plan'
import { Flame, BookOpen, FileText, TrendingUp, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ReadingStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  completedDays: number
  totalNotes: number
  weeklyData: number[]
  monthlyData: number[]
}

export default function Stats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sectionProgress, setSectionProgress] = useState<Record<string, { total: number; completed: number }>>({})
  const [heatmap, setHeatmap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: progress } = await supabase
        .from('reading_progress')
        .select('day_number')
        .eq('user_id', user.id)

      const { data: notes } = await supabase
        .from('notes')
        .select('day_number, content, created_at')
        .eq('user_id', user.id)

      const completedDays = new Set(progress?.map(p => p.day_number) || [])
      const totalNotes = notes?.length || 0

      const currentStreak = calcStreak(completedDays)

      let longestStreak = 0
      let tempStreak = 0
      for (let i = 1; i <= 366; i++) {
        if (completedDays.has(i)) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }

      const weeklyData = Array(7).fill(0)
      const monthlyData = Array(12).fill(0)

      notes?.forEach(note => {
        const date = new Date(note.created_at)
        const dayOfWeek = date.getDay()
        weeklyData[dayOfWeek]++
        const month = date.getMonth()
        monthlyData[month]++
      })

      const heat: Record<string, boolean> = {}
      for (let i = 1; i <= 366; i++) {
        heat[i.toString()] = completedDays.has(i)
      }
      setHeatmap(heat)

      const sectionProgress: Record<string, { total: number; completed: number }> = {}
      sections.forEach(section => {
        const days = getDaysInSection(section.id)
        const total = days.length
        const completed = days.filter(d => completedDays.has(d.day)).length
        sectionProgress[section.id] = { total, completed }
      })

      setStats({
        totalDays: 366,
        currentStreak,
        longestStreak,
        completedDays: completedDays.size,
        totalNotes,
        weeklyData,
        monthlyData
      })
      setSectionProgress(sectionProgress)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-bg-card rounded w-48 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl animate-pulse"></div>
            ))}
          </div>
          <div className="h-64 bg-bg-card rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const maxWeekly = Math.max(...stats.weeklyData, 1)
  const maxMonthly = Math.max(...stats.monthlyData, 1)
  const progressPercent = Math.round((stats.completedDays / stats.totalDays) * 100)

  return (
    <div className="min-h-screen bg-bg-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 fade-in">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">EstatÃ­sticas</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 hover:bg-[#252540] transition-colors cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <Flame size={16} className="text-orange-500" />
              <span>SequÃªncia Atual</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{stats.currentStreak}</div>
            <div className="text-xs text-text-muted mt-1">dias consecutivos</div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 hover:bg-[#252540] transition-colors cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <TrendingUp size={16} className="text-green-500" />
              <span>Melhor SequÃªncia</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{stats.longestStreak}</div>
            <div className="text-xs text-text-muted mt-1">dias consecutivos</div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 hover:bg-[#252540] transition-colors cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <BookOpen size={16} className="text-accent" />
              <span>Dias Lidos</span>
            </div>
            <div className="text-3xl font-bold text-accent">{stats.completedDays}</div>
            <div className="text-xs text-text-muted mt-1">de {stats.totalDays} dias</div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 hover:bg-[#252540] transition-colors cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <FileText size={16} className="text-purple-500" />
              <span>AnotaÃ§Ãµes</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">{stats.totalNotes}</div>
            <div className="text-xs text-text-muted mt-1">notas criadas</div>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Progresso Geral</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-4 bg-bg-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-lg font-bold text-text-primary">{progressPercent}%</span>
          </div>
          <div className="text-sm text-text-muted">
            {stats.completedDays} de {stats.totalDays} dias concluÃ­dos
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Atividade por Dia da Semana</h2>
          <div className="flex items-end justify-between h-32 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-bg-dark rounded-t" style={{ height: `${(stats.weeklyData[i] / maxWeekly) * 100}%`, minHeight: '4px' }}>
                  <div className="w-full h-full bg-accent rounded-t opacity-80" />
                </div>
                <span className="text-xs text-text-muted">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">AnotaÃ§Ãµes por MÃªs</h2>
          <div className="flex items-end justify-between h-32 gap-1">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-bg-dark rounded-t" style={{ height: `${(stats.monthlyData[i] / maxMonthly) * 100}%`, minHeight: '4px' }}>
                  <div className="w-full h-full bg-purple-500 rounded-t opacity-80" />
                </div>
                <span className="text-xs text-text-muted">{month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Progresso por SeÃ§Ã£o</h2>
          <div className="space-y-3">
            {sections.map(section => {
              const progress = sectionProgress[section.id]
              if (!progress) return null
              const percent = Math.round((progress.completed / progress.total) * 100)
              return (
                <div key={section.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: section.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-text-primary">{section.name}</span>
                      <span className="text-xs text-text-muted">{progress.completed}/{progress.total}</span>
                    </div>
                    <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: section.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Mapa de Calor (Ãšltimos 30 Dias)</h2>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const today = getTodayReadingDay()
              const dayNum = today ? today - 34 + i : 1
              const isCompleted = heatmap[dayNum.toString()] || false
              const isFuture = dayNum > (today || 366)
              return (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-md sm:rounded transition-all duration-200 hover:scale-110 ${
                    isFuture ? 'bg-bg-dark' :
                    isCompleted ? 'bg-green-500 hover:bg-green-400' : 'bg-bg-dark border border-white/10'
                  }`}
                  title={`Dia ${dayNum}`}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
            <div className="w-3 h-3 rounded bg-bg-dark border border-white/10" />
            <span>NÃ£o lido</span>
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Lido</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### src/pages/Login.tsx
```tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: err } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (err) setError(err.message)
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Email de redefiniÃ§Ã£o enviado! Verifique sua caixa de entrada.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4 fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              <path d="M6 8h2" /><path d="M6 12h2" /><path d="M16 8h2" /><path d="M16 12h2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Leitura da BÃ­blia</h1>
          <p className="text-text-muted text-sm mt-1">Plano de leitura em 1 ano â€¢ TNM</p>
        </div>

        {mode === 'reset' ? (
          <form onSubmit={handleReset} className="space-y-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </button>

            <p className="text-sm text-text-muted">
              Digite seu email para receber um link de redefiniÃ§Ã£o de senha.
            </p>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
                  placeholder="seu@email.com" required
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-accent hover:bg-accent-light text-bg-dark font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-primary"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Enviar link de redefiniÃ§Ã£o
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
                    placeholder="seu@email.com" required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                  className="text-xs text-accent hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-accent hover:bg-accent-light text-bg-dark font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-primary"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="bg-bg-dark px-3 text-xs text-text-muted">ou</span></div>
            </div>

            <button
              onClick={handleGoogle} disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm btn-ghost"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar com Google
            </button>

            <p className="text-center text-sm text-text-muted mt-6">
              {mode === 'login' ? (
                <>NÃ£o tem conta? <button onClick={() => setMode('register')} className="text-accent hover:underline btn-ghost">Criar</button></>
              ) : (
                <>JÃ¡ tem conta? <button onClick={() => setMode('login')} className="text-accent hover:underline btn-ghost">Entrar</button></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
```

### src/pages/Instructions.tsx
```tsx
import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Instructions() {
  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
      <div className="text-center py-4 space-y-3">
        <GraduationCap size={40} className="text-accent mx-auto" />
        <h1 className="text-xl font-bold text-text-primary">Como usar o Programa de Leitura da BÃ­blia</h1>
      </div>

      <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          VocÃª pode ler os livros da BÃ­blia pela ordem ou por assunto, com base nas categorias
          na aba <Link to="/secoes" className="text-accent font-bold underline">SeÃ§Ãµes</Link>. Se ler um grupo de
          capÃ­tulos por dia, vocÃª lerÃ¡ a BÃ­blia inteira em um ano.
        </p>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-orange-400 mt-0.5">ðŸ”¸</span>
            <p>Leia os dias com o marcador <span className="font-semibold text-orange-400">Laranja</span> para ter uma visÃ£o histÃ³rica geral dos tratos de Deus com os israelitas.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">ðŸ”¹</span>
            <p>Leia os dias com o marcador <span className="font-semibold text-blue-400">Azul</span> para ter uma visÃ£o cronolÃ³gica geral do desenvolvimento da congregaÃ§Ã£o cristÃ£.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

```

---

## 6. Supabase

### supabase-schema.sql
```sql
-- Supabase Schema for "Leitura da BÃ­blia"
-- Execute this SQL in your Supabase SQL Editor

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Reading progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON reading_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON reading_progress FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reading_progress_user_day ON reading_progress(user_id, day_number);

-- 3. Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notes_user_day ON notes(user_id, day_number);

-- 4. Push subscriptions (notificaÃ§Ãµes push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  preferred_hour INTEGER DEFAULT 8 CHECK (preferred_hour >= 0 AND preferred_hour <= 23),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active, preferred_hour);

```

### supabase/migrations/002_add_reading_start_date.sql
```sql
-- Migration: Add reading_start_date to profiles
-- Execute this SQL in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_start_date DATE;

```

### supabase/functions/send-daily-reminder/index.ts
```ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webPush from "https://esm.sh/web-push@3.6.7"

const vapidEmail = Deno.env.get("VAPID_EMAIL")!
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!

webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

function calcStreak(completedDays: number[]): number {
  if (completedDays.length === 0) return 0
  const sorted = [...new Set(completedDays)].sort((a, b) => b - a)
  const today = getTodayReadingDay()
  if (!today) return 0
  if (sorted[0] !== today && sorted[0] !== today - 1) return 0
  let streak = 0
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      if (sorted[i] === today || sorted[i] === today - 1) streak = 1
      else break
    } else {
      if (sorted[i] === sorted[i - 1] - 1) streak++
      else break
    }
  }
  return streak
}

function getTodayReadingDay(): number | null {
  const stored = Deno.env.get("READING_START_DATE")
  if (!stored) return null
  const start = new Date(stored)
  start.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000)
  const day = diffDays + 1
  return day >= 1 && day <= 366 ? day : null
}

const motivationalMessages = [
  "Continue firme na jornada!",
  "Cada dia Ã© uma nova oportunidade de crescer espiritualmente.",
  "A Palavra de Deus Ã© uma lÃ¢mpada para os seus passos.",
  "NÃ£o desista! Cada pÃ¡gina Ã© um passo na fÃ©.",
  "JeovÃ¡ estÃ¡ orgulhoso do seu compromisso!",
  "A leitura diÃ¡ria fortalece sua fÃ©.",
  "Continue lendo, vocÃª estÃ¡ no caminho certo!",
]

serve(async (_req) => {
  const now = new Date()
  const brHour = (now.getUTCHours() - 3 + 24) % 24

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("active", true)
    .eq("preferred_hour", brHour)

  if (error || !subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, error: error?.message }))
  }

  let sent = 0
  const errors: string[] = []

  for (const sub of subs) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("reading_start_date")
        .eq("id", sub.user_id)
        .single()

      let dayNumber = 0
      let streak = 0

      if (profile?.reading_start_date) {
        const start = new Date(profile.reading_start_date)
        start.setHours(0, 0, 0, 0)
        const nowUtc = new Date()
        nowUtc.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((nowUtc.getTime() - start.getTime()) / 86400000)
        dayNumber = diffDays + 1

        const { data: progress } = await supabase
          .from("reading_progress")
          .select("day_number")
          .eq("user_id", sub.user_id)

        if (progress) {
          const completedDays = progress.map(p => p.day_number)
          const sorted = [...new Set(completedDays)].sort((a, b) => b - a)
          let tempStreak = 0
          for (let i = 0; i < sorted.length; i++) {
            if (i === 0) {
              if (sorted[i] === dayNumber || sorted[i] === dayNumber - 1) tempStreak = 1
              else break
            } else {
              if (sorted[i] === sorted[i - 1] - 1) tempStreak++
              else break
            }
          }
          streak = tempStreak
        }
      }

      let title = "Leitura da BÃ­blia"
      let body = ""

      if (dayNumber > 0 && dayNumber <= 366) {
        body = `Dia ${dayNumber} de 366`
        if (streak > 0) {
          body += ` | ðŸ”¥ ${streak} dias seguidos`
        }
        body += ` â€” Abra o app para continuar!`
      } else {
        const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
        body = msg
      }

      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title,
          body,
          url: "/",
        })
      )
      sent++
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .update({ active: false })
          .eq("id", sub.id)
      } else {
        errors.push(`${sub.id}: ${e.message}`)
      }
    }
  }

  return new Response(JSON.stringify({ sent, errors, hour: brHour }))
})

```

---

## 7. GitHub Actions

### .github/workflows/daily-reminder.yml
```yaml
name: Daily Bible Reminder
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminder
        run: |
          curl -s -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/send-daily-reminder" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"

```

---

*Ultima atualizacao: 24/07/2026*