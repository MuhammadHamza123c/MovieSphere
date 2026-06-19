import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem('msp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

function processQueue(newToken, err) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (err) return reject(err)
    resolve(newToken)
  })
  failedQueue = []
}

client.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (error.response?.status === 402) {
      window.dispatchEvent(new CustomEvent('credits-exhausted'))
      return Promise.resolve({ data: { MovieSphere: [] } })
    }
    if (error.response?.status !== 401 || originalRequest._retry) return Promise.reject(error)
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(newToken => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      })
    }
    originalRequest._retry = true
    isRefreshing = true
    try {
      const refreshToken = localStorage.getItem('msp_refresh')
      if (!refreshToken) throw new Error('No refresh token')
      const baseURL = client.defaults.baseURL || ''
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
      const newToken = data.session.access_token
      const newRefresh = data.session.refresh_token
      localStorage.setItem('msp_token', newToken)
      localStorage.setItem('msp_refresh', newRefresh)
      processQueue(newToken, null)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return client(originalRequest)
    } catch (refreshError) {
      processQueue(null, refreshError)
      localStorage.removeItem('msp_token')
      localStorage.removeItem('msp_refresh')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
