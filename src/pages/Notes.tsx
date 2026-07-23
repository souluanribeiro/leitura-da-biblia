import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getReadingForDay, sections } from '../lib/reading-plan'
import { Search, StickyNote, ChevronRight, X, BookOpen, CalendarDays, Layers } from 'lucide-react'

interface NoteRow {
  id: string
  day_number: number
  content: string
  created_at: string
  updated_at: string
}

interface EnrichedNote extends NoteRow {
  book: string
  title: string
  sectionName: string
  sectionColor: string
}

function daysAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  if (diff < 7) return `há ${diff} dias`
  if (diff < 30) return `há ${Math.floor(diff / 7)} sem`
  return `há ${Math.floor(diff / 30)} mês`
}

export default function Notes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<EnrichedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')

  useEffect(() => { loadNotes() }, [])

  const loadNotes = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('notes')
      .select('id, day_number, content, created_at, updated_at')
      .eq('user_id', user.id)
      .order('day_number', { ascending: false })
    if (data) {
      const enriched: EnrichedNote[] = data.map(n => {
        const readings = getReadingForDay(n.day_number)
        const first = readings[0]
        return {
          ...n,
          book: first?.book || '',
          title: first?.title || `Dia ${n.day_number}`,
          sectionName: first?.section.name || '',
          sectionColor: first?.section.color || '#888',
        }
      })
      setNotes(enriched)
    }
    setLoading(false)
  }

  const books = useMemo(() => [...new Set(notes.map(n => n.book).filter(Boolean))].sort(), [notes])

  const notesThisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return notes.filter(n => new Date(n.updated_at) >= weekAgo).length
  }, [notes])

  const topBook = useMemo(() => {
    if (books.length === 0) return '—'
    const counts: Record<string, number> = {}
    notes.forEach(n => { if (n.book) counts[n.book] = (counts[n.book] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [notes, books])

  const filtered = useMemo(() => {
    let result = notes
    if (filterSection) result = result.filter(n => n.sectionName === filterSection)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.content.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.book.toLowerCase().includes(q)
      )
    }
    return result
  }, [notes, filterSection, search])

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Suas Anotações</h1>
        <span className="text-xs text-text-muted">{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-2xl border border-white/5 p-3 text-center">
          <StickyNote size={18} className="text-accent mx-auto mb-1.5" />
          <div className="text-xl font-bold text-text-primary">{notes.length}</div>
          <div className="text-[10px] text-text-muted mt-0.5">total</div>
        </div>
        <div className="bg-bg-card rounded-2xl border border-white/5 p-3 text-center">
          <CalendarDays size={18} className="text-green-400 mx-auto mb-1.5" />
          <div className="text-xl font-bold text-text-primary">{notesThisWeek}</div>
          <div className="text-[10px] text-text-muted mt-0.5">esta semana</div>
        </div>
        <div className="bg-bg-card rounded-2xl border border-white/5 p-3 text-center">
          <BookOpen size={18} className="text-purple-400 mx-auto mb-1.5" />
          <div className="text-sm font-bold text-text-primary truncate">{topBook}</div>
          <div className="text-[10px] text-text-muted mt-0.5">mais anotado</div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar nas anotações..."
          className="w-full bg-bg-card border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/30"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterSection('')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filterSection ? 'bg-accent text-white' : 'bg-bg-card text-text-muted border border-white/5 hover:border-white/10'
          }`}
        >
          Todas
        </button>
        {sections.map(s => {
          const count = notes.filter(n => n.sectionName === s.name).length
          return (
            <button
              key={s.id}
              onClick={() => setFilterSection(filterSection === s.name ? '' : s.name)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterSection === s.name ? 'text-white' : 'text-white/80'
              }`}
              style={{
                backgroundColor: filterSection === s.name ? s.color : `${s.color}33`,
              }}
            >
              {s.name} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {filterSection && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Filtrando por:</span>
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md text-white"
            style={{ backgroundColor: sections.find(s => s.name === filterSection)?.color || '#888' }}
          >
            {filterSection}
            <button onClick={() => setFilterSection('')} className="hover:opacity-70 transition-opacity">
              <X size={10} />
            </button>
          </span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded-md">
              "{search}"
              <button onClick={() => setSearch('')} className="hover:opacity-70 transition-opacity">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
              <div className="h-3 bg-bg-hover rounded w-1/3 mb-2" />
              <div className="h-3 bg-bg-hover rounded w-2/3 mb-2" />
              <div className="h-2 bg-bg-hover rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-muted text-sm">
            {filterSection || search.trim() ? 'Nenhuma anotação encontrada' : 'Suas anotações aparecerão aqui conforme você for lendo'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <button
              key={note.id}
              onClick={() => navigate(`/ler/${note.day_number}`)}
              className="w-full text-left bg-bg-card rounded-2xl border border-white/5 overflow-hidden hover:bg-bg-hover transition-colors card"
            >
              <div className="h-1.5" style={{ backgroundColor: note.sectionColor }} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-muted">Dia {note.day_number}</span>
                  <span className="text-[10px] text-text-muted">{daysAgo(note.updated_at)}</span>
                </div>
                <h3 className="font-medium text-text-primary text-sm mb-1">{note.title}</h3>
                <p className="text-xs mb-2 px-2 py-0.5 rounded-md inline-block text-white/90" style={{ backgroundColor: `${note.sectionColor}cc` }}>
                  {note.sectionName}
                </p>
                <p className="text-sm text-text-secondary line-clamp-2 mt-2">{note.content}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
