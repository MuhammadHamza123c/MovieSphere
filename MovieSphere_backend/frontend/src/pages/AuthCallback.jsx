import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { check } = useAuth()
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get('access_token')
    if (token) {
      localStorage.setItem('msp_token', token)
      check(true).then(() => {
        const redirect = sessionStorage.getItem('msp_redirect') || '/home'
        sessionStorage.removeItem('msp_redirect')
        navigate(redirect, { replace: true })
      }).catch(() => {
        setStatus('Sign in failed. Please try again.')
      })
    } else {
      const error = params.get('error_description') || 'Authentication failed'
      setStatus(error)
    }
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
