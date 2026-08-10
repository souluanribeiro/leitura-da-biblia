import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getReadingForDay, getBookVideoUrl, getWolUrl, isReadingStarted, setReadingStartDate, getChaptersList, getCurrentSchedule, buildAllCheckedChapters, saveCheckedChapters, checkedChaptersStorageKey } from '../lib/reading-plan'
import { getBookIntroVideo } from '../lib/jw-media'
import { ArrowLeft, CheckCircle, Play, Square, CheckSquare, ExternalLink, ChevronLeft, ChevronRight, Trash2, Share2 } from 'lucide-react'
import { ReadingDaySkeleton } from '../components/Skeleton'
import { shareContent, getShareText } from '../lib/share'
import { showToast } from '../components/Toast'

const chapterKey = (readingIdx: number, chapter: number) => `${readingIdx}-${chapter}`

export default function ReadingDayPage() {
  const { day } = useParams()
  const navigate = useNavigate()
  const dayNum = parseInt(day || '1')
  const scheduleId = getCurrentSchedule()
  const readings = getReadingForDay(dayNum)
  const [completed, setCompleted] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteStatus, setNoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [checkedChapters, setCheckedChapters] = useState<Record<string, boolean>>({})
  const [videoUrls, setVideoUrls] = useState<Record<number, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  const totalChapters = readings.reduce((sum, r) => sum + getChaptersList(r.chapters).length, 0)
  const checkedCount = readings.reduce((sum, r, i) => {
    const chapters = getChaptersList(r.chapters)
    return sum + chapters.filter(ch => checkedChapters[chapterKey(i, ch)]).length
  }, 0)
  const allChaptersChecked = totalChapters > 0 && checkedCount === totalChapters

  const persistChecked = (next: Record<string, boolean>) => {
    saveCheckedChapters(dayNum, next)
  }

  const checkAllChapters = () => {
    const allChecked = buildAllCheckedChapters(readings)
    setCheckedChapters(allChecked)
    persistChecked(allChecked)
  }

  const uncheckAllChapters = () => {
    setCheckedChapters({})
    persistChecked({})
  }

  const ensureStartDate = () => {
    if (dayNum === 1 && !isReadingStarted()) {
      const now = new Date()
      setReadingStartDate(now)
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase.from('profiles').upsert({ id: data.user.id, reading_start_date: now.toISOString().slice(0, 10) }, { onConflict: 'id' })
        }
      })
    }
  }

  const toggleChapter = (key: string) => {
    const next = { ...checkedChapters, [key]: !checkedChapters[key] }
    setCheckedChapters(next)
    persistChecked(next)

    const checked = Object.values(next).filter(Boolean).length
    if (checked === totalChapters && !completed) {
      ensureStartDate()
      triggerConfetti()
      showToast('Dia concluído! Parabéns!', 'success')
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase.from('reading_progress').upsert({ user_id: data.user.id, day_number: dayNum, schedule_id: scheduleId }, { onConflict: 'user_id,day_number,schedule_id', ignoreDuplicates: true }).then(() => setCompleted(true))
        }
      })
    } else if (checked < totalChapters && completed) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) supabase.from('reading_progress').delete().eq('user_id', data.user.id).eq('day_number', dayNum).eq('schedule_id', scheduleId)
      })
      setCompleted(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [dayNum])

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('reading_progress').select('day_number').eq('user_id', user?.id ?? '').eq('day_number', dayNum).eq('schedule_id', scheduleId).maybeSingle()
    const isCompleted = !!data
    setCompleted(isCompleted)

    let saved: Record<string, boolean> | null = null
    try {
      const raw = localStorage.getItem(checkedChaptersStorageKey(dayNum))
      if (raw) saved = JSON.parse(raw)
    } catch {}

    if (isCompleted && (!saved || Object.keys(saved).length === 0)) {
      checkAllChapters()
    } else if (saved && Object.keys(saved).length > 0) {
      setCheckedChapters(saved)
    }

    const { data: noteData } = await supabase.from('notes').select('id, content').eq('user_id', user?.id ?? '').eq('day_number', dayNum).maybeSingle()
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
      await supabase.from('reading_progress').delete().eq('user_id', user.id).eq('day_number', dayNum).eq('schedule_id', scheduleId)
      setCompleted(false)
      uncheckAllChapters()
      showToast('Leitura desmarcada', 'info')
    } else {
      ensureStartDate()
      await supabase.from('reading_progress').upsert({ user_id: user.id, day_number: dayNum, schedule_id: scheduleId }, { onConflict: 'user_id,day_number,schedule_id', ignoreDuplicates: true })
      setCompleted(true)
      checkAllChapters()
      triggerConfetti()
      showToast('Dia concluído! Parabéns!', 'success')
    }
  }

  const saveNote = useCallback(async (content: string) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    setNoteStatus('saving')
    try {
      if (noteId) {
        const { error } = await supabase.from('notes').update({ content, updated_at: new Date().toISOString() }).eq('id', noteId).eq('user_id', user.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('notes').insert({ user_id: user.id, day_number: dayNum, content }).select('id').single()
        if (error) throw error
        if (data) setNoteId(data.id)
      }
      setNoteStatus('saved')
    } catch {
      setNoteStatus('error')
    }
  }, [noteId, dayNum])

  const deleteNote = async () => {
    if (!noteId) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    await supabase.from('notes').delete().eq('id', noteId).eq('user_id', user.id)
    setNoteId(null)
    setNoteContent('')
    setNoteStatus('idle')
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (noteContent.trim()) {
      timerRef.current = setTimeout(() => saveNote(noteContent), 1500)
    } else if (noteId) {
      timerRef.current = setTimeout(() => saveNote(''), 1500)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [noteContent, saveNote])

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

      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-text-muted hover:text-text-secondary text-sm btn-ghost">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{readings[0]?.section.name || 'Leitura'}</h1>
          <p className="text-xs text-text-muted">Dia {dayNum} do cronograma de leitura da Bíblia em 1 ano</p>
        </div>
        <button
          onClick={toggleComplete}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all btn-primary ${
            completed
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-orange-500 text-white hover:bg-orange-400'
          }`}
        >
          <CheckCircle size={16} />
          {completed ? 'Concluído' : 'Concluir'}
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
              <div className="flex-1">
                <h2 className="font-semibold text-text-primary">{r.title}</h2>
                <p className="text-xs text-text-muted mt-0.5">{r.section.name}</p>
              </div>
              <button
                onClick={() => shareContent(
                  `Dia ${dayNum} — ${r.title}`,
                  getShareText({ dayNumber: dayNum, title: r.title, book: r.book, sectionName: r.section.name }),
                  `https://leitura-da-biblia.vercel.app/ler/${dayNum}`
                )}
                className="text-text-muted hover:text-accent p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
              >
                <Share2 size={16} />
              </button>
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
                          : 'bg-bg-hover text-text-secondary hover:bg-accent/10'
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-muted">Suas anotações</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              noteStatus === 'saving' ? 'text-text-muted' : noteStatus === 'error' ? 'text-red-400' : noteContent.trim() ? 'text-green-400' : 'opacity-0'
            }`}>
              {noteStatus === 'saving' ? 'Salvando...' : noteStatus === 'error' ? 'Erro ao salvar' : '✓ Salvo'}
            </span>
            {noteContent.trim() && (
              <button
                onClick={() => shareContent(
                  `Minha anotação — Dia ${dayNum}`,
                  `📝 Minha anotação — Dia ${dayNum}\n\n"${noteContent}"\n\n📖 Leitura da Bíblia em 1 Ano`
                )}
                className="text-text-muted hover:text-accent transition-colors p-1"
              >
                <Share2 size={14} />
              </button>
            )}
            {noteId && (
              <button onClick={deleteNote} className="text-text-muted hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="O que você aprendeu hoje?"
          maxLength={5000}
          className="w-full bg-bg-hover border border-white/5 rounded-xl p-3 text-sm text-text-primary placeholder-text-muted resize-none h-28 focus:outline-none focus:border-accent/30"
        />
      </div>

      <div className="flex gap-3">
        {dayNum > 1 && (
          <button
            onClick={() => navigate(`/ler/${dayNum - 1}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-bg-card border border-white/5 rounded-xl py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
        )}
        <button
          onClick={() => navigate(`/ler/${dayNum + 1}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-bg-card border border-white/5 rounded-xl py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors"
        >
          Próximo <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
