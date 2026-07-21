import { Navigate, Outlet } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'

export default function ProtectedRoute({ user }: { user: User | null }) {
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
