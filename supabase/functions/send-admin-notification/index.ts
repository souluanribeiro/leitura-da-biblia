import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webPush from "https://esm.sh/web-push@3.6.7"

const vapidEmail = Deno.env.get("VAPID_EMAIL")!
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!

webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

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

      const { data: notif, error: notifError } = await supabase
        .from("admin_notifications")
        .select("*")
        .eq("id", notificationId)
        .single()

      if (notifError || !notif) {
        return new Response(JSON.stringify({ error: "Notificação não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      if (notif.status === "sent") {
        return new Response(JSON.stringify({ error: "Notificação já enviada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      if (notif.status === "cancelled") {
        return new Response(JSON.stringify({ error: "Notificação cancelada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      if (notif.status === "sending") {
        return new Response(JSON.stringify({ error: "Notificação já está em envio. Se ficou travada, cancele e recrie." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      // Reivindicação atômica: evita envio duplicado em corrida
      const { data: claimed, error: claimError } = await supabase
        .from("admin_notifications")
        .update({ status: "sending" })
        .eq("id", notificationId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle()

      if (claimError || !claimed) {
        return new Response(JSON.stringify({ error: "Envio já em andamento" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      let query = supabase.from("push_subscriptions").select("*").eq("active", true)
      if (notif.target === "active_readers") {
        const { data: readers } = await supabase
          .from("reading_progress")
          .select("user_id")
          .gte("day_number", 1)
        const userIds = [...new Set(readers?.map(r => r.user_id) || [])]
        if (userIds.length > 0) query = query.in("user_id", userIds)
        else {
          await supabase.from("admin_notifications").update({ status: "sent", sent_at: new Date().toISOString(), sent_count: 0 }).eq("id", notificationId).eq("status", "sending")
          return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
        }
      } else if (notif.target === "inactive_readers") {
        const since = new Date(Date.now() - 7 * 86400000).toISOString()
        const { data: subsAll } = await supabase
          .from("push_subscriptions")
          .select("user_id")
          .eq("active", true)
        const subscribedIds = [...new Set(subsAll?.map(r => r.user_id) || [])]
        if (subscribedIds.length > 0) {
          const { data: recentRows } = await supabase
            .from("reading_progress")
            .select("user_id")
            .gte("completed_at", since)
          const recentIds = new Set(recentRows?.map(r => r.user_id) || [])
          const inactiveIds = subscribedIds.filter(id => !recentIds.has(id))
          if (inactiveIds.length > 0) query = query.in("user_id", inactiveIds)
          else {
            await supabase.from("admin_notifications").update({ status: "sent", sent_at: new Date().toISOString(), sent_count: 0 }).eq("id", notificationId).eq("status", "sending")
            return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
          }
        }
      }

      const { data: subs, error: subsError } = await query

      if (subsError || !subs) {
        await supabase.from("admin_notifications").update({ status: "pending" }).eq("id", notificationId).eq("status", "sending")
        return new Response(JSON.stringify({ error: "Falha ao buscar inscrições" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      if (subs.length === 0) {
        await supabase.from("admin_notifications").update({ status: "sent", sent_at: new Date().toISOString(), sent_count: 0 }).eq("id", notificationId).eq("status", "sending")
        return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      let sent = 0
      let errors = 0

      for (const sub of subs) {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: notif.title,
              body: notif.message,
              url: "/",
            })
          )
          sent++
        } catch (e: any) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await supabase.from("push_subscriptions").update({ active: false }).eq("id", sub.id)
          }
          errors++
        }
      }

      await supabase
        .from("admin_notifications")
        .update({ status: "sent", sent_at: new Date().toISOString(), sent_count: sent, error_count: errors })
        .eq("id", notificationId)
        .eq("status", "sending")

      return new Response(JSON.stringify({ sent, errors }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
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
