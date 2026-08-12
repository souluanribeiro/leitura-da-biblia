import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sections, getDaysInSection, getTodayReadingDay, calcStreak, getReadingStartDate, getScheduleDays, getDateForReadingDay, getCurrentSchedule, PLAN_DAYS } from '../lib/reading-plan'
import { shareContent } from '../lib/share'
import { Flame, FileText, TrendingUp, ChevronLeft, Clock, ChevronRight, Share2, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'


interface ReadingStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  completedDays: number
  totalNotes: number
  weeklyData: number[]
  monthlyData: number[]
  monthlyTotal: number[]
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
        .eq('schedule_id', getCurrentSchedule())

      const { data: notes } = await supabase
        .from('notes')
        .select('day_number, content, created_at')
        .eq('user_id', user.id)

      const completedDays = new Set(progress?.map(p => p.day_number) || [])
      const totalNotes = notes?.length || 0

      const currentStreak = calcStreak(completedDays)

      let longestStreak = 0
      let tempStreak = 0
      for (let i = 1; i <= PLAN_DAYS; i++) {
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

      const monthlyReadingData = Array(12).fill(0)
      const monthlyReadingTotal = Array(12).fill(0)
      const startDate = getReadingStartDate()
      if (startDate) {
        const scheduleId = getCurrentSchedule()
        const scheduleDays = getScheduleDays(scheduleId)
        for (const day of scheduleDays) {
          const date = getDateForReadingDay(day)
          if (date) {
            const month = date.getMonth()
            monthlyReadingTotal[month]++
            if (completedDays.has(day)) {
              monthlyReadingData[month]++
            }
          }
        }
      }

      const heat: Record<string, boolean> = {}
      for (let i = 1; i <= PLAN_DAYS; i++) {
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
        totalDays: PLAN_DAYS,
        currentStreak,
        longestStreak,
        completedDays: completedDays.size,
        totalNotes,
        weeklyData,
        monthlyData: monthlyReadingData,
        monthlyTotal: monthlyReadingTotal,
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
      <div className="min-h-screen bg-bg-dark">
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
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
  const progressPercent = Math.round((stats.completedDays / stats.totalDays) * 100)
  const startDate = getReadingStartDate()
  const daysSinceStart = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1 : 0
  const unreadDays = Math.max(0, daysSinceStart - stats.completedDays)

  const handleShare = () => {
    shareContent(
      'Minha progresso na Bíblia',
      `📖 ${stats.completedDays} dias lidos | 🔥 Sequência de ${stats.currentStreak} dias | 📊 ${progressPercent}% do plano concluído`
    )
  }

  return (
    <div className="min-h-screen bg-bg-dark pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2 space-y-6 fade-in">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary flex-1">Estatísticas</h1>
          <button
            onClick={handleShare}
            className="text-text-muted hover:text-accent p-1.5 transition-colors"
            title="Compartilhar progresso"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <Flame size={16} className="text-orange-500" />
              <span>Sequência Atual</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{stats.currentStreak}</div>
            <div className="text-xs text-text-muted mt-1">dias consecutivos</div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <TrendingUp size={16} className="text-green-500" />
              <span>Melhor Sequência</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{stats.longestStreak}</div>
            <div className="text-xs text-text-muted mt-1">dias consecutivos</div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Dias Lidos</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.completedDays}</div>
            <div className="text-xs text-text-muted mt-1">de {stats.totalDays} dias</div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-white/5 cursor-default">
            <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
              <Clock size={16} className="text-orange-400" />
              <span>Não Lidos</span>
            </div>
            <div className="text-3xl font-bold text-orange-400">{unreadDays}</div>
            <div className="text-xs text-text-muted mt-1">dias pendentes</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/notas')}
          className="w-full bg-purple-500 rounded-2xl p-4 flex items-center gap-3 hover:bg-purple-400 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-white" />
            <span className="text-sm font-medium text-white">Anotações</span>
          </div>
          <div className="flex-1 text-right">
            <span className="text-xl font-bold text-white">{stats.totalNotes}</span>
            <span className="text-xs text-white/70 ml-1">notas</span>
          </div>
          <ChevronRight size={16} className="text-white shrink-0" />
        </button>

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
            {stats.completedDays} de {stats.totalDays} dias concluídos
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Atividade por Dia da Semana</h2>
          <div className="flex items-end justify-between h-32 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
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
          <h2 className="text-lg font-semibold text-text-primary mb-4">Progresso Mensal de Leitura</h2>
          <div className="flex items-end justify-between h-32 gap-1">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month, i) => {
              const total = stats.monthlyTotal[i]
              const done = stats.monthlyData[i]
              const barPct = total > 0 ? (done / total) * 100 : 0
              const isCurrent = i === new Date().getMonth()
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-bg-dark rounded-t relative" style={{ height: '100%', minHeight: '4px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all duration-500 ${
                        isCurrent ? 'bg-gradient-to-t from-accent to-purple-500' : 'bg-accent/40'
                      }`}
                      style={{ height: `${barPct}%` }}
                    />
                  </div>
                  <span className={`text-xs ${isCurrent ? 'text-accent font-semibold' : 'text-text-muted'}`}>{month}</span>
                  <span className={`text-[10px] ${isCurrent ? 'text-accent' : 'text-text-muted/60'}`}>{total > 0 ? Math.round(barPct) : 0}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Progresso por Seção</h2>
          <div className="grid grid-cols-2 gap-3">
            {sections.map(section => {
              const progress = sectionProgress[section.id]
              if (!progress) return null
              const percent = Math.round((progress.completed / progress.total) * 100)
              const ringR = 28
              const circumference = 2 * Math.PI * ringR
              const offset = circumference * (1 - progress.completed / progress.total)
              return (
                <div
                  key={section.id}
                  className="rounded-xl p-4 flex flex-col items-center gap-2"
                  style={{ border: `1.5px solid ${section.color}40`, backgroundColor: `${section.color}08` }}
                >
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r={ringR} fill="none" stroke={`${section.color}20`} strokeWidth="5" />
                      <circle
                        cx="36" cy="36" r={ringR} fill="none"
                        stroke={section.color} strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold" style={{ color: section.color }}>{percent}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-text-primary leading-tight">{section.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{progress.completed}/{progress.total}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-white/5 hover:bg-[#252540] transition-colors">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Mapa de Calor (Últimos 30 Dias)</h2>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const today = getTodayReadingDay()
              const dayNum = today ? today - 34 + i : 1
              const isCompleted = heatmap[dayNum.toString()] || false
              const isFuture = dayNum > (today || PLAN_DAYS)
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
            <span>Não lido</span>
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Lido</span>
          </div>
        </div>
      </div>
    </div>
  )
}