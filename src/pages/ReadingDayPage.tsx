import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getReadingForDay, getBookVideoUrl, getWolUrl, isReadingStarted, setReadingStartDate } from '../lib/reading-plan'
import { getBookIntroVideo } from '../lib/jw-media'
import { ArrowLeft, CheckCircle, Play, BookOpen, Square, CheckSquare, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReadingDaySkeleton } from '../components/Skeleton'

function getChaptersList(chapters: string) {
  const ch = chapters.replace(/\s/g, '').split(/[–-]/)
  const start = parseInt(ch[0])
  const end = parseInt(ch[1] || ch[0])
  if (isNaN(start)) return []
  const list: number[] = []
  for (let i = start; i <= end; i++) list.push(i)
  return list
}

const chapterKey = (readingIdx: number, chapter: number) => `${readingIdx}-${chapter}`

export default function ReadingDayPage() {
  const { day } = useParams()
  const navigate = useNavigate()
  const dayNum = parseInt(day || '1')
  const readings = getReadingForDay(dayNum)
  const [completed, setCompleted] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [checkedChapters, setCheckedChapters] = useState<Record<string, boolean>>({})
  const [videoUrls, setVideoUrls] = useState<Record<number, string | null>>({})
  const [loading, setLoading] = useState(true)

  const totalChapters = readings.reduce((sum, r, i) => sum + getChaptersList(r.chapters).length, 0)
  const checkedCount = readings.reduce((sum, r, i) => {
    const chapters = getChaptersList(r.chapters)
    return sum + chapters.filter(ch => checkedChapters[chapterKey(i, ch)]).length
  }, 0)
  const allChaptersChecked = totalChapters > 0 && checkedCount === totalChapters

  const persistChecked = (next: Record<string, boolean>) => {
    localStorage.setItem(`checked_${dayNum}`, JSON.stringify(next))
  }

  const checkAllChapters = () => {
    const allChecked: Record<string, boolean> = {}
    readings.forEach((r, i) => {
      getChaptersList(r.chapters).forEach(ch => {
        allChecked[chapterKey(i, ch)] = true
      })
    })
    setCheckedChapters(allChecked)
    persistChecked(allChecked)
  }

  const uncheckAllChapters = () => {
    setCheckedChapters({})
    persistChecked({})
  }

  const ensureStartDate = () => {
    if (dayNum === 1 && !isReadingStarted()) setReadingStartDate(new Date())
  }

  const toggleChapter = (key: string) => {
    const next = { ...checkedChapters, [key]: !checkedChapters[key] }
    setCheckedChapters(next)
    persistChecked(next)

    const checked = Object.values(next).filter(Boolean).length
    if (checked === totalChapters && !completed) {
      ensureStartDate()
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase.from('reading_progress').insert({ user_id: data.user.id, day_number: dayNum }).then(() => setCompleted(true))
        }
      })
    } else if (checked < totalChapters && completed) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) supabase.from('reading_progress').delete().eq('user_id', data.user.id).eq('day_number', dayNum)
      })
      setCompleted(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [dayNum])

  const loadAll = async () => {
    const { data } = await supabase.from('reading_progress').select('day_number').eq('day_number', dayNum).maybeSingle()
    const isCompleted = !!data
    setCompleted(isCompleted)

    let saved: Record<string, boolean> | null = null
    try {
      const raw = localStorage.getItem(`checked_${dayNum}`)
      if (raw) saved = JSON.parse(raw)
    } catch {}

    if (isCompleted && (!saved || Object.keys(saved).length === 0)) {
      checkAllChapters()
    } else if (saved && Object.keys(saved).length > 0) {
      setCheckedChapters(saved)
    }

    const { data: noteData } = await supabase.from('notes').select('id, content').eq('day_number', dayNum).maybeSingle()
    if (noteData) {
      setNoteContent(noteData.content)
      setNoteId(noteData.id)
    }

    const uniqueBooks = [...new Set(readings.map(r => r.bookNum))]
    const urls: Record<number, string | null> = {}
    await Promise.all(uniqueBooks.map(async (bookNum) => {
      const result = await getBookIntroVideo(bookNum)
      urls[bookNum] = result?.url || null
    }))
    setVideoUrls(urls)
    setLoading(false)
  }

  const toggleComplete = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    if (completed) {
      await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', dayNum)
      setCompleted(false)
      uncheckAllChapters()
    } else {
      ensureStartDate()
      await supabase.from('reading_progress').insert({ user_id: user.id, day_number: dayNum })
      setCompleted(true)
      checkAllChapters()
    }
  }

  const saveNote = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    if (noteId) {
      await supabase.from('notes').update({ content: noteContent, updated_at: new Date().toISOString() }).eq('id', noteId)
    } else {
      const { data } = await supabase.from('notes').insert({ user_id: user.id, day_number: dayNum, content: noteContent }).select('id').single()
      if (data) setNoteId(data.id)
    }
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  if (loading) return <ReadingDaySkeleton />

  if (readings.length === 0) {
    return (
      <div className="p-4 text-center text-text-muted">
        <p>Dia {dayNum} não encontrado</p>
        <button onClick={() => navigate('/')} className="text-accent mt-2">Voltar</button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-8 fade-in">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-sm btn-ghost">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dia {dayNum}</h1>
        <button
          onClick={toggleComplete}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all btn-primary ${
            completed
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-accent text-white hover:bg-accent-light'
          }`}
        >
          <CheckCircle size={16} />
          {completed ? 'Concluído' : 'Marcar lido'}
        </button>
      </div>

      {totalChapters > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Progresso da leitura</span>
            <span className="text-xs text-text-muted">{checkedCount}/{totalChapters} capítulos</span>
          </div>
          <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${totalChapters > 0 ? (checkedCount / totalChapters) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {readings.map((r, i) => {
        const chaptersList = getChaptersList(r.chapters)
        const videoUrl = videoUrls[r.bookNum]

        return (
          <div key={i} className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden card">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <span className={`text-xl ${r.marker === '🔸' ? 'text-orange-400' : r.marker === '🔹' ? 'text-blue-400' : 'text-text-muted'}`}>{r.marker}</span>
              <div>
                <h2 className="font-semibold text-text-primary">{r.title}</h2>
                <p className="text-xs text-text-muted mt-0.5">{r.section.name}</p>
              </div>
            </div>

            {videoUrl && (
              <div className="border-b border-white/5">
                <video
                  src={videoUrl}
                  controls
                  preload="metadata"
                  className="w-full aspect-video bg-black/40"
                  poster={videoUrl.replace(/\.mp4$/, '.jpg')}
                >
                  <p>Seu navegador não suporta vídeo.</p>
                </video>
              </div>
            )}
            {!videoUrl && videoUrls[r.bookNum] !== undefined && (() => {
              const fallbackUrl = getBookVideoUrl(r.bookNum)
              if (!fallbackUrl) return null
              return (
                <a
                  href={fallbackUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-accent/5 border-b border-white/5 hover:bg-accent/10 transition-colors"
                >
                  <Play size={16} className="text-accent shrink-0" />
                  <span className="text-sm text-text-primary flex-1">Vídeo de introdução — {r.book}</span>
                  <ExternalLink size={14} className="text-text-muted" />
                </a>
              )
            })()}

            <div className="p-4">
              <h3 className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wider">Capítulos</h3>
              <div className="flex flex-col gap-1.5">
                {chaptersList.map(ch => {
                  const key = chapterKey(i, ch)
                  const checked = !!checkedChapters[key]
                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChapter(key)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left ${
                        checked
                          ? 'bg-accent/10 text-accent'
                          : 'bg-bg-hover text-text-secondary hover:bg-white/5'
                      }`}
                    >
                      {checked ? <CheckSquare size={18} className="shrink-0" /> : <Square size={18} className="shrink-0 text-text-muted" />}
                      <span className="flex-1">{r.book} {ch}</span>
                      <a
                        href={getWolUrl(r.bookNum, ch)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-white bg-accent px-2.5 py-1 rounded-lg hover:bg-accent-light transition-colors shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        Ler
                      </a>
                    </button>
                  )
                })}
              </div>
              {allChaptersChecked && (
                <div className="mt-3 flex items-center justify-center gap-2 bg-green-500/10 text-green-400 py-2.5 rounded-xl text-sm font-medium">
                  <CheckCircle size={16} /> Todos os capítulos lidos
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
        <h3 className="text-sm font-medium text-text-muted mb-2">Suas anotações</h3>
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="O que você aprendeu hoje?"
          className="w-full bg-bg-hover border border-white/5 rounded-xl p-3 text-sm text-text-primary placeholder-text-muted resize-none h-28 focus:outline-none focus:border-accent/30"
        />
        <button onClick={saveNote} className="mt-2 text-xs bg-accent hover:bg-accent-light text-white px-4 py-1.5 rounded-lg transition-colors btn-primary">
          {noteSaved ? '✓ Salva' : 'Salvar'}
        </button>
      </div>

      <div className="flex gap-3">
        {dayNum > 1 && (
          <button
            onClick={() => navigate(`/ler/${dayNum - 1}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-bg-card border border-white/5 rounded-xl py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors"
          >
            <ChevronLeft size={16} /> Dia {dayNum - 1}
          </button>
        )}
        {dayNum < 366 && (
          <button
            onClick={() => navigate(`/ler/${dayNum + 1}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-bg-card border border-white/5 rounded-xl py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors"
          >
            Dia {dayNum + 1} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
