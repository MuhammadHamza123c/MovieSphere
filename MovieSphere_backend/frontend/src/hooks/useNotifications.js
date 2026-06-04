import { useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { checkReleasedItems, createNotification } from '../api/endpoints'

const REMINDER_DELAY = 30000
const POLL_INTERVAL = 30000
const STORAGE_KEY = 'wl_notified_releases'

const _timers = {}

function getNotified() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function markNotified(key) {
  const list = getNotified()
  list.push(key)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

async function notify(title, body, icon) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission()
    if (result !== 'granted') return
  } else if (Notification.permission !== 'granted') {
    return
  }
  new Notification(title, { body, icon })
}

function saveToBackend(user, title, body, mediaId, mediaType, posterUrl, type) {
  createNotification({ title, body, media_id: mediaId, media_type: mediaType, poster_url: posterUrl, type }).catch(() => {})
}

export function useNotifications({ poll } = {}) {
  const { user } = useAuth()

  const scheduleReminder = useCallback((mediaId, mediaType, title, posterUrl) => {
    const key = `${mediaId}_${mediaType}`
    if (_timers[key]) clearTimeout(_timers[key])
    _timers[key] = setTimeout(() => {
      notify('Watch Later Reminder', `${title} is still in your Watch Later`, posterUrl)
      if (user) saveToBackend(user, 'Watch Later Reminder', `${title} is still in your Watch Later`, mediaId, mediaType, posterUrl, 'reminder')
      delete _timers[key]
    }, REMINDER_DELAY)
  }, [user])

  const cancelReminder = useCallback((mediaId, mediaType) => {
    const key = `${mediaId}_${mediaType}`
    if (_timers[key]) {
      clearTimeout(_timers[key])
      delete _timers[key]
    }
  }, [])

  useEffect(() => {
    if (!user || !poll) return
    const check = async () => {
      try {
        const releases = await checkReleasedItems()
        const notified = getNotified()
        for (const item of releases) {
          const key = `${item.Id}_${item.media_type}`
          if (!notified.includes(key)) {
            markNotified(key)
            notify('Now Available', `${item.Title} has been released!`, item.Poster_path)
            saveToBackend(user, 'Now Available', `${item.Title} has been released!`, item.Id, item.media_type, item.Poster_path, 'release')
          }
        }
      } catch {}
    }
    check()
    const interval = setInterval(check, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [user, poll])

  return { scheduleReminder, cancelReminder }
}