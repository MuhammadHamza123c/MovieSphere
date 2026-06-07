import { useState, useCallback } from 'react'

const STORAGE_KEY = 'msp_recently_viewed'
const MAX_ITEMS = 20

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState(load)

  const save = useCallback((item) => {
    setItems(prev => {
      const filtered = prev.filter(i => !(i.id === item.id && i.media_type === item.media_type))
      const next = [item, ...filtered].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const refresh = useCallback(() => {
    setItems(load())
  }, [])

  return { recentlyViewed: items, saveRecentlyViewed: save, refreshRecentlyViewed: refresh }
}
