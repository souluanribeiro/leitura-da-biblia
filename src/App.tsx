import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/Toast'
import { syncProfileFromServer, isSameDeviceUser, rememberDeviceUser, clearUserLocalData } from './lib/user-profile'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReadingDayPage = lazy(() => import('./pages/ReadingDayPage'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Sections = lazy(() => import('./pages/Sections'))
const Instructions = lazy(() => import('./pages/Instructions'))
const Notes = lazy(() => import('./pages/Notes'))
const Stats = lazy(() => import('./pages/Stats'))
const Profile = lazy(() => import('./pages/Profile'))
const BibleAgent = lazy(() => import('./pages/BibleAgent'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <img src="/favicon.png" alt="Leitura da Bíblia" className="w-12 h-12 animate-pulse" />
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  const handleUser = async (u: User | null) => {
    setUser(u)
    if (u) {
      if (!isSameDeviceUser(u.id)) {
        clearUserLocalData()
      }
      await syncProfileFromServer(u.id)
      rememberDeviceUser(u.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <img src="/favicon.png" alt="Leitura da Bíblia" className="w-12 h-12 animate-pulse" />
      </div>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <ToastContainer />
      <Routes location={location} key={location.pathname}>
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
            <Route path="/agente" element={<BibleAgent />} />
            <Route path="/instrucoes" element={<Instructions />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}