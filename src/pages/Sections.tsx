import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sections, getDaysInSection } from '../lib/reading-plan'
import {
  CheckCircle, ScrollText, BookOpen, Music, MessageSquare,
  Volume2, Heart, Ship, Mail, Bookmark, Eye,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  scroll: <ScrollText size={22} />,
  'book-open': <BookOpen size={22} />,
  music: <Music size={22} />,
  'message-square': <MessageSquare size={22} />,
  'volume-2': <Volume2 size={22} />,
  cross: <Heart size={22} />,
  ship: <Ship size={22} />,
  mail: <Mail size={22} />,
  bookmark: <Bookmark size={22} />,
  eye: <Eye size={22} />,
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
                {days.slice(0, 20).map(d => {
                  const isDone = completedDays.has(d.day)
                  return (
                    <button
                      key={d.day}
                      onClick={() => navigate(`/ler/${d.day}`)}
                      className={`w-7 h-7 rounded-md text-xs flex items-center justify-center transition-colors btn-ghost ${
                        isDone
                          ? 'text-white'
                          : 'bg-bg-hover text-text-secondary hover:bg-accent/10'
                      }`}
                      style={isDone ? { backgroundColor: section.color } : {}}
                      title={`Dia ${d.day}${isDone ? ' ✓' : ''}`}
                    >
                      {d.day}
                    </button>
                  )
                })}
                {days.length > 20 && (
                  <span className="text-xs text-text-muted flex items-center px-1">
                    +{days.length - 20}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
