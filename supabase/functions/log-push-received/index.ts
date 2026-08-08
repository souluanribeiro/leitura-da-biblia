import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { endpoint_tail } = await req.json()
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { error } = await supabase
      .from("push_received_log")
      .insert({ endpoint_tail: String(endpoint_tail || "").slice(-30) })

    if (error) {
      console.log(`[log-push-received] insert error: ${error.message}`)
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }))
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500 })
  }
})
