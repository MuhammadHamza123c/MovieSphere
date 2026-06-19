import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { fetchCredits } from '../api/endpoints'

export function useCredits() {
  const { user } = useAuth()
  const [credits, setCredits] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState(null)

  useEffect(() => {
    if (!user) {
      setCredits(null)
      setBlocked(false)
      setBlockedInfo(null)
      return
    }

    const load = async () => {
      try {
        const data = await fetchCredits()
        setCredits(data)
      } catch {}
    }
    load()

    const handle = (e) => {
      setBlocked(true)
      setBlockedInfo(e.detail)
    }
    window.addEventListener('credits-exhausted', handle)
    return () => window.removeEventListener('credits-exhausted', handle)
  }, [user])

  const dismissBlocked = useCallback(() => {
    setBlocked(false)
  }, [])

  return { credits, blocked, blockedInfo, dismissBlocked }
}
