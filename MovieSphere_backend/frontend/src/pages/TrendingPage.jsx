import { useState, useEffect } from 'react'
import { fetchTrending, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'

export default function TrendingPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [timeWindow, setTimeWindow] = useState('day')

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTrending(timeWindow, page), fetchFavorites(), fetchContinueWatching()])
      .then(([trending, favs, cw]) => {
        const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
        const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
        const marked = (trending || []).map(item => ({
          ...item,
          _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()),
          _progress: cwMap.get(String(item.Id || item.id))?.total_seconds > 0
            ? cwMap.get(String(item.Id || item.id)).progress_seconds / cwMap.get(String(item.Id || item.id)).total_seconds
            : 0,
        }))
        setItems(marked)
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [page, timeWindow])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-100">Trending</h2>
          <p className="text-sm text-gray-500 mt-0.5">What's popular right now</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTimeWindow('day'); setPage(1) }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              timeWindow === 'day'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-indigo-500/10'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => { setTimeWindow('week'); setPage(1) }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              timeWindow === 'week'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-indigo-500/10'
            }`}
          >
            This Week
          </button>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#1a1b32] overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-[#1e2040]" />
              <div className="p-3 space-y-2"><div className="h-3 bg-[#1e2040] rounded w-3/4" /><div className="h-2 bg-[#1e2040] rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : (
        <MovieGrid items={items} />
      )}
      <Pagination currentPage={page} onPageChange={setPage} />
    </div>
  )
}
