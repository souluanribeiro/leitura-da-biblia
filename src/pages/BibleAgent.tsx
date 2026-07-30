import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Loader2, Menu, Plus, MessageSquare,
  MoreVertical, Trash2, Archive, ArchiveRestore, Pin, PinOff, Pencil, ChevronRight
} from 'lucide-react'
import {
  askBibleAgent, loadConversations, loadArchivedConversations, createConversation,
  deleteConversation, archiveConversation, unarchiveConversation,
  pinConversation, updateConversationTitle,
  loadMessages, loadAgentConfig,
  type ChatMessage, type Conversation
} from '../lib/bible-agent'
import { loadProfile } from '../lib/user-profile'
import { getReadingForDay, getTodayReadingDay, getReadingDayForDate } from '../lib/reading-plan'
import { supabase } from '../lib/supabase'

function SheepIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="5" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="4" r="2" />
      <circle cx="14" cy="4" r="2" />
      <path d="M12 13v4" />
      <path d="M9 17h6" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
      <circle cx="14" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

export default function BibleAgent() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [agentName, setAgentName] = useState('Sheep')
  const [agentAvatar, setAgentAvatar] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  const profile = loadProfile()
  const today = getReadingDayForDate(new Date())
  const dayNumber = today || getTodayReadingDay() || 1
  const readings = getReadingForDay(dayNumber)
  const readingContext = readings.length > 0
    ? readings.map(r => {
        const parts = [
          `Livro: ${r.book}`,
          `Capítulos: ${r.chapters}`,
          `Seção: ${r.section.name}`,
        ]
        if (r.marker) parts.push(`Marca: ${r.marker}`)
        return parts.join(', ')
      }).join('; ')
    : `Dia ${dayNumber} do plano de leitura`
  const userStatus = profile?.baptized ? 'Batizado' : 'Não batizado'

  useEffect(() => {
    const handleClick = () => setMenuOpen(null)
    if (menuOpen) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [menuOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const config = await loadAgentConfig()
      setAgentName(config.name)
      setAgentAvatar(config.avatar)
      setAgentDescription(config.description)
      if (config.suggestions.length > 0) setSuggestions(config.suggestions)

      const convs = await loadConversations(user.id)
      setConversations(convs)
    }
    init()
  }, [])

  useEffect(() => {
    if (messages.length === 0 && !activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  const loadConversationMessages = async (convId: string) => {
    setActiveConversationId(convId)
    setSidebarOpen(false)
    const msgs = await loadMessages(convId)
    setMessages(msgs)
  }

  const handleNewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const conv = await createConversation(user.id)
    if (conv) {
      setConversations([conv, ...conversations])
      setActiveConversationId(conv.id)
      setMessages([])
      setSidebarOpen(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleDeleteConversation = async (convId: string) => {
    await deleteConversation(convId)
    setConversations(conversations.filter(c => c.id !== convId))
    setArchivedConversations(archivedConversations.filter(c => c.id !== convId))
    if (activeConversationId === convId) {
      setActiveConversationId(null)
      setMessages([])
    }
    setMenuOpen(null)
  }

  const handleArchiveConversation = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId) || archivedConversations.find(c => c.id === convId)
    if (!conv) return
    if (conv.is_archived) {
      await unarchiveConversation(convId)
      setArchivedConversations(archivedConversations.filter(c => c.id !== convId))
    } else {
      await archiveConversation(convId)
      setConversations(conversations.filter(c => c.id !== convId))
      if (activeConversationId === convId) {
        setActiveConversationId(null)
        setMessages([])
      }
    }
    setMenuOpen(null)
  }

  const handlePinConversation = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    if (!conv) return
    const newPinned = !conv.is_pinned
    await pinConversation(convId, newPinned)
    setConversations(
      conversations.map(c => c.id === convId ? { ...c, is_pinned: newPinned } : c)
        .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    )
    setMenuOpen(null)
  }

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id)
    setRenameValue(conv.title)
    setMenuOpen(null)
  }

  const confirmRename = async () => {
    if (!renamingId || !renameValue.trim()) return
    await updateConversationTitle(renamingId, renameValue.trim())
    setConversations(conversations.map(c => c.id === renamingId ? { ...c, title: renameValue.trim() } : c))
    setRenamingId(null)
    setRenameValue('')
  }

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setError(null)

    const userMsg: ChatMessage = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || ''

      let convId = activeConversationId
      if (!convId) {
        const conv = await createConversation(userId, msg.substring(0, 50))
        if (conv) {
          convId = conv.id
          setActiveConversationId(convId)
          setConversations([conv, ...conversations])
        }
      }

      const reply = await askBibleAgent({
        message: msg,
        dayNumber,
        userName: profile?.name || 'Leitor',
        userStatus,
        readingContext,
        conversationId: convId || undefined,
      })
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (err: any) {
      console.error('BibleAgent error:', err)
      setError(err.message || 'Erro ao conectar com o Sheep')
      setMessages(newMessages)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Agora'
    if (diffMin < 60) return `${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="flex h-full fade-in overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {sidebarCollapsed && (
        <div className="hidden lg:flex flex-col items-center w-12 shrink-0 bg-bg-card border-r border-white/5 h-full z-30">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2.5 text-text-muted hover:text-text-secondary transition-colors mt-1"
            title="Expandir barra lateral"
          >
            <Menu size={16} />
          </button>
        </div>
      )}

      <div className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 w-72 bg-bg-card border-r border-white/5 z-50
        transform transition-transform duration-200 ease-in-out
        ${sidebarCollapsed ? 'lg:hidden' : ''}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shrink-0 h-full
      `}>
        <div className="p-3 border-b border-white/5 flex items-center gap-2">
          <button
            onClick={handleNewConversation}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors btn-ghost"
          >
            <Plus size={16} />
            Nova conversa
          </button>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="hidden lg:flex p-2 text-text-muted hover:text-text-secondary transition-colors rounded-lg hover:bg-bg-hover"
            title="Recolher barra lateral"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="px-3 pb-1">
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              if (!showArchived) {
                const archived = await loadArchivedConversations(user.id)
                setArchivedConversations(archived)
              }
              setShowArchived(!showArchived)
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
              showArchived
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover border border-transparent'
            }`}
          >
            <Archive size={14} />
            Arquivadas
            {showArchived && <span className="ml-auto text-[10px] text-accent">{archivedConversations.length}</span>}
          </button>
        </div>

        <div className="flex-1 p-2 space-y-1 scrollbar-hide overflow-y-auto">
          {showArchived && (
            <button
              onClick={() => setShowArchived(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg-hover transition-colors border border-transparent"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
          )}
          {(showArchived ? archivedConversations : conversations).map(conv => (
            <div
              key={conv.id}
              onClick={() => { if (renamingId !== conv.id) loadConversationMessages(conv.id) }}
              className={`
                group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors relative
                ${activeConversationId === conv.id
                  ? 'bg-accent/10 border border-accent/20'
                  : 'hover:bg-bg-hover border border-transparent'}
              `}
            >
              {conv.is_pinned && <Pin size={10} className="text-white shrink-0" />}
              {renamingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingId(null) }}
                    onBlur={confirmRename}
                    className="flex-1 bg-bg-hover border border-accent/30 rounded px-2 py-0.5 text-sm text-text-primary outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ) : (
                <>
                  <MessageSquare size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary truncate">{conv.title}</p>
                    <p className="text-[10px] text-text-muted">{formatDate(conv.updated_at)}</p>
                  </div>
                </>
              )}
              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (menuOpen === conv.id) { setMenuOpen(null); return }
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                    setMenuOpen(conv.id)
                  }}
                  className="md:opacity-0 md:group-hover:opacity-100 p-1 hover:text-text-secondary transition-all rounded-lg"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-text-muted text-sm hover:bg-bg-hover transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao app
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="shrink-0 px-3 py-2 flex items-center gap-2 border-b border-white/5 bg-bg-primary sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-text-muted hover:text-text-secondary p-1"
          >
            <Menu size={16} />
          </button>
          <div className="flex items-center gap-2">
            {agentAvatar ? (
              <img src={agentAvatar} alt={agentName} className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-purple-dim flex items-center justify-center">
                <SheepIcon size={13} className="text-purple" />
              </div>
            )}
            <span className="text-sm font-semibold text-text-primary">{agentName}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                {agentAvatar ? (
                  <img src={agentAvatar} alt={agentName} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-purple-dim flex items-center justify-center">
                    <SheepIcon size={26} className="text-purple" />
                  </div>
                )}
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Olá, {profile?.name || 'Leitor'}!
                  </h2>
                  <p className="text-sm text-text-muted max-w-md">
                    {agentDescription || `Sou o ${agentName}, sua ovelha espiritual. Posso ajudar você a entender a leitura de hoje, explicar versículos ou sugerir reflexões.`}
                  </p>
                </div>

                {suggestions.length > 0 && (
                  <div className="w-full max-w-lg space-y-2">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider text-center">Sugestões</p>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-bg-card border border-white/5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-purple-dim flex items-center justify-center shrink-0 mt-0.5">
                    {agentAvatar ? (
                      <img src={agentAvatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <SheepIcon size={15} className="text-purple" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-br-md'
                      : 'bg-bg-card border border-white/5 text-text-secondary rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                    {profile?.photo ? (
                      <img src={profile.photo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <span className="text-accent text-xs font-bold">
                        {(profile?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-dim flex items-center justify-center shrink-0">
                  <SheepIcon size={15} className="text-purple" />
                </div>
                <div className="bg-bg-card border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                  <Loader2 size={16} className="text-purple animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-white/5">
          <div className="max-w-3xl mx-auto flex items-end gap-2 bg-bg-card border border-white/5 rounded-2xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Pergunte ao ${agentName}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none max-h-24 py-1"
              style={{ height: 'auto', minHeight: '24px' }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 96) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 btn-primary"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && createPortal(
        <div className="fixed inset-0 z-[999]" onClick={() => setMenuOpen(null)}>
          <div
            className="absolute w-40 bg-bg-card border border-white/10 rounded-xl shadow-xl py-1 fade-in"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const conv = conversations.find(c => c.id === menuOpen) || archivedConversations.find(c => c.id === menuOpen)
              if (!conv) return null
              return (
                <>
                  <button
                    onClick={() => { startRename(conv) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                  >
                    <Pencil size={13} />
                    Renomear
                  </button>
                  <button
                    onClick={() => { handlePinConversation(conv.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                  >
                    {conv.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                    {conv.is_pinned ? 'Desafixar' : 'Fixar'}
                  </button>
                  <button
                    onClick={() => { handleArchiveConversation(conv.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                  >
                    {conv.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                    {conv.is_archived ? 'Desarquivar' : 'Arquivar'}
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={() => { handleDeleteConversation(conv.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                    Excluir
                  </button>
                </>
              )
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
