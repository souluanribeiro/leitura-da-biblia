import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webPush from "https://esm.sh/web-push@3.6.7"

const vapidEmail = Deno.env.get("VAPID_EMAIL")!
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!

webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

serve(async (_req) => {
  const now = new Date()
  const brHour = (now.getUTCHours() - 3 + 24) % 24

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("active", true)
    .eq("preferred_hour", brHour)

  if (error || !subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, error: error?.message }))
  }

  let sent = 0
  const errors: string[] = []

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: "Ler a Bíblia",
          body: "Hora da leitura de hoje! Abra o app para continuar.",
          url: "/",
        })
      )
      sent++
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .update({ active: false })
          .eq("id", sub.id)
      } else {
        errors.push(`${sub.id}: ${e.message}`)
      }
    }
  }

  return new Response(JSON.stringify({ sent, errors, hour: brHour }))
})
