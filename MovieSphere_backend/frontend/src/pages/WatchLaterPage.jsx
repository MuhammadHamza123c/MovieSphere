import { useState, useEffect } from 'react'
import MovieGrid from '../components/MovieGrid'
import { fetchWatchLater, fetchFavorites, fetchContinueWatching } from '../api/endpoints'

export default function WatchLaterPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchWatchLater(), fetchFavorites(), fetchContinueWatching()]).then(([wlData, favs, cw]) => {
      const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
      const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
      const mapped = wlData.map(item => ({
        ...item,
        Id: item.media_id || item.mediaId,
        Title: item.Title || item.title || item.name || 'Untitled',
        Poster_path: item.Poster_path || item.poster_path || '',
        Release_date: item.Release_date || item['Starting Date'] || item.release_date || '',
        vote_average: item.vote_average || item.Popularity || 0,
        media_type: item.media_type || 'movie',
        _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()),
        _progress: cwMap.get(String(item.media_id || item.mediaId))?.total_seconds > 0 ? cwMap.get(String(item.media_id || item.mediaId)).progress_seconds / cwMap.get(String(item.media_id || item.mediaId)).total_seconds : 0,
      }))
      setItems(mapped)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">Watch Later</h2>
        <p className="text-sm text-gray-500 mt-0.5">Saved for later</p>
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
        <MovieGrid items={items} onFavChange={() => {}} />
      )}
    </div>
  )
}