import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GROQ_API_KEYS = (Deno.env.get("GROQ_API_KEYS") || "").split(",").filter(Boolean)
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const PROMPT_NOT_CONFIGURED_REPLY =
  '⚠️ O Sheep ainda não foi configurado.\n\nPeça ao administrador para definir o prompt do agente no painel de administração (Prompt do Agente). Sem esse prompt, o Sheep não consegue funcionar.'

const NO_SOURCES_NOTICE =
  '[AVISO IMPORTANTE: a busca na base de conhecimento (fontes carregadas pelo administrador) NÃO retornou NENHUM artigo para a pergunta do usuário. Isso significa que este assunto NÃO está coberto pelas fontes carregadas.\n\nNESTA SITUAÇÃO VOCÊ DEVE:\n- Responder de forma curta e educada avisando que não encontrou esse assunto nas fontes carregadas pelo administrador.\n- NÃO inventar versículos, citações bíblicas, doutrina nem informações que não estejam nas fontes.\n- Se fizer sentido, oferecer-se para ajudar com outro tema que esteja nas fontes.]'

const ALLOWED_ORIGINS = ["https://leitura-da-biblia.vercel.app", "https://admin-app-two-orcin.vercel.app", "http://localhost:5173"]

function getCorsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

function getNextKey(lastIndex: number): { key: string; idx: number } {
  const idx = (lastIndex + 1) % GROQ_API_KEYS.length
  return { key: GROQ_API_KEYS[idx], idx }
}

async function fetchAgentConfig(supabase: any) {
  try {
    const { data } = await supabase
      .from("agent_config")
      .select("key, value")
      .in("key", ["system_prompt", "agent_name"])
    const config: Record<string, string> = {}
    if (data) data.forEach((row: any) => { config[row.key] = row.value || "" })
    return {
      system_prompt: config.system_prompt || "",
      agent_name: config.agent_name || "Sheep",
    }
  } catch {
    return { system_prompt: "", agent_name: "Sheep" }
  }
}

async function searchKnowledgeBase(supabase: any, query: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("search_knowledge_base_fts", {
      search_query: query,
      match_count: 6,
    })
    if (error) throw error
    if (!data || data.length === 0) return ""
    const MAX_SOURCE_CHARS = 1200
    return data
      .map((d: any, i: number) => {
        const content = d.content ? d.content.substring(0, MAX_SOURCE_CHARS) : ""
        const truncated = d.content && d.content.length > MAX_SOURCE_CHARS
        return `[Fonte ${i + 1}] ${d.title}\n${content}${truncated ? "..." : ""}`
      })
      .join("\n\n")
  } catch (e) {
    console.error("FTS search error:", e)
    return ""
  }
}

async function fetchUserNotes(supabase: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("day_number, content, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10)
    if (error || !data || data.length === 0) return "Nenhuma nota disponível."
    return data.map((n: any) =>
      `- Dia ${n.day_number}: ${n.content.substring(0, 150)}${n.content.length > 150 ? "..." : ""}`
    ).join("\n")
  } catch {
    return "Nenhuma nota disponível."
  }
}

async function fetchChatHistory(supabase: any, userId: string, conversationId: string | null) {
  try {
    let query = supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(16)
    if (conversationId) query = query.eq("conversation_id", conversationId)
    const { data, error } = await query
    if (error || !data) return []
    const MAX_MSG_CHARS = 400
    return data.reverse().map((m: any) => ({
      role: m.role,
      content: m.content && m.content.length > MAX_MSG_CHARS
        ? m.content.substring(0, MAX_MSG_CHARS) + "..."
        : m.content,
    }))
  } catch {
    return []
  }
}

async function saveChatMessage(supabase: any, userId: string, role: string, content: string, conversationId: string | null) {
  try {
    const insertData: Record<string, unknown> = { user_id: userId, role, content }
    if (conversationId) insertData.conversation_id = conversationId
    await supabase.from("chat_history").insert(insertData)
    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
    }
  } catch (err) {
    console.error("Error saving chat message:", err)
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return new Response(JSON.stringify({ error: "Token de autenticação necessário" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido ou expirado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const userId = user.id
    const { message, dayNumber, userName, userStatus, readingContext, conversationId, chatHistory = [] } = await req.json()

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Config do agente — fonte única de verdade é o admin-app (agent_config)
    const agentConfig = await fetchAgentConfig(supabase)
    const agentName = agentConfig.agent_name
    let systemPrompt = agentConfig.system_prompt

    // Sem prompt configurado no admin → responde aviso, sem prompt padrão no código
    if (!systemPrompt.trim()) {
      return new Response(JSON.stringify({ reply: PROMPT_NOT_CONFIGURED_REPLY }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Busca somente as fontes carregadas no admin-app, e somente se o prompt usar {searchContext}
    let kbResult = ""
    if (systemPrompt.includes("{searchContext}")) {
      kbResult = await searchKnowledgeBase(supabase, message)
    }
    const kbContext = kbResult || NO_SOURCES_NOTICE

    // Notas do usuário — somente se o prompt usar {userNotes}
    let userNotes = "Nenhuma nota disponível."
    if (userId && systemPrompt.includes("{userNotes}")) {
      userNotes = await fetchUserNotes(supabase, userId)
    }

    const dbHistory = await fetchChatHistory(supabase, userId, conversationId)

    // System prompt montado única e exclusivamente com o prompt do admin
    const systemPromptFilled = systemPrompt
      .replace(/\{agentName\}/g, agentName)
      .replace(/\{userName\}/g, userName || "Leitor")
      .replace(/\{userStatus\}/g, userStatus || "Não batizado")
      .replace(/\{dayNumber\}/g, String(dayNumber || ""))
      .replace(/\{readingContext\}/g, readingContext || "Plano de leitura da Bíblia em 366 dias")
      .replace(/\{userNotes\}/g, userNotes)
      .replace(/\{searchContext\}/g, kbContext)

    const messages = [{ role: "system", content: systemPromptFilled }]
    for (const msg of dbHistory) {
      messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content })
    }
    const MAX_CLIENT_HISTORY = 12
    for (const m of chatHistory.slice(0, MAX_CLIENT_HISTORY)) {
      if (!dbHistory.some((d: any) => d.content === m.content && d.role === m.role)) {
        messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })
      }
    }
    messages.push({ role: "user", content: message })

    await saveChatMessage(supabase, userId, "user", message, conversationId)

    // Chamada ao Groq com rodízio de chaves + retry em caso de 429
    let lastKeyIndex = -1
    let response: Response | null = null
    let groqError: string | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      const { key, idx } = getNextKey(lastKeyIndex)
      lastKeyIndex = idx

      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      })

      if (response.ok) break
      if (response.status === 429 || response.status === 413) {
        groqError = "429"
        await new Promise((r) => setTimeout(r, 1000))
        continue
      }
      groqError = `${response.status}: ${await response.text()}`
      break
    }

    if (!response || !response.ok) {
      const errorMsg = groqError?.startsWith("429")
        ? "Muitas requisições. Aguarde um momento e tente novamente."
        : "Erro ao processar a resposta da IA"
      console.error("Groq API error:", groqError)
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    await saveChatMessage(supabase, userId, "assistant", text, conversationId)

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Edge function error:", err)
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
