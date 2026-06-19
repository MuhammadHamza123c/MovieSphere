import client from './client'

function storeToken(data) {
  const token = data?.session?.access_token
  const refresh = data?.session?.refresh_token
  if (token) localStorage.setItem('msp_token', token)
  if (refresh) localStorage.setItem('msp_refresh', refresh)
  return data
}

function clearToken() {
  localStorage.removeItem('msp_token')
  localStorage.removeItem('msp_refresh')
}

export async function signup(email, password, username) {
  const { data } = await client.post('/auth/signup', { email, password, username })
  return storeToken(data)
}

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password })
  return storeToken(data)
}

export async function logout() {
  try { await client.post('/auth/logout') } catch {}
  clearToken()
}

export async function getMe() {
  const { data } = await client.get('/auth/me')
  return data.user
}