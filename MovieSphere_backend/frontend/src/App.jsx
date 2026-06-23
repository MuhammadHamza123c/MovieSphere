import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useCredits } from './hooks/useCredits'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ShowsPage from './pages/ShowsPage'
import SearchPage from './pages/SearchPage'
import FavoritesPage from './pages/FavoritesPage'
import RecommendPage from './pages/RecommendPage'
import DetailPage from './pages/DetailPage'
import WatchPage from './pages/WatchPage'
import ActorPage from './pages/ActorPage'
import TopRatedPage from './pages/TopRatedPage'
import UpcomingPage from './pages/UpcomingPage'
import WatchLaterPage from './pages/WatchLaterPage'
import ReelsPage from './pages/ReelsPage'
import TrendingPage from './pages/TrendingPage'
import AuthCallback from './pages/AuthCallback'
import usePushNotifications from './hooks/usePushNotifications'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0b0d17]"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) {
    sessionStorage.setItem('msp_redirect', location.pathname + location.search)
    return <Navigate to="/auth" replace />
  }
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  const { credits } = useCredits()
  usePushNotifications()
  const [blockedModal, setBlockedModal] = useState(false)
  const redirectRef = useRef(null)

  const creditsExhausted = credits && credits.credits_remaining !== null && credits.credits_remaining <= 0

  useEffect(() => {
    const handler = () => setBlockedModal(true)
    window.addEventListener('credits-exhausted', handler)
    return () => window.removeEventListener('credits-exhausted', handler)
  }, [])

  useEffect(() => {
    if (creditsExhausted) setBlockedModal(true)
  }, [creditsExhausted])

  if (!redirectRef.current) {
    redirectRef.current = sessionStorage.getItem('msp_redirect')
    if (redirectRef.current) sessionStorage.removeItem('msp_redirect')
  }
  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0b0d17]"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  const from = redirectRef.current || '/home'
  if (blockedModal) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0b0d17]">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <span className="text-4xl">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-3">Free Streams Used Up</h2>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            You've used all your free streams today. Come back tomorrow when your credits reset!
          </p>
        </div>
      </div>
    )
  }
  return (
    <>
      <Routes>
      <Route path="/auth" element={user ? <Navigate to={from} replace /> : <AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/shows" element={<ShowsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="/movie/:id" element={<DetailPage />} />
        <Route path="/tv/:id" element={<DetailPage />} />
        <Route path="/detail/:type/:id" element={<DetailPage />} />
        <Route path="/watch/:type/:id" element={<WatchPage />} />
        <Route path="/watch/:type/:id/:season/:epi" element={<WatchPage />} />
        <Route path="/actor/:id" element={<ActorPage />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        <Route path="/watch-later" element={<WatchLaterPage />} />
        <Route path="/top-rated" element={<TopRatedPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
    </>
  )
}
