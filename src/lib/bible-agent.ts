import { supabase } from './supabase'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  is_archived: boolean
  is_deleted: boolean
  is_pinned: boolean
}

export async function loadConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data
}

export async function createConversation(userId: string, title?: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title: title || 'Nova conversa' })
    .select()
    .single()

  if (error || !data) return null
  return data
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function archiveConversation(id: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ is_archived: true })
    .eq('id', id)
}

export async function unarchiveConversation(id: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ is_archived: false })
    .eq('id', id)
}

export async function pinConversation(id: string, pinned: boolean): Promise<void> {
  await supabase
    .from('conversations')
    .update({ is_pinned: pinned })
    .eq('id', id)
}

export async function deleteConversation(id: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ is_deleted: true })
    .eq('id', id)
}

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_history')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

export async function loadArchivedConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .eq('is_archived', true)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data
}

export async function loadChatHistory(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_history')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []
  return data.reverse()
}

export async function loadAgentConfig(): Promise<{ name: string; avatar: string; description: string; suggestions: string[] }> {
  const { data, error } = await supabase
    .from('agent_config')
    .select('key, value')

  if (error || !data) {
    return { name: 'Sheep', avatar: '', description: '', suggestions: [] }
  }

  const config: Record<string, string> = {}
  data.forEach(row => { config[row.key] = row.value || '' })

  let suggestions: string[] = []
  try {
    suggestions = JSON.parse(config.agent_suggestions || '[]')
  } catch { suggestions = [] }

  return {
    name: config.agent_name || 'Sheep',
    avatar: config.agent_avatar || '',
    description: config.agent_description || '',
    suggestions,
  }
}

export async function askBibleAgent(params: {
  message: string
  dayNumber: number
  userName: string
  userStatus: string
  readingContext: string
  conversationId?: string
}): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${supabaseUrl}/functions/v1/bible-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(data.error || `Erro ${res.status}`)
  }

  return data.reply
}