import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webPush from "https://esm.sh/web-push@3.6.7"
import { setupVapid, sendNotificationById } from "../_shared/push.ts"

setupVapid()

const ALLOWED_ORIGINS = ["https://admin-app-two-orcin.vercel.app", "http://localhost:5173"]

function getCorsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

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

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const { notificationId, testUserId } = await req.json()

    if (!notificationId && !testUserId) {
      return new Response(JSON.stringify({ error: "notificationId ou testUserId necessário" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (testUserId && (typeof testUserId !== "string" || !UUID_RE.test(testUserId))) {
      return new Response(JSON.stringify({ error: "testUserId inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (notificationId) {
      if (typeof notificationId !== "string" || !UUID_RE.test(notificationId)) {
        return new Response(JSON.stringify({ error: "notificationId inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      const result = await sendNotificationById(supabase, notificationId)

      return new Response(
        JSON.stringify(result.code >= 400 ? { error: result.error } : { sent: result.sent, errors: result.errors }),
        { status: result.code, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (testUserId) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", testUserId)
        .eq("active", true)

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ error: "Usuário não possui inscrições ativas" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      let sent = 0
      for (const sub of subs) {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "Teste", body: "Notificação de teste do admin", url: "/" })
          )
          sent++
        } catch { /* ignore */ }
      }

      return new Response(JSON.stringify({ sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
  } catch (e) {
    console.error("send-admin-notification error:", e)
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
