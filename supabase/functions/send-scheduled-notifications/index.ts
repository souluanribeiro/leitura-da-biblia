import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { setupVapid, sendNotificationById } from "../_shared/push.ts"

setupVapid()

const ALLOWED_ORIGINS = ["https://admin-app-two-orcin.vercel.app", "https://leitura-da-biblia.vercel.app", "http://localhost:5173"]

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

  const authHeader = req.headers.get("authorization") || ""
  const apikeyHeader = req.headers.get("apikey") || ""
  const cronSecret = Deno.env.get("CRON_SECRET") || ""

  const isCronCall =
    (cronSecret.length > 0 && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret.length > 0 && apikeyHeader === cronSecret)

  if (!isCronCall) {
    return new Response(JSON.stringify({ error: "Acesso não autorizado" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: due, error } = await supabase
      .from("admin_notifications")
      .select("id")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())

    if (error) {
      console.error("send-scheduled-notifications query error:", error.message)
      return new Response(JSON.stringify({ error: "Erro interno" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const results: Record<string, unknown>[] = []
    for (const notif of due || []) {
      const res = await sendNotificationById(supabase, notif.id)
      results.push({ id: notif.id, ...res })
    }

    console.log(`[send-scheduled-notifications] processed=${results.length} results=${JSON.stringify(results)}`)
    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error("send-scheduled-notifications error:", e)
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
