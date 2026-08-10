import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getReadingForDay, getBookVideoUrl,
  isReadingStarted, setReadingStartDate, getReadingStartDate,
  calcStreak, getReadingYear,
  searchReadingPlan, schedules, getScheduleDays, getScheduleName,
  getCurrentSchedule, setCurrentSchedule, getNextUncompletedInSchedule,
  buildAllCheckedChapters, saveCheckedChapters,
} from '../lib/reading-plan'
import { BookOpen, Flame, ChevronLeft, ChevronRight, CheckCircle, Play, ChevronDown, ChevronUp, Search, X, ArrowDown, Clock, List, Check, TrendingUp, Loader2, Share2, StickyNote } from 'lucide-react'
import { loadAgentConfig } from '../lib/bible-agent'
import { DashboardSkeleton } from '../components/Skeleton'
import { loadProfile, saveProfile, loadOnboardingStep, saveOnboardingStep, completeOnboarding, isOnboardingCompleted, type UserProfile } from '../lib/user-profile'
import { cacheGet, cacheSet } from '../lib/backup'
import { generateProgressImage } from '../lib/share'

const COMPACT_KEY = 'dashboard_compact'

async function syncStartDateToSupabase(date: Date) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  const { error } = await supabase.from('profiles').upsert({ id: user.id, reading_start_date: date.toISOString().slice(0, 10) }, { onConflict: 'id' })
  if (error) console.error('syncStartDateToSupabase error:', error)
}

function saveAllChaptersChecked(day: number, readings: { chapters: string }[]) {
  saveCheckedChapters(day, buildAllCheckedChapters(readings))
}

