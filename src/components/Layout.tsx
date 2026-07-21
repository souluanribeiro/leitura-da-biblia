import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, LayoutGrid, LogOut, Home } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs px-3 py-2 rounded-xl transition-colors btn-ghost ${
      isActive ? 'text-accent bg-bg-hover' : 'text-text-muted hover:text-text-secondary'
    }`

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <header className="sticky top-0 z-10 bg-bg-dark/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-accent font-bold">
          <BookOpen size={20} />
          <span className="text-sm">Ler a Bíblia</span>
        </NavLink>
        <button onClick={handleLogout} className="text-text-muted hover:text-red-400 p-1 icon-btn">
          <LogOut size={18} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-dark/95 backdrop-blur-sm border-t border-white/5 px-2 py-2 flex justify-around">
        <NavLink to="/" end className={linkClass}>
          <Home size={20} />
          <span>Hoje</span>
        </NavLink>
        <NavLink to="/calendario" className={linkClass}>
          <CalendarDays size={20} />
          <span>Calendário</span>
        </NavLink>
        <NavLink to="/secoes" className={linkClass}>
          <LayoutGrid size={20} />
          <span>Seções</span>
        </NavLink>
      </nav>
    </div>
  )
}
