import { useState, useEffect } from 'react'
import { fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'

export default function FavoritesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([fetchFavorites(), fetchContinueWatching()]).then(([data, cw]) => {
      const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
      setItems(data.map(i => ({ ...i, _isFav: true, _progress: cwMap.get(String(i.Id || i.id))?.total_seconds > 0 ? cwMap.get(String(i.Id || i.id)).progress_seconds / cwMap.get(String(i.Id || i.id)).total_seconds : 0 })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">Your Favorites</h2>
        <p className="text-sm text-gray-500 mt-0.5">Movies and shows you have saved</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#1a1b32] overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-[#1e2040]" />
              <div className="p-3 space-y-2"><div className="h-3 bg-[#1e2040] rounded w-3/4" /><div className="h-2 bg-[#1e2040] rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : (
        <MovieGrid items={items} onFavChange={load} />
      )}
    </div>
  )
}
