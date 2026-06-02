import { createContext, useState, useEffect, useCallback } from 'react'
import { getMe, logout as apiLogout, login as apiLogin } from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async (skipLoading) => {
    try {
      const u = await getMe()
      setUser(u)
    } catch {
      setUser(null)
      localStorage.removeItem('msp_token')
    } finally {
      if (!skipLoading) setLoading(false)
    }
  }, [])

  useEffect(() => { check() }, [check])

  const login = async (email, password) => {
    await apiLogin(email, password)
    await check()
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, check }}>
      {children}
    </AuthContext.Provider>
  )
}
