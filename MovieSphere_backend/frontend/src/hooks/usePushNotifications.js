import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { subscribePush, unsubscribePush } from '../api/endpoints'

const VAPID_PUBLIC_KEY = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEnZE6Des0UY8XAM0hzygU2ye7_YcZ7bn1-sIMsbkcy2X27PyybXh0-G9HenveQUd_WcpXm_pc_41tfcSmP_vKPQ'

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
          subRef.current = sub
          endpointRef.current = sub.toJSON().endpoint
          return
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
      } catch {
        // silently fail - user may have denied permission
      }
    }

    init()
  }, [user])
}
