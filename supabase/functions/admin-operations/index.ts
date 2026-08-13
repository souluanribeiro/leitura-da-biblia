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

// Decodifica o JWT (sem validar assinatura — já validado por auth.getUser acima)
// só para ler a claim "aal" (authenticator assurance level). service_role
// ignora RLS, então esta função é a única barreira contra uma sessão aal1
// (só senha, sem o código de MFA) fazendo ações destrutivas por aqui.
function getAal(token: string): string | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const claims = JSON.parse(json)
    return typeof claims?.aal === "string" ? claims.aal : null
  } catch {
    return null
  }
}

async function audit(
  supabase: any,
  actorId: string,
  actorEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  detail: string
) {
  try {
    await supabase.from("admin_audit_log").insert({
      action,
      target_type: targetType,
      target_id: targetId,
      detail,
      actor_id: actorId,
      actor_email: actorEmail,
    })
  } catch (e) {
    console.error("audit insert error:", e)
  }
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

    if (getAal(token) !== "aal2") {
      return new Response(JSON.stringify({ error: "Autenticação em duas etapas exigida para esta ação" }), {
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
      const { error: convError } = await supabase
        .from("conversations")
        .update({ is_deleted: true })
        .eq("id", conversationId)

      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("conversation_id", conversationId)

      if (convError || error) {
        console.error("delete_conversation error:", convError?.message, error?.message)
        return new Response(JSON.stringify({ success: false, error: "Erro ao excluir a conversa" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      await audit(supabase, user.id, user.email || "", "delete_conversation", "conversations", conversationId, "Exclusão pela edge function")

      return new Response(JSON.stringify({ success: true }), {
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

      if (error) {
        console.error("delete_message error:", error.message)
        return new Response(JSON.stringify({ success: false, error: "Erro ao excluir a mensagem" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      await audit(supabase, user.id, user.email || "", "delete_message", "chat_history", messageId, "Exclusão pela edge function")

      return new Response(JSON.stringify({ success: true }), {
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
      // LGPD: remove todos os dados pessoais (tabelas que referenciam o usuário)
      const tables = ["chat_history", "conversations", "reading_progress", "notes", "push_subscriptions", "error_logs"]
      let failures: string[] = []
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq("user_id", userId)
        if (error) failures.push(`${table}: ${error.message}`)
      }
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)
      if (profileError) failures.push(`profiles: ${profileError.message}`)

      const { error: authError } = await supabase.auth.admin.deleteUser(userId, true)
      if (authError) failures.push(`auth: ${authError.message}`)

      if (failures.length > 0) {
        console.error("delete_user partial errors:", failures.join(" | "))
        return new Response(JSON.stringify({ success: false, error: "Erro parcial ao excluir o usuário" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      await audit(
        supabase, user.id, user.email || "deleted",
        "delete_user", "user", userId,
        "LGPD: exclusão completa de dados do usuário"
      )

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
