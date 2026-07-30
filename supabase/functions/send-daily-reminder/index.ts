import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webPush from "https://esm.sh/web-push@3.6.7"

const vapidEmail = Deno.env.get("VAPID_EMAIL")!
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!

webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

function getHourInTimezone(timezone: string): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: timezone,
  })
  return parseInt(formatter.format(now), 10)
}

function getDateInTimezone(timezone: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  })
  return formatter.format(now)
}

const motivationalMessages = [
  "Continue firme na jornada!",
  "Cada dia é uma nova oportunidade de crescer espiritualmente.",
  "A Palavra de Deus é uma lâmpada para os seus passos.",
  "Não desista! Cada página é um passo na fé.",
  "Jeová está orgulhoso do seu compromisso!",
  "A leitura diária fortalece sua fé.",
  "Continue lendo, você está no caminho certo!",
]

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("active", true)

  if (error || !subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, error: error?.message }))
  }

  const nowUtc = new Date()
  let sent = 0
  const errors: string[] = []
  const timezoneStats: Record<string, number> = {}

  for (const sub of subs) {
    try {
      const tz = sub.timezone || "America/Sao_Paulo"
      const currentHour = getHourInTimezone(tz)

      if (currentHour !== sub.preferred_hour) continue

      timezoneStats[tz] = (timezoneStats[tz] || 0) + 1

      const { data: profile } = await supabase
        .from("profiles")
        .select("reading_start_date")
        .eq("id", sub.user_id)
        .single()

      let dayNumber = 0
      let streak = 0

      if (profile?.reading_start_date) {
        const todayStr = getDateInTimezone(tz)
        const today = new Date(todayStr)
        today.setHours(0, 0, 0, 0)
        const start = new Date(profile.reading_start_date)
        start.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000)
        dayNumber = diffDays + 1

        const { data: progress } = await supabase
          .from("reading_progress")
          .select("day_number")
          .eq("user_id", sub.user_id)

        if (progress) {
          const completedDays = progress.map(p => p.day_number)
          const sorted = [...new Set(completedDays)].sort((a, b) => b - a)
          let tempStreak = 0
          for (let i = 0; i < sorted.length; i++) {
            if (i === 0) {
              if (sorted[i] === dayNumber || sorted[i] === dayNumber - 1) tempStreak = 1
              else break
            } else {
              if (sorted[i] === sorted[i - 1] - 1) tempStreak++
              else break
            }
          }
          streak = tempStreak
        }
      }

      let title = "Leitura da Bíblia"
      let body = ""

      if (dayNumber > 0 && dayNumber <= 366) {
        body = `Dia ${dayNumber} de 366`
        if (streak > 0) {
          body += ` | 🔥 ${streak} dias seguidos`
        }
        body += ` — Abra o app para continuar!`
      } else {
        const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
        body = msg
      }

      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title,
          body,
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
        errors.push(`Failed to send: ${e.statusCode || 'unknown'}`)
      }
    }
  }

  return new Response(JSON.stringify({ sent, errors, timezones: timezoneStats }))
})
