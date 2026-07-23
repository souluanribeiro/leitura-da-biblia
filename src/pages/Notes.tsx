import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getReadingForDay, sections } from '../lib/reading-plan'
import { Search, StickyNote, ChevronRight, X, BookOpen, CalendarDays, ChevronDown } from 'lucide-react'

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

const INITIAL_SHOW = 5

export default function Notes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<EnrichedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterBook, setFilterBook] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [showAllSections, setShowAllSections] = useState(false)
  const [showAllBooks, setShowAllBooks] = useState(false)

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
    if (filterBook) result = result.filter(n => n.book === filterBook)
    if (filterPeriod) {
      const now = new Date()
      const cutoff = new Date()
      if (filterPeriod === 'day') cutoff.setDate(now.getDate() - 1)
      else if (filterPeriod === 'week') cutoff.setDate(now.getDate() - 7)
      else if (filterPeriod === 'month') cutoff.setMonth(now.getMonth() - 1)
      else if (filterPeriod === 'year') cutoff.setFullYear(now.getFullYear() - 1)
      result = result.filter(n => new Date(n.updated_at) >= cutoff)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.content.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.book.toLowerCase().includes(q)
      )
    }
    return result
  }, [notes, filterSection, filterBook, filterPeriod, search])

  const sectionsWithCount = useMemo(() =>
    sections.map(s => ({
      ...s,
      count: notes.filter(n => n.sectionName === s.name).length,
    })).filter(s => s.count > 0),
  [notes, sections])

  const booksWithCount = useMemo(() => {
    const counts: Record<string, number> = {}
    notes.forEach(n => { if (n.book) counts[n.book] = (counts[n.book] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [notes])

  const visibleSections = showAllSections ? sectionsWithCount : sectionsWithCount.slice(0, INITIAL_SHOW)
  const visibleBooks = showAllBooks ? booksWithCount : booksWithCount.slice(0, INITIAL_SHOW)

  const hasActive = filterSection || filterBook || filterPeriod || search.trim()

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

      <div className="space-y-2">
        <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-3">
            <h3 className="text-xs font-medium text-text-muted mb-2">Período</h3>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: '', label: 'Todas' },
                { value: 'day', label: 'Hoje' },
                { value: 'week', label: 'Esta semana' },
                { value: 'month', label: 'Este mês' },
                { value: 'year', label: 'Este ano' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => setFilterPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterPeriod === p.value ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sectionsWithCount.length > 0 && (
          <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-3">
              <h3 className="text-xs font-medium text-text-muted mb-2">Seções</h3>
              <div className="flex flex-wrap gap-1.5">
                {visibleSections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setFilterSection(filterSection === s.name ? '' : s.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                    style={{
                      backgroundColor: filterSection === s.name ? s.color : `${s.color}55`,
                    }}
                  >
                    {s.name} <span className="opacity-70">({s.count})</span>
                  </button>
                ))}
              </div>
              {sectionsWithCount.length > INITIAL_SHOW && (
                <button
                  onClick={() => setShowAllSections(!showAllSections)}
                  className="mt-2 text-xs font-bold text-accent hover:text-accent-light transition-colors"
                >
                  {showAllSections ? 'recolher' : `+${sectionsWithCount.length - INITIAL_SHOW} mais`}
                </button>
              )}
            </div>
          </div>
        )}

        {booksWithCount.length > 0 && (
          <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-3">
              <h3 className="text-xs font-medium text-text-muted mb-2">Livros</h3>
              <div className="flex flex-wrap gap-1.5">
                {visibleBooks.map(b => (
                  <button
                    key={b.name}
                    onClick={() => setFilterBook(filterBook === b.name ? '' : b.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterBook === b.name ? 'bg-purple-600 text-white' : 'bg-bg-hover text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {b.name} <span className="opacity-70">({b.count})</span>
                  </button>
                ))}
              </div>
              {booksWithCount.length > INITIAL_SHOW && (
                <button
                  onClick={() => setShowAllBooks(!showAllBooks)}
                  className="mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showAllBooks ? 'recolher' : `+${booksWithCount.length - INITIAL_SHOW} mais`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {hasActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted">Filtrando:</span>
          {filterPeriod && (
            <span className="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded-md">
              {filterPeriod === 'day' ? 'Hoje' : filterPeriod === 'week' ? 'Esta semana' : filterPeriod === 'month' ? 'Este mês' : 'Este ano'}
              <button onClick={() => setFilterPeriod('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filterSection && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md text-white"
              style={{ backgroundColor: sections.find(s => s.name === filterSection)?.color || '#888' }}>
              {filterSection}
              <button onClick={() => setFilterSection('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filterBook && (
            <span className="inline-flex items-center gap-1 bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-md">
              {filterBook}
              <button onClick={() => setFilterBook('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {search.trim() && (
            <span className="inline-flex items-center gap-1 bg-white/5 text-text-muted text-xs px-2 py-0.5 rounded-md">
              "{search}"
              <button onClick={() => setSearch('')} className="hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          <button
            onClick={() => { setFilterSection(''); setFilterBook(''); setFilterPeriod(''); setSearch('') }}
            className="text-xs text-text-muted hover:text-red-400 transition-colors"
          >
            Limpar tudo
          </button>
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
            {hasActive ? 'Nenhuma anotação encontrada' : 'Suas anotações aparecerão aqui conforme você for lendo'}
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
