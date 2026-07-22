import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getReadingForDay, sections } from '../lib/reading-plan'
import { Search, StickyNote, ChevronRight, X, ChevronDown } from 'lucide-react'

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

function FilterDropdown({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string; color?: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors ${
          value ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-bg-card text-text-muted border border-white/5 hover:border-white/10'
        }`}
      >
        {selected?.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />}
        <span className="truncate max-w-[120px]">{selected?.label || label}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto bg-bg-card border border-white/10 rounded-xl shadow-lg shadow-black/40 z-50 py-1 scrollbar-hide">
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
              !value ? 'text-accent bg-accent/10' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            {label}
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                value === opt.value ? 'text-accent bg-accent/10' : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Notes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<EnrichedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterBook, setFilterBook] = useState('')

  useEffect(() => {
    loadNotes()
  }, [])

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

  const sectionOptions = useMemo(() => sections.map(s => ({ value: s.name, label: s.name, color: s.color })), [])
  const bookOptions = useMemo(() => books.map(b => ({ value: b, label: b })), [books])

  const filtered = useMemo(() => {
    let result = notes
    if (filterSection) {
      result = result.filter(n => n.sectionName === filterSection)
    }
    if (filterBook) {
      result = result.filter(n => n.book === filterBook)
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
  }, [notes, filterSection, filterBook, search])

  const activeFilters: { key: string; label: string; onRemove: () => void }[] = []
  if (filterSection) activeFilters.push({ key: 'section', label: filterSection, onRemove: () => setFilterSection('') })
  if (filterBook) activeFilters.push({ key: 'book', label: filterBook, onRemove: () => setFilterBook('') })
  if (search.trim()) activeFilters.push({ key: 'search', label: `"${search}"`, onRemove: () => setSearch('') })

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Suas Anotações</h1>
        <span className="text-xs text-text-muted">{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</span>
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

      <div className="flex items-center gap-2">
        <FilterDropdown
          label="Seção"
          options={sectionOptions}
          value={filterSection}
          onChange={setFilterSection}
        />
        <FilterDropdown
          label="Livro"
          options={bookOptions}
          value={filterBook}
          onChange={setFilterBook}
        />
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs px-2.5 py-1 rounded-lg">
              {f.label}
              <button onClick={f.onRemove} className="hover:text-white transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={() => { setFilterSection(''); setFilterBook(''); setSearch('') }}
            className="text-xs text-text-muted hover:text-red-400 transition-colors px-1"
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
            {activeFilters.length > 0 ? 'Nenhuma anotação encontrada com esses filtros' : 'Suas anotações aparecerão aqui conforme você for lendo'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <button
              key={note.id}
              onClick={() => navigate(`/ler/${note.day_number}`)}
              className="w-full text-left bg-bg-card rounded-2xl border border-white/5 p-4 hover:bg-bg-hover transition-colors card"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: note.sectionColor }} />
                  <span className="text-xs text-text-muted">Dia {note.day_number}</span>
                </div>
                <ChevronRight size={14} className="text-text-muted shrink-0" />
              </div>
              <h3 className="font-medium text-text-primary text-sm mb-1">{note.title}</h3>
              <p className="text-xs text-text-muted mb-2">{note.sectionName}</p>
              <p className="text-sm text-text-secondary line-clamp-3">{note.content}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
