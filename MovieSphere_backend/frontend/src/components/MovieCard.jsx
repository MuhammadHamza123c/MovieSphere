import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { addFavorite, removeFavorite } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'

export default function MovieCard({ item, onFavChange, mediaType: forceMediaType }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isFav, setIsFav] = useState(false)

  const id = item.Id || item.id
  const title = item.Title || item.title || item.name || 'Untitled'
  const poster = item.Poster_path || item.poster_path || ''
  const posterUrl = poster ? (poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w342${poster}`) : ''
  const date = item.Release_date || item['Starting Date'] || item.release_date || ''
  const year = date.split('-')[0]
  const rating = item.Popularity || item.vote_average || 0
  const displayRating = rating ? (typeof rating === 'number' ? rating.toFixed(1) : rating) : ''
  const mediaType = forceMediaType || item.media_type || 'movie'

  useEffect(() => { setIsFav(item._isFav || false) }, [item._isFav])

  const handleFav = async (e) => {
    e.stopPropagation()
    if (!user) return
    try {
      if (isFav) { await removeFavorite(title); setIsFav(false) }
      else { await addFavorite(title); setIsFav(true) }
      onFavChange?.()
    } catch {}
  }

  const handleWatch = (e) => {
    e.stopPropagation()
    navigate(`/watch/${mediaType}/${id}`)
  }

  return (
    <div onClick={() => navigate(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}`)} className="group rounded-xl overflow-hidden bg-[#1a1b32] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/40 border border-transparent hover:border-gray-700/50">
      <div className="relative aspect-[2/3] overflow-hidden bg-[#12142a]">
        {posterUrl ? (
          <img src={posterUrl} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-700">{title[0]}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-end justify-center gap-2.5 pb-4">
          <button onClick={handleFav} className={`w-9 h-9 rounded-full border-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 ${isFav ? 'bg-red-500/20 text-red-500' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-indigo-500'}`} title={isFav ? 'Remove' : 'Favorite'}>
            {isFav ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            )}
          </button>
          <button onClick={handleWatch} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border-0 flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:bg-indigo-500 hover:scale-110" title="Watch">
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <h3 className="text-sm font-semibold text-gray-200 truncate">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{year}{displayRating ? ` · ${displayRating}` : ''}</p>
      </div>
    </div>
  )
}