import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addFavorite, removeFavorite } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'

export default function MovieCard({ item, onFavChange, mediaType: forceMediaType }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isFav, setIsFav] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const id = item.Id || item.id
  const title = item.Title || item.title || item.name || 'Untitled'
  const poster = item.Poster_path || item.poster_path || ''
  const posterUrl = poster && !imgFailed ? (poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w400${poster}`) : ''
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
    <div onClick={() => navigate(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}`)}
         className="group relative rounded-xl overflow-hidden bg-[var(--bg-card)] cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/15 border border-[var(--border-primary)] hover:border-indigo-500/30">
      <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-primary)]">
        {posterUrl ? (
          <img src={posterUrl} alt=""
               onError={() => setImgFailed(true)}
               className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button onClick={handleWatch}
                  className="w-12 h-12 rounded-full bg-indigo-500/90 hover:bg-indigo-500 border-0 flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:scale-110 shadow-xl shadow-indigo-500/30">
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button onClick={handleFav}
                  className={`w-10 h-10 rounded-full border-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 backdrop-blur-sm shadow-lg ${isFav ? 'bg-red-500/30 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
            <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        {displayRating && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-bold text-white bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
            {displayRating}
          </div>
        )}
        {year && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-300 bg-black/60 backdrop-blur-sm">
            {year}
          </div>
        )}
        {item._progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(item._progress * 100, 100)}%` }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate leading-snug">{title}</h3>
      </div>
    </div>
  )
}
