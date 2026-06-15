import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { signup as apiSignup } from '../api/auth'
import { createClient } from '@supabase/supabase-js'
import client from '../api/client'

async function signInWithGoogle() {
  try {
    const { data: config } = await client.get('/auth/google/config')
    const supabase = createClient(config.url, config.anon_key)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://movie-sphere-sigma.vercel.app/auth/callback'
      }
    })
  } catch (e) {
    console.error('Google sign-in failed', e)
  }
}

export default function AuthPage() {
  const { login, check } = useAuth()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        const d = await apiSignup(email, password, username)
        if (d?.session?.access_token) {
          await check(true)
        } else {
          setError('Check your email to confirm!')
          setLoading(false)
          return
        }
      } else {
        await login(email, password)
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(120,119,198,0.05)_0%,_transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent tracking-tight">MovieSphere</h1>
          <p className="text-[10px] tracking-[4px] text-gray-600 mt-2 uppercase">Your Cinema Universe</p>
        </div>
        <div className="bg-[#12142a]/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/50 shadow-2xl shadow-black/40">
          <div className="flex mb-7 bg-[#0b0d17]/60 rounded-xl p-1 border border-gray-800/30">
            <button type="button" onClick={() => { setIsSignup(false); setError('') }} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${!isSignup ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}>Sign In</button>
            <button type="button" onClick={() => { setIsSignup(true); setError('') }} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${isSignup ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}>Sign Up</button>
          </div>
          {error && <div className={`text-sm text-center mb-5 p-3 rounded-xl ${error.includes('Check') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-[11px] tracking-wider text-gray-500 mb-1.5 font-semibold uppercase">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your display name" required className="w-full px-4 py-3 bg-[#0b0d17]/60 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_-5px_#6366f1] transition-all" />
              </div>
            )}
            <div>
              <label className="block text-[11px] tracking-wider text-gray-500 mb-1.5 font-semibold uppercase">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required className="w-full px-4 py-3 bg-[#0b0d17]/60 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_-5px_#6366f1] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] tracking-wider text-gray-500 mb-1.5 font-semibold uppercase">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignup ? 'Create a strong password' : 'Enter your password'} required minLength={isSignup ? 6 : undefined} className="w-full px-4 py-3 pr-12 bg-[#0b0d17]/60 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_-5px_#6366f1] transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20">
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800/60" /></div>
            <div className="relative flex justify-center"><span className="px-3 text-[11px] text-gray-600 bg-[#12142a]/60 font-semibold uppercase tracking-wider">or continue with</span></div>
          </div>
          <button type="button" onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 text-gray-800 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-black/10 border border-gray-700/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}
