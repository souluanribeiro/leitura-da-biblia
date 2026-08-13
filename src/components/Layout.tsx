import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, LayoutGrid, Home, GraduationCap, StickyNote, User } from 'lucide-react'
import { loadProfile } from '../lib/user-profile'

export default function Layout() {
  const profile = loadProfile()
  const location = useLocation()
  const isAgent = location.pathname === '/agente'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs px-3 py-2 rounded-xl transition-colors btn-ghost ${
      isActive ? 'text-accent bg-bg-hover' : 'text-text-primary hover:text-white'
    }`

  return (
    <div className="h-screen bg-bg-dark flex flex-col overflow-hidden">
      <header className="shrink-0 bg-bg-dark/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-accent font-bold">
          <img src="/favicon.png" alt="" className="w-5 h-5" />
          <span className="text-sm">Leitura da Bíblia</span>
        </NavLink>
        <NavLink to="/perfil" className="text-text-muted hover:text-accent p-0.5 icon-btn">
          {profile?.photo ? (
            <img src={profile.photo} alt="Perfil" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <User size={18} />
          )}
        </NavLink>
      </header>

      <main className={`flex-1 min-h-0 ${isAgent ? 'flex flex-col' : 'overflow-y-auto pb-20'}`}>
        <div className={`page-transition ${isAgent ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          <Outlet />
        </div>
      </main>

      {!isAgent && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-bar/98 backdrop-blur-sm border-t border-white/5 px-2 py-2 flex justify-around">
          <NavLink to="/calendario" className={linkClass}>
            <CalendarDays size={20} />
            <span>Calendário</span>
          </NavLink>
          <NavLink to="/secoes" className={linkClass}>
            <LayoutGrid size={20} />
            <span>Seções</span>
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
            <span>Instruções</span>
          </NavLink>
        </nav>
      )}
    </div>
  )
}
