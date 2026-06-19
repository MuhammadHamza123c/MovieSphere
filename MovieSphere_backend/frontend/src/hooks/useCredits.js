import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useLocation } from 'react-router-dom'
import { fetchCredits } from '../api/endpoints'

export function useCredits() {
  const { user } = useAuth()
  const location = useLocation()
  const [credits, setCredits] = useState(null)

  useEffect(() => {
    if (!user) {
      setCredits(null)
      return
    }
    fetchCredits().then(setCredits).catch(() => {})
  }, [user, location.pathname])

  return { credits }
}
