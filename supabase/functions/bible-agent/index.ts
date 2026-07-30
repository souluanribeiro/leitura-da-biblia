import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GROQ_API_KEYS = (Deno.env.get("GROQ_API_KEYS") || "").split(",").filter(Boolean)
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.3-70b-versatile"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

let keyIndex = 0
function getNextKey() {
  if (GROQ_API_KEYS.length === 0) throw new Error("No API keys configured")
  const key = GROQ_API_KEYS[keyIndex % GROQ_API_KEYS.length]
  keyIndex++
  return key
}

const DEFAULT_SYSTEM_PROMPT = `## IDENTIDADE
Você é o **Sheep**, uma ovelha gentil, sábia e encorajadora que guia 
{userName} em sua jornada bíblica. Você pensa, fala e ensina como uma 
Testemunha de Jeová madura — usa o nome divino "Jeová" naturalmente, 
domina a Tradução do Novo Mundo (TNM) e conhece bem as publicações e o 
entendimento atual da Organização das Testemunhas de Jeová.

---

## CONTEXTO DO USUÁRIO

- **Nome:** {userName}
- **Status:** {userStatus}
- **Progresso:** Dia {dayNumber} de 366 do plano de leitura anual
- **Leitura de hoje:** {readingContext}

---

## REGRAS

1. **Idioma:** Sempre em português do Brasil.
2. **Citação textual:** Quando a BASE DE CONHECIMENTO contiver versículos, copie-os **exatamente como escritos**, sem parafrasear ou resumir. Use aspas para citações diretas.
3. **Tradução:** Use a TNM ao citar versículos. Prefira sempre o texto exato da BASE DE CONHECIMENTO em vez de citar de memória.
4. **Nome divino:** Use sempre "Jeová" para se referir a Deus.
5. **Tom:** Acolhedor, encorajador e didático.
6. **Objetividade:** Respostas de 1 a 3 parágrafos no máximo.
7. **Emojis:** No máximo 1 por resposta.
8. **Continuidade:** Leve em conta o que já foi discutido anteriormente.
9. **Perguntas:** Inclua 1 pergunta por resposta para estimular o raciocínio.
10. **Fidelidade:** Se a BASE DE CONHECIMENTO estiver vazia, avise que não encontrou informação na base e responda com seu conhecimento geral, mas nunca invente versículos.

---

## NOTAS DO USUÁRIO (CONTEXTO OCULTO)

{userNotes}

---

## RESULTADOS DE BUSCA

{searchContext}`

const ALLOWED_ORIGINS = ["https://leitura-da-biblia.vercel.app", "http://localhost:5173"]

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

async function fetchAgentConfig(supabase) {
  try {
    const { data } = await supabase
      .from('agent_config')
      .select('key, value')
    if (!data) return { system_prompt: DEFAULT_SYSTEM_PROMPT }
    const config = {}
    data.forEach((row) => { config[row.key] = row.value || '' })
    return { system_prompt: config.system_prompt || DEFAULT_SYSTEM_PROMPT }
  } catch {
    return { system_prompt: DEFAULT_SYSTEM_PROMPT }
  }
}

const WOL_BOOK_IDS = {
  "Gênesis":1,"Genesis":1,"Gen":1,"Êxodo":2,"Exodo":2,"Ex":2,"Levítico":3,"Levitico":3,"Lev":3,
  "Números":4,"Numeros":4,"Num":4,"Deuteronômio":5,"Deuteronomio":5,"Deut":5,
  "Josué":6,"Josue":6,"Js":6,"Juízes":7,"Juizes":7,"Jz":7,"Rute":8,"Rt":8,
  "1 Samuel":9,"2 Samuel":10,"1 Reis":11,"2 Reis":12,
  "1 Crônicas":13,"1 Cronicas":13,"2 Crônicas":14,"2 Cronicas":14,
  "Esdras":15,"Esd":15,"Neemias":16,"Ne":16,"Ester":17,"Est":17,"Jó":18,
  "Salmos":19,"Sal":19,"Sl":19,"Provérbios":20,"Pv":20,"Eclesiastes":21,"Ecl":21,"Ec":21,
  "Cântico":22,"Ct":22,"Isaías":23,"Isaias":23,"Is":23,"Jeremias":24,"Jr":24,
  "Lamentações":25,"Lamentacoes":25,"Lam":25,"Ezequiel":26,"Ez":26,"Daniel":27,"Dn":27,
  "Oseias":28,"Os":28,"Joel":29,"Jl":29,"Amós":30,"Amos":30,"Obadias":31,"Jonas":32,
  "Miqueias":33,"Mq":33,"Naum":34,"Na":34,"Habacuque":35,"Hc":35,"Sofonias":36,"Sf":36,
  "Ageu":37,"Ag":37,"Zacarias":38,"Zc":38,"Malaquias":39,"Ml":39,
  "Mateus":40,"Mt":40,"Marcos":41,"Mc":41,"Lucas":42,"Lc":42,
  "João":43,"Joao":43,"Jo":43,"Atos":44,
  "Romanos":45,"Rm":45,"1 Coríntios":46,"1 Corintios":46,"2 Coríntios":47,"2 Corintios":47,
  "Gálatas":48,"Gl":48,"Efésios":49,"Efesios":49,"Ef":49,"Filipenses":50,"Fp":50,"Fl":50,
  "Colossenses":51,"Cl":51,"1 Tessalonicenses":52,"2 Tessalonicenses":53,
  "1 Timóteo":54,"1 Timoteo":54,"2 Timóteo":55,"2 Timoteo":55,"Tito":56,"Tt":56,
  "Filêmon":57,"Fm":57,"Hebreus":58,"Hb":58,"Tiago":59,"Tg":59,
  "1 Pedro":60,"2 Pedro":61,"1 João":62,"1 Joao":62,"2 João":63,"2 Joao":63,
  "3 João":64,"3 Joao":64,"Judas":65,"Jd":65,"Apocalipse":66,"Ap":66,
}

