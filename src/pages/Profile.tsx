import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { loadProfile, saveProfile, type UserProfile, getTheme, setTheme, type Theme, clearUserLocalData } from '../lib/user-profile'
import { getReadingStartDate, calcStreak, getTodayReadingDay, schedules, getScheduleName, getCurrentSchedule, setCurrentSchedule } from '../lib/reading-plan'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getSubscriptionStatus, updatePreferredHour } from '../lib/push'
import { exportProgress, importProgress } from '../lib/backup'
import { showToast } from '../components/Toast'
import { Flame, Calendar, Clock, User, Mail, LogOut, ChevronLeft, ChevronRight, ChevronDown, Check, CheckCircle, Camera, Bell, BellOff, Sun, Moon, BarChart3, List, Download, Upload } from 'lucide-react'

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
        {value || '—'}
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
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushDenied, setPushDenied] = useState(false)
  const [pushHour, setPushHour] = useState(8)
  const [pushLoading, setPushLoading] = useState(false)
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentSchedule, setScheduleState] = useState(() => getCurrentSchedule())
  const [showScheduleMenu, setShowScheduleMenu] = useState(false)

  useEffect(() => { loadData(); loadPushStatus() }, [])

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

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    setTheme(next)
  }

  const changeSchedule = (id: string) => {
    setCurrentSchedule(id)
    setScheduleState(id)
    setShowScheduleMenu(false)
  }

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
    if (!d) return '—'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    clearUserLocalData()
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
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-sm mb-4">
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-6 max-w-lg mx-auto px-4">
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
        <h1 className="text-xl font-bold text-text-primary">{profile?.name || 'Usuário'}</h1>
        <p className="text-text-muted text-sm mt-0.5">
          {profile?.age ? `${profile.age} anos` : 'Idade não informada'}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-3">
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
                    Não
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
                      Não
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
              <p className="text-xs text-text-muted">Sequência atual</p>
            </div>
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle size={18} className="text-green-400" />
                <span className="text-2xl font-bold text-green-400">{daysRead}</span>
              </div>
              <p className="text-xs text-text-muted">Dias lidos</p>
            </div>
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-green-400">{pct}%</span>
              </div>
              <p className="text-xs text-text-muted">Concluído</p>
            </div>
            <div className="bg-bg-hover rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-text-primary">{currentDay || '—'}</span>
              </div>
              <p className="text-xs text-text-muted">Dia atual</p>
            </div>
          </div>
          {startDate && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-sm text-text-muted">
              <Clock size={14} />
              <span>Início: {formatDate(startDate)}</span>
            </div>
          )}
          <div className="mt-3">
            <div className="w-full bg-bg-hover rounded-full h-2">
              <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <button
          onClick={() => navigate('/stats')}
          className="bg-bg-card rounded-xl p-4 flex items-center gap-3 hover:bg-bg-hover transition-colors w-full text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <BarChart3 size={16} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Estatísticas</p>
            <p className="text-xs text-text-muted">Veja seu progresso detalhado</p>
          </div>
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        </button>

        {/* Cronograma */}
        <div className="bg-bg-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Plano de Leitura</h2>
          <div className="relative">
            <button
              onClick={() => setShowScheduleMenu(!showScheduleMenu)}
              className="w-full flex items-center gap-3 p-3 bg-bg-hover rounded-lg hover:bg-accent/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <List size={16} className="text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text-primary">{getScheduleName(currentSchedule)}</p>
                <p className="text-xs text-text-muted">Plano de leitura ativo</p>
              </div>
              <ChevronDown size={16} className={`text-text-muted transition-transform ${showScheduleMenu ? 'rotate-180' : ''}`} />
            </button>
            {showScheduleMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card rounded-xl border border-white/10 shadow-lg z-50 overflow-hidden">
                {schedules.map(s => (
                  <button
                    key={s.id}
                    onClick={() => changeSchedule(s.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-bg-hover transition-colors flex items-center gap-3 ${s.id === currentSchedule ? 'bg-accent/10' : ''}`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm ${s.id === currentSchedule ? 'text-accent font-medium' : 'text-text-primary'}`}>{s.name}</p>
                      <p className="text-xs text-text-muted">{s.description}</p>
                    </div>
                    {s.id === currentSchedule && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aparência */}
        <div className="bg-bg-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Aparência</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={18} className="text-accent" /> : <Sun size={18} className="text-accent" />}
              <div>
                <p className="text-sm font-medium text-text-primary">Tema {theme === 'dark' ? 'escuro' : 'claro'}</p>
                <p className="text-xs text-text-muted">Alternar aparência do app</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors btn-ghost ${
                theme === 'light' ? 'bg-accent' : 'bg-bg-hover'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                theme === 'light' ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
        </div>

        {/* Lembrete Diário */}
        {pushSupported && (
          <div className="bg-bg-card rounded-xl p-4">
            <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Lembrete Diário</h2>
            {pushDenied ? (
              <div className="flex items-center gap-3">
                <BellOff size={18} className="text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Notificações bloqueadas</p>
                  <p className="text-xs text-text-muted">Ative nas configurações do navegador.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pushSubscribed ? <Bell size={18} className="text-accent" /> : <BellOff size={18} className="text-text-muted" />}
                    <div>
                      <p className="text-sm font-medium text-text-primary">Receber lembrete</p>
                      <p className="text-xs text-text-muted">
                        {pushSubscribed ? `Notificação às ${String(pushHour).padStart(2, '0')}:00` : 'Ative para receber um lembrete diário'}
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
                      <span className="text-xs text-text-muted">Horário:</span>
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

        {/* Backup */}
        <div className="bg-bg-card rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Backup</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const json = exportProgress()
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `biblia-backup-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
                URL.revokeObjectURL(url)
                showToast('Backup exportado com sucesso')
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl p-3 transition-colors"
            >
              <Download size={16} />
              <span className="text-sm font-medium">Exportar</span>
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.json'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const result = importProgress(ev.target?.result as string)
                    showToast(result.message, result.success ? 'success' : 'error')
                    if (result.success) setTimeout(() => window.location.reload(), 1000)
                  }
                  reader.readAsText(file)
                }
                input.click()
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-purple/10 hover:bg-purple/20 text-purple rounded-xl p-3 transition-colors"
            >
              <Upload size={16} />
              <span className="text-sm font-medium">Importar</span>
            </button>
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
              <p className="text-sm text-text-primary">{email || '—'}</p>
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
