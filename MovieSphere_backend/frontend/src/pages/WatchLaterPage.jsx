import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWatchLater, removeWatchLater } from '../api/endpoints'

export default function WatchLaterPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchWatchLater().then(data => {
      setItems(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (e, mediaId, mediaType) => {
    e.stopPropagation()
    try {
      await removeWatchLater(mediaId, mediaType)
      load()
    } catch {}
  }

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
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No items saved yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {items.map(item => {
            const id = item.Id || item.id
            const title = item.Title || item.title || item.name || 'Untitled'
            const poster = item.Poster_path || item.poster_path || ''
            const posterUrl = poster ? (poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w342${poster}`) : ''
            const date = item.Release_date || item['Starting Date'] || item.release_date || ''
            const year = date.split('-')[0]
            const rating = item.Popularity || item.vote_average || 0
            const displayRating = rating ? (typeof rating === 'number' ? rating.toFixed(1) : rating) : ''
            const mediaType = item.media_type || 'movie'
            const addedDate = item.added_at ? new Date(item.added_at).toLocaleDateString() : null
            return (
              <div key={id || title} onClick={() => navigate(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}`)} className="group rounded-xl overflow-hidden bg-[#1a1b32] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/40 border border-transparent hover:border-gray-700/50">
                <div className="relative aspect-[2/3] overflow-hidden bg-[#12142a]">
                  {posterUrl ? (
                    <img src={posterUrl} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-700">{title[0]}</div>
                  )}
                  <button onClick={(e) => handleRemove(e, id, mediaType)} className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-all cursor-pointer border-0 shadow-lg">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-end justify-center gap-2.5 pb-4">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/watch/${mediaType}/${id}`) }} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-0 flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:bg-indigo-500 hover:scale-110" title="Watch">
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <h3 className="text-sm font-semibold text-gray-200 truncate">{title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{year}{displayRating ? ` · ${displayRating}` : ''}</p>
                  {addedDate && <p className="text-[10px] text-gray-600 mt-0.5">Added {addedDate}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}