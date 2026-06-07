import { useState, useEffect } from 'react'
import { fetchHistoryRecs, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'

export default function RecommendPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchHistoryRecs(), fetchFavorites(), fetchContinueWatching()])
      .then(([data, favs, cw]) => {
        const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
        const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
        const marked = (data || []).map(item => ({
          ...item,
          _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()),
          _progress: cwMap.get(String(item.Id || item.id))?.total_seconds > 0 ? cwMap.get(String(item.Id || item.id)).progress_seconds / cwMap.get(String(item.Id || item.id)).total_seconds : 0,
        }))
        setHistory(marked)
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <h3 className="text-base font-bold text-gray-200 mb-4">Because You Watched</h3>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#1a1b32] overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-[#1e2040]" />
              <div className="p-3 space-y-2"><div className="h-3 bg-[#1e2040] rounded w-3/4" /><div className="h-2 bg-[#1e2040] rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : (
        <MovieGrid items={history} />
      )}
    </div>
  )
}
