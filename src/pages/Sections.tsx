import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sections, getDaysInSection } from '../lib/reading-plan'
import {
  CheckCircle, ScrollText, Music, MessageSquare,
  Crown, Home, Bird, Users, Mail, PenTool, BookOpen, Cookie,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  scroll: <ScrollText size={22} />,
  crown: <Crown size={22} />,
  house: <Home size={22} />,
  music: <Music size={22} />,
  'message-square': <MessageSquare size={22} />,
  dove: <Bird size={22} />,
  users: <Users size={22} />,
  mail: <Mail size={22} />,
  'pen-tool': <PenTool size={22} />,
  cookie: <Cookie size={22} />,
}

export default function Sections() {
  const navigate = useNavigate()
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())

  useEffect(() => {
    supabase.from('reading_progress').select('day_number').then(({ data }) => {
      if (data) setCompletedDays(new Set(data.map(r => r.day_number)))
    })
  }, [])

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <h1 className="text-lg font-bold text-text-primary">Seções da Bíblia</h1>

      {sections.map(section => {
        const days = getDaysInSection(section.id)
        const completed = days.filter(d => completedDays.has(d.day)).length
        const total = days.length
        const pct = Math.round((completed / total) * 100)

        return (
          <div key={section.id} className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden card">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-accent">{iconMap[section.icon] || <BookOpen size={22} />}</span>
                <div className="flex-1">
                  <h2 className="font-semibold text-text-primary text-sm">{section.name}</h2>
                  <p className="text-xs text-text-muted">{completed}/{total} dias • {pct}%</p>
                </div>
                {pct === 100 ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : null}
              </div>

              <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: section.color }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {days.map(d => {
                  const isDone = completedDays.has(d.day)
                  return (
                    <button
                      key={d.day}
                      onClick={() => navigate(`/ler/${d.day}`)}
                      className={`h-7 px-1.5 rounded-md text-xs flex items-center gap-1 transition-colors btn-ghost ${
                        isDone
                          ? 'text-white'
                          : 'bg-bg-hover text-text-secondary hover:bg-accent/10'
                      }`}
                      style={isDone ? { backgroundColor: section.color } : {}}
                      title={`${d.title}${isDone ? ' ✓' : ''}`}
                    >
                      {d.marker && <span className="text-[10px]">{d.marker}</span>}
                      <span>{d.day}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