const WOL_UA = "Mozilla/5.0 (compatible; LeituraBibliaAgent/1.0)"

async function fetchVerseFromWOL(bookNum, chapter, verse) {
  try {
    const searchRef = `${chapter}:${verse}`
    const searchUrl = `https://wol.jw.org/pt/wol/s/r5/lp-t?q=${encodeURIComponent(searchRef)}&p=par&r=occ`
    const resp = await fetch(searchUrl, { headers: { "User-Agent": WOL_UA } })
    if (!resp.ok) return ""
    const html = await resp.text()

    const match = html.match(/"result-box"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
    if (!match) return ""
    const content = match[1]

    let text = content
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&mdash;/g, "—")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(\d+:\d+)\s*/g, "")
      .replace(/(\d+)\u00AA|\u00BA/g, "")
      .trim()

    if (text.length < 20) return ""
    return text
  } catch {
    return ""
  }
}

async function searchKnowledgeBase(supabase, query) {
  try {
    let results = []

    // Strategy 1: WOL (Watchtower Online Library) for precise verse lookups
    try {
      const verseRegex = /([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ0-9]+)?)\s*(\d+)[:\s](\d+)/gi
      let match
      while ((match = verseRegex.exec(query)) !== null) {
        const rawBook = match[1].trim()
        const chapter = match[2]
        const verse = match[3]
        const bookNum = WOL_BOOK_IDS[rawBook]
        if (bookNum) {
          const wolText = await fetchVerseFromWOL(bookNum, parseInt(chapter), parseInt(verse))
          if (wolText) {
            results.push(`**${rawBook} ${chapter}:${verse} (TNM)**\n${wolText}`)
          }
        }
      }
    } catch (e) {
      console.error("WOL search error:", e)
    }

    // Strategy 2: PostgreSQL full-text search (conceptual queries)
    try {
      const { data, error } = await supabase.rpc("search_knowledge_base_fts", {
        search_query: query,
        match_count: 5,
      })
      if (!error && data && data.length > 0) {
        results = results.concat(data.map(r => r.content).filter(Boolean))
      }
    } catch (e) {
      console.error("FTS search error:", e)
    }

    // Deduplicate and concatenate
    const seen = new Set()
    const unique = []
    for (const r of results) {
      const key = r.substring(0, 100)
      if (!seen.has(key)) { seen.add(key); unique.push(r) }
    }
    return unique.join("\n\n---\n\n")
  } catch (err) {
    console.error("searchKnowledgeBase error:", err)
    return ""
  }
}

async function fetchUserNotes(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('day_number, content, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error || !data || data.length === 0) return "Nenhuma nota disponível."
    return data.map(n =>
      `- Dia ${n.day_number}: ${n.content.substring(0, 150)}${n.content.length > 150 ? '...' : ''}`
    ).join('\n')
  } catch {
    return "Nenhuma nota disponível."
  }
}

async function fetchChatHistory(supabase, userId, conversationId) {
  try {
    let query = supabase
      .from('chat_history')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (conversationId) query = query.eq('conversation_id', conversationId)
    const { data, error } = await query
    if (error || !data) return []
    return data.reverse()
  } catch {
    return []
  }
}

async function saveChatMessage(supabase, userId, role, content, conversationId) {
  try {
    const insertData = { user_id: userId, role, content }
    if (conversationId) insertData.conversation_id = conversationId
    await supabase.from('chat_history').insert(insertData)
    if (conversationId) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
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
    const { message, dayNumber, userName, userStatus, readingContext, conversationId } = await req.json()

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const [agentConfig, userNotes, dbHistory] = await Promise.all([
      fetchAgentConfig(supabase),
      fetchUserNotes(supabase, userId),
      fetchChatHistory(supabase, userId, conversationId),
    ])

    // Search knowledge base (WOL + FTS) — o resultado vira CONTEXTO pra IA formular
    // a resposta, nunca é devolvido cru. Isso garante que toda resposta passa por
    // raciocínio da IA, e que quando há texto de base disponível, a IA tem o que
    // citar literalmente (em vez de recorrer à própria memória e parafrasear).
    let kbResult = ""
    try {
      kbResult = await searchKnowledgeBase(supabase, message)
    } catch (e) { console.error("Knowledge base search failed:", e) }

    const systemPrompt = (agentConfig.system_prompt || DEFAULT_SYSTEM_PROMPT)
      .replace("{userName}", userName || "Leitor")
      .replace("{userStatus}", userStatus || "Não batizado")
      .replace("{dayNumber}", String(dayNumber || 1))
      .replace("{readingContext}", readingContext || "Plano de leitura da Bíblia em 366 dias")
      .replace("{userNotes}", userNotes)
      .replace("{searchContext}", kbResult || "Nenhum resultado encontrado na base de conhecimento para esta pergunta.")

    const messages = [{ role: "system", content: systemPrompt }]
    for (const msg of dbHistory) {
      messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content })
    }
    messages.push({ role: "user", content: message })

    await saveChatMessage(supabase, userId, "user", message, conversationId)

    let apiKey = getNextKey()
    let response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (response.status === 429 && GROQ_API_KEYS.length > 1) {
      apiKey = getNextKey()
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      })
    }

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API error:", response.status, error)
      let errorMsg = "Erro ao conectar com a IA"
      if (response.status === 429) errorMsg = "Muitas requisições. Aguarde um momento e tente novamente."
      else if (response.status === 401) errorMsg = "Chave de API inválida."
      else errorMsg = "Erro ao processar a resposta da IA"
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
