import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { subscribePush, unsubscribePush } from '../api/endpoints'

const VAPID_PUBLIC_KEY = 'BA54yZO-Ba4663OHp4SwjWzo165mOg4iE2rJba6A61yB9IjvujLZNtIWQVIr5GHzq233XlRZmDrPlXuihpQt6Zk'

export default function usePushNotifications() {
  const { user } = useAuth()
  const subRef = useRef(null)
  const endpointRef = useRef(null)

  useEffect(() => {
    if (!user) {
      if (endpointRef.current) {
        unsubscribePush(endpointRef.current).catch(() => {})
        endpointRef.current = null
      }
      if (subRef.current) {
        subRef.current.unsubscribe().catch(() => {})
        subRef.current = null
      }
      return
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function init() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') return
        }

        if (Notification.permission !== 'granted') return

        let sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        })
        subRef.current = sub

        const json = sub.toJSON()
        endpointRef.current = json.endpoint
        await subscribePush({
          endpoint: json.endpoint,
          p256dh_key: json.keys.p256dh,
          auth_key: json.keys.auth,
        })
      } catch (err) {
        console.error('[PushNotification]', err)
      }
    }

    init()
  }, [user])
}
