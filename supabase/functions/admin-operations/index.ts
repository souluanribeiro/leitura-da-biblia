import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALLOWED_ORIGINS = ["https://admin-app-two-orcin.vercel.app", "https://leitura-da-biblia.vercel.app", "http://localhost:5173"]

function getCorsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str)
}

serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido ou expirado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Acesso não autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { action, conversationId, messageId, userId } = await req.json()

    if (action === "delete_conversation" && conversationId) {
      if (!isValidUUID(conversationId)) {
        return new Response(JSON.stringify({ error: "ID de conversa inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      await supabase
        .from("conversations")
        .update({ is_deleted: true })
        .eq("id", conversationId)

      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("conversation_id", conversationId)

      return new Response(JSON.stringify({ success: true, error: error?.message || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "delete_message" && messageId) {
      if (!isValidUUID(messageId)) {
        return new Response(JSON.stringify({ error: "ID de mensagem inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("id", messageId)

      return new Response(JSON.stringify({ success: true, error: error?.message || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (action === "delete_user" && userId) {
      if (!isValidUUID(userId)) {
        return new Response(JSON.stringify({ error: "ID de usuário inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      await supabase
        .from("chat_history")
        .delete()
        .eq("user_id", userId)

      await supabase
        .from("conversations")
        .update({ is_deleted: true })
        .eq("user_id", userId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error("admin-operations error:", e)
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
