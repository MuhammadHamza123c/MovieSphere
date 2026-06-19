import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useLocation } from 'react-router-dom'
import { fetchCredits } from '../api/endpoints'

export function useCredits() {
  const { user } = useAuth()
  const location = useLocation()
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
    fetchCredits().then(setCredits).catch(() => {})
  }, [user, location.pathname])

  useEffect(() => {
    const handle = (e) => {
      setBlocked(true)
      setBlockedInfo(e.detail)
    }
    window.addEventListener('credits-exhausted', handle)
    return () => window.removeEventListener('credits-exhausted', handle)
  }, [])

  const dismissBlocked = useCallback(() => {
    setBlocked(false)
  }, [])

  return { credits, blocked, blockedInfo, dismissBlocked }
}
