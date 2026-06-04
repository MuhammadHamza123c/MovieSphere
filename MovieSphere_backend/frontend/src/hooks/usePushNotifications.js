import { useEffect } from "react"
import { useAuth } from "./useAuth"

const VAPID_PUBLIC_KEY = "BFtESyTiSk18sATRJSISJBSlS_9np8uPbKBaZJRWaLEjEmiyx7rXY470Hj4JOwCFMwuRp5UsjnA6uifNOaew3A8"

async function subscribeUser(registration) {
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY,
  })
  return sub.toJSON()
}

async function sendSubscription(subscription) {
  const token = localStorage.getItem("supabase_token")
  await fetch("/MovieSphere/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(subscription),
  })
}

async function sendUnsubscription(subscription) {
  const token = localStorage.getItem("supabase_token")
  await fetch("/MovieSphere/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
}

export function usePushNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window)) return

    let currentSub = null
    let subscribed = false

    async function init() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        const existing = await reg.pushManager.getSubscription()
        if (!existing) {
          const sub = await subscribeUser(reg)
          await sendSubscription(sub)
          currentSub = sub
          subscribed = true
        } else {
          currentSub = existing.toJSON()
          subscribed = true
        }
      } catch {
        // push not supported or permission denied
      }
    }

    init()

    return () => {
      if (currentSub && subscribed) {
        sendUnsubscription(currentSub).catch(() => {})
      }
    }
  }, [user?.id])
}
