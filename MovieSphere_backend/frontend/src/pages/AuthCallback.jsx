import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createClient } from '@supabase/supabase-js'
import client from '../api/client'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { check } = useAuth()
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: config } = await client.get('/auth/google/config')
        const supabase = createClient(config.url, config.anon_key)
        const { data, error } = await supabase.auth.getSession()
        if (cancelled) return
        if (error || !data.session) {
          setStatus(error?.message || 'No session found')
          return
        }
        localStorage.setItem('msp_token', data.session.access_token)
        await check(true)
        if (!cancelled) {
          const redirect = sessionStorage.getItem('msp_redirect') || '/home'
          sessionStorage.removeItem('msp_redirect')
          navigate(redirect, { replace: true })
        }
      } catch (e) {
        if (!cancelled) setStatus('Authentication failed: ' + (e.message || 'unknown error'))
      }
    })()
    return () => { cancelled = true }
  }, [navigate, check])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">{status}</p>
      </div>
    </div>
  )
}
