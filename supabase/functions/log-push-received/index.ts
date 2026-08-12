import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGINS = ["https://leitura-da-biblia.vercel.app", "http://localhost:5173"]

function getCorsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "") ? origin : null
  return {
    "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ ok: false, error: "Origin não permitida" }), { status: 403, headers: corsHeaders })
  }

  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado" }), { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado" }), { status: 401, headers: corsHeaders })
  }

  try {
    const { endpoint_tail } = await req.json()
    const { error } = await supabase
      .from("push_received_log")
      .insert({ endpoint_tail: String(endpoint_tail || "").slice(-30), user_id: user.id })

    if (error) {
      console.log(`[log-push-received] insert error: ${error.message}`)
      return new Response(JSON.stringify({ ok: false, error: "Erro interno" }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: "Erro interno" }), { status: 500, headers: corsHeaders })
  }
})