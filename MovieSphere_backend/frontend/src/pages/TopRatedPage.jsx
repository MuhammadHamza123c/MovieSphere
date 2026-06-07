import { useState, useEffect } from 'react'
import { fetchTopRated, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'

export default function TopRatedPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTopRated('movie', 1), fetchTopRated('tv', 1), fetchFavorites(), fetchContinueWatching()])
      .then(([movies, tv, favs, cw]) => {
        const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
        const movieItems = (movies || []).map(item => ({ ...item, media_type: 'movie' }))
        const tvItems = (tv || []).map(item => ({ ...item, media_type: 'tv' }))
        const combined = []
        const maxLen = Math.max(movieItems.length, tvItems.length)
        for (let i = 0; i < maxLen; i++) {
          if (i < movieItems.length) combined.push(movieItems[i])
          if (i < tvItems.length) combined.push(tvItems[i])
        }
        const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
        const marked = combined.map(item => ({
          ...item, _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()),
          _progress: cwMap.get(String(item.Id || item.id))?.total_seconds > 0 ? cwMap.get(String(item.Id || item.id)).progress_seconds / cwMap.get(String(item.Id || item.id)).total_seconds : 0,
        }))
        setItems(marked)
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">Top Rated</h2>
        <p className="text-sm text-gray-500 mt-0.5">Highest-rated movies &amp; TV shows</p>
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
    </div>
  )
}
