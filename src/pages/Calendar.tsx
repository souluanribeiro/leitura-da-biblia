import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  readingPlan, getReadingForDay, isReadingStarted, getReadingStartDate,
  getReadingDayForDate, getDateForReadingDay, clearReadingStartDate,
  setReadingStartDate, getTodayReadingDay,
} from '../lib/reading-plan'
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, RotateCcw } from 'lucide-react'
import { CalendarSkeleton } from '../components/Skeleton'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

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
  const todayReading = todayReadingDay ? getReadingForDay(todayReadingDay) : []
  const daysRead = completed.size

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <h1 className="text-lg font-bold text-text-primary">Calendário</h1>

      {started && startDate && (
        <p className="text-xs text-text-muted">
          Início: {startDate.toLocaleDateString('pt-BR')} · Progresso: {daysRead}/366 dias ({Math.round(daysRead / 366 * 100)}%)
        </p>
      )}

      {!started && todayReadingDay === null && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 text-center space-y-2">
          <BookOpen size={24} className="text-accent mx-auto" />
          <p className="text-sm text-text-muted">Comece sua primeira leitura para iniciar o cronograma.</p>
        </div>
      )}

      <div className="flex gap-1.5 bg-bg-card rounded-xl p-1 border border-white/5">
        {([['month','Mês'],['week','Semana'],['day','Dia'],['year','Ano']] as const).map(([key, label]) => (
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
            <p className="text-sm text-text-muted">Todo o progresso será apagado. Essa ação não pode ser desfeita.</p>
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
          const title = hasReading ? `Dia ${cell.readingDay} — ${reading[0]?.title || ''}` : `Dia ${cell.day}`

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
  const label = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0, 3)}`

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
              <span className="text-accent">•</span>
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
          const pct = total > 0 ? Math.round(doneCount / 366 * 100) : 0

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
              <p className="text-[10px] text-text-muted">{doneCount} dias · {pct}%</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
