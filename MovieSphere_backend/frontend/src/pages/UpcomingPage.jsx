import { useState, useEffect } from 'react'
import { fetchUpcoming, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'

export default function UpcomingPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchUpcoming('movie', page), fetchUpcoming('tv', page), fetchFavorites(), fetchContinueWatching()]).then(([movies, tv, favs, cw]) => {
      const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
      const merged = []
      const max = Math.max(movies.length, tv.length)
      for (let i = 0; i < max; i++) {
        if (i < movies.length) merged.push(movies[i])
        if (i < tv.length) merged.push(tv[i])
      }
      const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
      const marked = merged.map(item => ({
        ...item, _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()),
        _progress: cwMap.get(String(item.Id || item.id))?.total_seconds > 0 ? cwMap.get(String(item.Id || item.id)).progress_seconds / cwMap.get(String(item.Id || item.id)).total_seconds : 0,
      }))
      setItems(marked)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">Upcoming</h2>
        <p className="text-sm text-gray-500 mt-0.5">New movies & TV shows</p>
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