function clearAllChapters(day: number) {
  saveCheckedChapters(day, {})
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<number | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [baptismAnniversary, setBaptismAnniversary] = useState<{ years: number; name: string } | null>(null)
  const [agentAvatar, setAgentAvatar] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchReadingPlan>>([])
  const [searchTab, setSearchTab] = useState<'dias' | 'notas'>('dias')
  const [noteResults, setNoteResults] = useState<any[]>([])
  const [compact, setCompact] = useState(() => localStorage.getItem(COMPACT_KEY) === 'true')
  const [pullDistance, setPullDistance] = useState(0)
  const [pulling, setPulling] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSchedule, setScheduleState] = useState(() => getCurrentSchedule())
  const [showScheduleMenu, setShowScheduleMenu] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const onboardingDone = isOnboardingCompleted()
  const started = isReadingStarted()
  const scheduleDays = getScheduleDays(currentSchedule)
  const [currentDay, setCurrentDay] = useState(() => {
    if (!started) return scheduleDays[0] || 1
    return getNextUncompletedInSchedule(scheduleDays, new Set())
  })

  useEffect(() => { loadProgress() }, [currentSchedule])
  useEffect(() => { checkBaptismAnniversary(); loadAgent() }, [])

  const loadAgent = async () => {
    const config = await loadAgentConfig()
    setAgentAvatar(config.avatar)
  }

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
          new Notification('Feliz aniversário de batismo!', {
            body: `${profile.name}, parabéns! Hoje completam ${years} ano${years > 1 ? 's' : ''} do seu batismo. Que bênção!`,
            icon: '/icons/icon-192.png',
          })
        }
      }
    }
  }

  useEffect(() => {
    if (!isReadingStarted()) {
      const sd = getScheduleDays(currentSchedule)
      setCurrentDay(getNextUncompletedInSchedule(sd, new Set()))
    }
  }, [])

  useEffect(() => {
    const sd = getScheduleDays(currentSchedule)
    setCurrentDay(getNextUncompletedInSchedule(sd, completedDays))
  }, [completedDays])

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase.from('reading_progress').select('day_number').eq('user_id', user?.id ?? '').eq('schedule_id', currentSchedule).order('day_number')
    if (err) {
      const cached = cacheGet<number[]>('completed_days_' + currentSchedule)
      if (cached) {
        setCompletedDays(new Set(cached))
      } else {
        setError('Erro ao carregar progresso. Verifique sua conexão.')
      }
      setLoading(false)
      return
    }
    if (data) {
      const days = data.map(r => r.day_number)
      setCompletedDays(new Set(days))
      cacheSet('completed_days_' + currentSchedule, days)
    }
    setLoading(false)
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
  }

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setNoteResults([])
      return
    }
    if (searchTab === 'dias') {
      setSearchResults(searchReadingPlan(searchQuery))
      setNoteResults([])
    } else {
      setSearchResults([])
      ;(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { setNoteResults([]); return }
          const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).ilike('content', `%${searchQuery}%`).order('created_at', { ascending: false }).limit(20)
          setNoteResults(data || [])
        } catch { setNoteResults([]) }
      })()
    }
  }, [searchQuery, searchTab])

  const toggleCompact = () => {
    const next = !compact
    setCompact(next)
    localStorage.setItem(COMPACT_KEY, String(next))
  }

  const changeSchedule = (id: string) => {
    setCurrentSchedule(id)
    setScheduleState(id)
    setShowScheduleMenu(false)
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const dy = touch.clientY - touchStartRef.current.y
    const dx = touch.clientX - touchStartRef.current.x

    if (Math.abs(dy) > Math.abs(dx) && dy > 0 && containerRef.current?.scrollTop === 0) {
      setPulling(true)
      setPullDistance(Math.min(dy * 0.5, 80))
    }

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      setSwipeOffset(dx * 0.3)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pulling && pullDistance > 60) {
      loadProgress()
    }
    setPulling(false)
    setPullDistance(0)

    if (Math.abs(swipeOffset) > 80) {
      const maxDay = scheduleDays[scheduleDays.length - 1] || 366
      if (swipeOffset < 0 && currentDay < maxDay) setCurrentDay(currentDay + 1)
      if (swipeOffset > 0 && currentDay > 1) setCurrentDay(currentDay - 1)
    }
    setSwipeOffset(0)
    touchStartRef.current = null
  }, [pulling, pullDistance, swipeOffset, currentDay, scheduleDays])

  const readings = currentDay > 0 ? getReadingForDay(currentDay) : []
  const daysRead = completedDays.size
  const totalDays = scheduleDays.length
  const streak = calcStreak(completedDays)
  const pct = daysRead > 0 ? Math.round((daysRead / totalDays) * 100) : 0
  const isComplete = currentDay > 0 && completedDays.has(currentDay)
  const year = getReadingYear(currentDay)
  const planComplete = totalDays > 0 && daysRead >= totalDays
  const startDate = getReadingStartDate()
  const daysSinceStart = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1 : 0
  const unreadDays = Math.max(0, daysSinceStart - daysRead)

  let longestStreak = 0
  let tempStreak = 0
  for (let i = 1; i <= 366; i++) {
    if (completedDays.has(i)) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak) }
    else tempStreak = 0
  }

  const handleShareImage = async () => {
    const blob = await generateProgressImage({ streak, daysRead, unreadDays, longestStreak, percentage: pct })
    if (!blob) return
    const file = new File([blob], 'meu-progresso-biblia.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: 'Meu Progresso - Leitura da Bíblia', files: [file] })
      } catch { /* user cancelled */ }
    } else {
      const item = new ClipboardItem({ 'image/png': blob })
      try {
        await navigator.clipboard.write([item])
      } catch { /* fallback failed */ }
    }
  }

  const nextDays: { day: number; title: string; book: string }[] = []
  if (currentDay > 0) {
    let found = 0
    for (let dd = currentDay + 1; dd <= currentDay + 366 && found < 3; dd++) {
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
      const { error: err } = await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', day).eq('schedule_id', currentSchedule)
      if (err) { setError(err.message); setChecking(null); return }
      setCompletedDays(prev => { const n = new Set(prev); n.delete(day); return n })
      clearAllChapters(day)
    } else {
      const { error: err } = await supabase.from('reading_progress').upsert({ user_id: user.id, day_number: day, schedule_id: currentSchedule }, { onConflict: 'user_id,day_number,schedule_id', ignoreDuplicates: true })
      if (err) { setError(err.message); setChecking(null); return }
      setCompletedDays(prev => { const n = new Set(prev); n.add(day); return n })
      saveAllChaptersChecked(day, readings)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
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
          const sd = getScheduleDays(currentSchedule)
          setCurrentDay(getNextUncompletedInSchedule(sd, new Set()))
          navigate('/')
        }}
      />
    )
  }

  if (planComplete) {
    return (
      <div className="p-4 text-center py-16 space-y-4 max-w-lg mx-auto">
        <CheckCircle size={56} className="text-accent mx-auto" />
        <h1 className="text-2xl font-bold text-accent">Bíblia completa!</h1>
        <p className="text-text-muted">Você leu a Bíblia inteira em 366 dias. Incrível!</p>
        <button
          onClick={() => navigate('/calendario')}
          className="text-sm text-accent hover:text-accent-light transition-colors"
        >
          Ver calendário
        </button>
      </div>
    )
  }

  const ringR = 52
  const circumference = 2 * Math.PI * ringR
  const offset = circumference * (1 - daysRead / totalDays)
  const sp = compact ? 'space-y-3' : 'space-y-5'

  return (
    <div
      ref={containerRef}
      className={`p-4 ${sp} max-w-lg mx-auto pb-8 fade-in`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
      {pulling && (
        <div className="flex flex-col items-center gap-1 py-2">
          {loading ? (
            <Loader2 size={24} className="text-accent ptr-spinner" />
          ) : (
            <ArrowDown
              size={24}
              className={`text-accent transition-transform ${pullDistance > 60 ? 'rotate-180' : ''}`}
              style={{ transform: `rotate(${pullDistance > 60 ? 180 : Math.min(pullDistance * 2, 170)}deg)` }}
            />
          )}
          <span className="text-[10px] text-text-muted">
            {loading ? 'Atualizando...' : pullDistance > 60 ? 'Soltar para atualizar' : 'Puxe para baixo'}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs ml-2">✕</button>
        </div>
      )}

      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar livro, capítulo ou nota..."
            className="w-full pl-9 pr-8 py-2.5 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setNoteResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>
        {searchQuery.length >= 2 && (
          <div className="flex border-t border-white/5">
            <button
              onClick={() => setSearchTab('dias')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                searchTab === 'dias'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <BookOpen size={14} /> Dias
            </button>
            <button
              onClick={() => setSearchTab('notas')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                searchTab === 'notas'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <StickyNote size={14} /> Notas
            </button>
          </div>
        )}
        {searchTab === 'dias' && searchResults.length > 0 && (
          <div className="border-t border-white/5 max-h-60 overflow-y-auto">
            {searchResults.map(r => (
              <button
                key={r.day}
                onClick={() => { navigate(`/ler/${r.day}`); setSearchQuery(''); setSearchResults([]); setNoteResults([]) }}
                className="w-full flex items-center gap-3 text-left px-4 py-2.5 hover:bg-bg-hover transition-colors"
              >
                <span className={`text-sm ${r.marker === '🔸' ? 'text-orange-400' : r.marker === '🔹' ? 'text-blue-400' : 'text-text-muted'}`}>{r.marker || '·'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{r.title}</p>
                  <p className="text-xs text-text-muted">Dia {r.day}</p>
                </div>
                <ChevronRight size={14} className="text-text-muted shrink-0" />
              </button>
            ))}
          </div>
        )}
        {searchTab === 'notas' && noteResults.length > 0 && (
          <div className="border-t border-white/5 max-h-60 overflow-y-auto">
            {noteResults.map(note => (
              <button
                key={note.id}
                onClick={() => { navigate(`/ler/${note.day_number}`); setSearchQuery(''); setSearchResults([]); setNoteResults([]) }}
                className="w-full flex items-center gap-3 text-left px-4 py-2.5 hover:bg-bg-hover transition-colors"
              >
                <StickyNote size={14} className="text-yellow-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{note.content.slice(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
                  <p className="text-xs text-text-muted">Dia {note.day_number} · {new Date(note.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <ChevronRight size={14} className="text-text-muted shrink-0" />
              </button>
            ))}
          </div>
        )}
        {searchQuery.length >= 2 && searchTab === 'notas' && noteResults.length === 0 && (
          <div className="border-t border-white/5 px-4 py-3 text-center text-sm text-text-muted">
            Nenhuma nota encontrada.
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <button
            onClick={() => setShowScheduleMenu(!showScheduleMenu)}
            className="w-full bg-bg-card rounded-2xl p-3 border border-white/5 flex items-start gap-2 hover:bg-bg-hover transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <List size={16} className="text-accent" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-tight">Plano de Leitura</p>
              <p className="text-xs text-text-muted leading-snug mt-0.5">{getScheduleName(currentSchedule)}</p>
            </div>
            <ChevronDown size={14} className={`text-text-muted transition-transform shrink-0 mt-1 ${showScheduleMenu ? 'rotate-180' : ''}`} />
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
                  </div>
                  {s.id === currentSchedule && <Check size={14} className="text-accent shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/agente')}
          className="w-1/4 bg-accent/10 rounded-2xl p-3 border border-accent/20 flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors"
        >
          <div className="w-7 h-7 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            {agentAvatar ? (
              <img src={agentAvatar} alt="Sheep" className="w-7 h-7 rounded-xl object-cover" />
            ) : (
              <span className="text-sm">🐑</span>
            )}
          </div>
          <p className="text-sm font-semibold text-text-primary">Sheep</p>
        </button>
      </div>

      {baptismAnniversary && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center space-y-1">
          <p className="text-purple-400 text-sm font-medium">Feliz aniversário de batismo!</p>
          <p className="text-text-muted text-xs">
            {baptismAnniversary.name}, parabéns! Hoje completam <span className="text-purple-400 font-bold">{baptismAnniversary.years} ano{baptismAnniversary.years > 1 ? 's' : ''}</span> do seu batismo. Que bênção!
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <Flame size={24} className="text-orange-500 flame-animate" />
            {streak > 0 && streak % 7 === 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
            )}
          </div>
          <div className="text-xl font-bold text-text-primary leading-none">{streak}</div>
          <div className="text-[10px] text-text-muted">dias seguidos</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CheckCircle size={24} className="text-green-400" />
          <div className="text-xl font-bold text-text-primary leading-none">{daysRead}</div>
          <div className="text-[10px] text-text-muted">dias lidos</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock size={24} className="text-orange-400" />
          <div className="text-xl font-bold text-text-primary leading-none">{unreadDays}</div>
          <div className="text-[10px] text-text-muted">não lidos</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <TrendingUp size={24} className="text-green-400" />
          <div className="text-xl font-bold text-text-primary leading-none">{longestStreak}</div>
          <div className="text-[10px] text-text-muted">melhor</div>
        </div>
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
            {year > 1 && <div className="text-xs text-text-muted">Ano {year}</div>}
          </div>
        </div>
      </div>

      <button
        onClick={handleShareImage}
        className="mx-auto flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
        title="Compartilhar progresso"
      >
        <Share2 size={12} /> Compartilhar
      </button>

      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className={`${compact ? 'p-3' : 'p-4'} border-b border-white/5 flex items-center justify-between`}>
          <div className="pl-3">
            <h2 className="font-semibold text-text-primary">Leitura atual</h2>
            <p className="text-xs text-text-muted">Dia {currentDay} do plano{year > 1 ? ` (Ano ${year})` : ''}</p>
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
            {isComplete ? 'Leitura concluída' : checking === currentDay ? '...' : 'Concluir leitura'}
          </button>
        </div>
        <div className={`${compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}>
          {readings.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`text-base font-mono ${r.marker === '🔸' ? 'text-orange-400' : r.marker === '🔹' ? 'text-blue-400' : 'text-text-muted'}`}>{r.marker}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary text-sm">{r.title}</h3>
                {!compact && <p className="text-xs text-text-muted mt-0.5">{r.section.name}</p>}
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

      <div className="flex gap-3">
        {currentDay > 1 && (
          <button
            onClick={() => setCurrentDay(currentDay - 1)}
            className="flex-1 flex items-center justify-center gap-2 bg-accent text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-light transition-colors"
          >
            <ChevronLeft size={16} /> Dia {currentDay - 1}
          </button>
        )}
        <button
          onClick={() => setCurrentDay(currentDay + 1)}
          className="flex-1 flex items-center justify-center gap-2 bg-accent text-white rounded-xl py-3 text-sm font-medium hover:bg-accent-light transition-colors"
        >
          Dia {currentDay + 1} <ChevronRight size={16} />
        </button>
      </div>

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
          <h3 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">Próximos dias</h3>
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

      <div className="flex justify-center">
        <button
          onClick={toggleCompact}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
        >
          {compact ? 'Modo normal' : 'Modo compacto'}
        </button>
      </div>
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
          <p className="text-sm text-white font-medium truncate">Vídeo: Introdução a {r.book}</p>
          <p className="text-xs text-white/70 truncate">Assistir vídeo</p>
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
          <h1 className="text-xl font-bold text-text-primary">Ler a Bíblia é sempre bom, né?</h1>
          <p className="text-text-muted text-sm">Vou te explicar como funciona:</p>
        </div>

        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            Você pode ler os livros da Bíblia pela ordem ou por assunto, com base nas categorias
            na aba Seções. Se ler um grupo de capítulos por dia, você lerá a Bíblia inteira em um ano.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">🔸</span>
              <p>Leia os dias com o marcador <span className="font-semibold text-orange-400">Laranja</span> para ter uma visão histórica geral dos tratos de Deus com os israelitas.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">🔹</span>
              <p>Leia os dias com o marcador <span className="font-semibold text-blue-400">Azul</span> para ter uma visão cronológica geral do desenvolvimento da congregação cristã.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors btn-primary"
        >
          Começar agora
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pt-16 fade-in">
      {step === 0 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Olá, que bom ver você aqui!<br />
            Antes de começarmos, me diga seu nome:
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
            Próximo
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Prazer em conhecer você, <span className="font-bold">{profile.name}</span>!<br />
            <span className="font-normal">Pode me dizer sua idade?<br />Quantos anos você tem?</span>
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
            Próximo
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Você já dedicou sua vida<br />a Jeová e se batizou?
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
              Não
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Quando você se batizou?
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
            Próximo
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-text-primary leading-relaxed text-center">
            Você pretende se batizar<br />como Testemunha de Jeová<br />um dia?
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
              Não
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
