import webPush from "https://esm.sh/web-push@3.6.7"

export function setupVapid() {
  const vapidEmail = Deno.env.get("VAPID_EMAIL")!
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

export interface NotifyResult {
  sent: number
  errors: number
  code: number
  error?: string
}

async function markDone(supabase: any, notificationId: string, sent: number, errors: number) {
  await supabase
    .from("admin_notifications")
    .update({ status: "sent", sent_at: new Date().toISOString(), sent_count: sent, error_count: errors })
    .eq("id", notificationId)
    .eq("status", "sending")
}

export async function sendNotificationById(supabase: any, notificationId: string): Promise<NotifyResult> {
  const { data: notif, error: notifError } = await supabase
    .from("admin_notifications")
    .select("*")
    .eq("id", notificationId)
    .single()

  if (notifError || !notif) return { sent: 0, errors: 0, code: 404, error: "Notificação não encontrada" }
  if (notif.status === "sent") return { sent: 0, errors: 0, code: 400, error: "Notificação já enviada" }
  if (notif.status === "cancelled") return { sent: 0, errors: 0, code: 400, error: "Notificação cancelada" }
  if (notif.status === "sending") return { sent: 0, errors: 0, code: 409, error: "Notificação já está em envio. Se ficou travada, cancele e recrie." }

  // Reivindicação atômica: evita envio duplicado em corrida
  const { data: claimed, error: claimError } = await supabase
    .from("admin_notifications")
    .update({ status: "sending" })
    .eq("id", notificationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (claimError || !claimed) return { sent: 0, errors: 0, code: 409, error: "Envio já em andamento" }

  let query = supabase.from("push_subscriptions").select("*").eq("active", true)
  if (notif.target === "active_readers") {
    const { data: readers } = await supabase
      .from("reading_progress")
      .select("user_id")
      .gte("day_number", 1)
    const userIds = [...new Set(readers?.map((r: any) => r.user_id) || [])]
    if (userIds.length > 0) query = query.in("user_id", userIds)
    else {
      await markDone(supabase, notificationId, 0, 0)
      return { sent: 0, errors: 0, code: 200 }
    }
  } else if (notif.target === "inactive_readers") {
    const since = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: subsAll } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .eq("active", true)
    const subscribedIds = [...new Set(subsAll?.map((r: any) => r.user_id) || [])]
    if (subscribedIds.length > 0) {
      const { data: recentRows } = await supabase
        .from("reading_progress")
        .select("user_id")
        .gte("completed_at", since)
      const recentIds = new Set(recentRows?.map((r: any) => r.user_id) || [])
      const inactiveIds = subscribedIds.filter((id: string) => !recentIds.has(id))
      if (inactiveIds.length > 0) query = query.in("user_id", inactiveIds)
      else {
        await markDone(supabase, notificationId, 0, 0)
        return { sent: 0, errors: 0, code: 200 }
      }
    }
  }

  const { data: subs, error: subsError } = await query

  if (subsError || !subs) {
    await supabase.from("admin_notifications").update({ status: "pending" }).eq("id", notificationId).eq("status", "sending")
    return { sent: 0, errors: 0, code: 500, error: "Falha ao buscar inscrições" }
  }

  if (subs.length === 0) {
    await markDone(supabase, notificationId, 0, 0)
    return { sent: 0, errors: 0, code: 200 }
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

  await markDone(supabase, notificationId, sent, errors)
  return { sent, errors, code: 200 }
}
