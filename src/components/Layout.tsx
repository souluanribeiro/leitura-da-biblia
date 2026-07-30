import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, LayoutGrid, Home, GraduationCap, StickyNote, User } from 'lucide-react'
import { loadProfile } from '../lib/user-profile'

export default function Layout() {
  const profile = loadProfile()
  const location = useLocation()
  const isAgent = location.pathname === '/agente'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs px-3 py-2 rounded-xl transition-colors btn-ghost ${
      isActive ? 'text-accent bg-bg-hover' : 'text-text-muted hover:text-text-secondary'
    }`

  return (
    <div className="h-screen bg-bg-dark flex flex-col overflow-hidden">
      <header className="shrink-0 bg-bg-dark/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-accent font-bold">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#3b82f6" d="M25.0625 38.457C26.754 35.7227 32.6641 32.3516 44.7266 34.8828C44.8281 34.9023 44.9258 34.8789 45.0078 34.8125C45.0898 34.75 45.1328 34.6563 45.1328 34.5547L45.0859 11.3711C45.0859 11.25 45.1406 11.1484 45.2461 11.0859C45.3438 11.0195 45.4609 11.0156 45.5703 11.0664L47.3047 11.9102C47.4258 11.9688 47.4922 12.082 47.4922 12.2148L47.5039 38.0234C47.5039 38.1172 47.4688 38.1953 47.4063 38.2617C47.3398 38.3281 47.2578 38.3594 47.168 38.3594L27.8438 38.3008C25.8281 41.7188 22.1641 41.7188 20.1484 38.3008L0.828125 38.3594C0.734375 38.3594 0.652344 38.3242 0.589844 38.2617C0.523438 38.1953 0.488281 38.1172 0.488281 38.0234L0.5 12.2148C0.5 12.082 0.570312 11.9688 0.6875 11.9102L2.42188 11.0664C2.53125 11.0117 2.64844 11.0195 2.75 11.0859C2.85156 11.1484 2.90625 11.25 2.90625 11.3711L2.86328 34.5547C2.86328 34.6602 2.90625 34.75 2.98438 34.8125C3.06641 34.8789 3.16406 34.9023 3.26563 34.8828C15.3281 32.3516 21.2383 35.7227 22.9297 38.457C23.3242 39.0938 24.7031 39.043 25.0625 38.457Z" fillRule="evenodd"/>
            <path fill="#3b82f6" d="M24.7539 34.6094L24.7617 11.2539C24.7617 11.0586 24.8359 10.8906 24.9805 10.7578C26.3047 9.53906 33.5703 3.48828 43.4688 7.51953C43.7266 7.625 43.8867 7.86328 43.8867 8.14453V32.1289C43.8867 32.3438 43.7969 32.5273 43.6328 32.6563C43.4688 32.7891 43.2734 32.8359 43.0664 32.7852C40.5156 32.1797 32.4648 30.7852 25.7813 35.1719C25.5703 35.3086 25.3203 35.3203 25.1016 35.1992C24.8789 35.0781 24.7539 34.8594 24.7539 34.6055V34.6094Z" fillRule="evenodd"/>
            <path fill="#3b82f6" d="M23.2969 34.6094L23.2891 11.2539C23.2891 11.0586 23.2109 10.8906 23.0703 10.7578C21.7461 9.53906 14.4805 3.48828 4.58203 7.51953C4.32422 7.625 4.16406 7.86328 4.16406 8.14453V32.1289C4.16406 32.3438 4.25391 32.5273 4.41797 32.6563C4.58203 32.7891 4.77734 32.8359 4.98047 32.7852C7.53516 32.1797 15.582 30.7852 22.2695 35.1719C22.4805 35.3086 22.7305 35.3203 22.9492 35.1992C23.168 35.0781 23.2969 34.8594 23.2969 34.6055V34.6094Z" fillRule="evenodd"/>
          </svg>
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-dark/95 backdrop-blur-sm border-t border-white/5 px-2 py-2 flex justify-around">
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
