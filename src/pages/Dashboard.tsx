import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getReadingForDay, getBookVideoUrl, getNextUncompletedDay,
  isReadingStarted, getReadingStartDate, setReadingStartDate,
} from '../lib/reading-plan'
import { BookOpen, Flame, ChevronRight, CheckCircle, Play, ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react'
import { DashboardSkeleton } from '../components/Skeleton'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getSubscriptionStatus, updatePreferredHour } from '../lib/push'

function calcStreak(days: Set<number>): number {
  const maxDone = Math.max(...Array.from(days), 0)
  if (maxDone === 0) return 0
  let s = 0
  for (let d = maxDone; d >= 1; d--) {
    if (days.has(d)) s++
    else break
  }
  return s
}

function getChaptersList(chapters: string) {
  const ch = chapters.replace(/\s/g, '').split(/[–-]/)
  const start = parseInt(ch[0])
  const end = parseInt(ch[1] || ch[0])
  if (isNaN(start)) return []
  const list: number[] = []
  for (let i = start; i <= end; i++) list.push(i)
  return list
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
  const [pushHour, setPushHour] = useState(8)
  const [pushLoading, setPushLoading] = useState(false)

  const started = isReadingStarted()
  const [currentDay, setCurrentDay] = useState(() => started ? getNextUncompletedDay(completedDays) : 0)

  useEffect(() => { loadProgress(); loadPushStatus() }, [])

  useEffect(() => {
    if (completedDays.size > 0) {
      setCurrentDay(getNextUncompletedDay(completedDays))
    }
  }, [completedDays])

  const loadProgress = async () => {
    const { data } = await supabase.from('reading_progress').select('day_number').order('day_number')
    if (data) setCompletedDays(new Set(data.map(r => r.day_number)))
    setLoading(false)
  }

  const loadPushStatus = async () => {
    if (!isPushSupported()) return
    setPushSupported(true)
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
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setChecking(null); return }
    if (!started) setReadingStartDate(new Date())
    if (completedDays.has(day)) {
      await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', day)
      setCompletedDays(prev => { const n = new Set(prev); n.delete(day); return n })
      clearAllChapters(day)
    } else {
      await supabase.from('reading_progress').insert({ user_id: user.id, day_number: day })
      setCompletedDays(prev => { const n = new Set(prev); n.add(day); return n })
      saveAllChaptersChecked(day, readings)
    }
    setChecking(null)
  }

  if (loading) return <DashboardSkeleton />

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

  if (!started || currentDay === 0) {
    setReadingStartDate(new Date())
    const day = getNextUncompletedDay(completedDays)
    setCurrentDay(day)
  }

  const ringR = 52
  const circumference = 2 * Math.PI * ringR
  const offset = circumference * (1 - daysRead / 366)

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-8 fade-in">
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
            <span>Leitura concluída</span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">Hoje: ler</span>
        )}
      </div>

      <div className="flex justify-center py-2">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={ringR} fill="none" stroke="#333333" strokeWidth="8" />
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
                : 'bg-accent text-white hover:bg-accent-light'
            }`}
          >
            {isComplete ? 'Leitura concluída' : checking === currentDay ? '...' : 'Concluir leitura'}
          </button>
        </div>
        <div className="p-4 space-y-3">
          {readings.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`text-base font-mono ${r.marker === '🔸' ? 'text-orange-400' : r.marker === '🔹' ? 'text-blue-400' : 'text-text-muted'}`}>{r.marker}</span>
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
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-bg-hover transition-colors"
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
                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-bg-hover transition-colors"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pushSubscribed ? <Bell size={18} className="text-accent" /> : <BellOff size={18} className="text-text-muted" />}
              <div>
                <p className="text-sm font-medium text-text-primary">Lembrete diário</p>
                <p className="text-xs text-text-muted">
                  {pushSubscribed ? `Notificação às ${String(pushHour).padStart(2, '0')}:00` : 'Ative para receber um lembrete'}
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
          <p className="text-sm text-white font-medium truncate">Vídeo: Introdução a {r.book}</p>
          <p className="text-xs text-white/70 truncate">Assistir vídeo</p>
        </div>
      </div>
    </a>
  )
}
