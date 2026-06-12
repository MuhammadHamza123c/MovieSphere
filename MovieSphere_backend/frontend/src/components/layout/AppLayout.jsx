import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { fetchTrending } from '../../api/endpoints'

export default function AppLayout() {
  const { pathname } = useLocation()
  const showSearch = pathname === '/home' || pathname === '/shows' || pathname.startsWith('/search')
  const [trendingPoster, setTrendingPoster] = useState(null)

  useEffect(() => {
    if (pathname === '/home') {
      fetchTrending('day', 1).then(data => {
        if (data?.length) {
          const poster = data[0].Poster_path || data[0].poster_path
          if (poster) setTrendingPoster(`https://image.tmdb.org/t/p/w500${poster}`)
        }
      }).catch(() => {})
    }
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pb-12 overflow-x-hidden min-w-0 pt-14 md:pt-6">
        {showSearch && <TopBar trendingPoster={trendingPoster} />}
        <Outlet />
      </main>
    </div>
  )
}
