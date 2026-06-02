import { useNavigate } from 'react-router-dom'

export default function HeroSection({ item, type = 'movie' }) {
  const navigate = useNavigate()

  if (!item) return null

  const id = item.Id || item.id
  const title = item.Title || item.title || item.name || 'Untitled'
  const backdrop = item.Backdrop_path || item.backdrop_path || ''
  const poster = item.Poster_path || item.poster_path || ''
  const backdropUrl = backdrop ? `https://image.tmdb.org/t/p/w1280${backdrop}` : ''
  const posterUrl = poster ? `https://image.tmdb.org/t/p/original${poster}` : ''
  const overview = item.Overview || item.overview || ''
  const genres = item.Genre || item.genres || ''
  const genreArr = typeof genres === 'string' ? genres.split('|').filter(Boolean) : (Array.isArray(genres) ? genres.map(g => g.name || g) : [])

  return (
    <div className="relative flex items-center min-h-[650px] overflow-hidden mb-7 -mx-6" style={backdropUrl ? { backgroundImage: `url(${backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
      {!backdropUrl && <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d17]/95 via-[#0b0d17]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d17]/80 via-transparent to-[#0b0d17]/20" />
      <div className="relative z-10 flex items-center gap-12 p-10 md:p-16 w-full max-w-7xl mx-auto">
        {posterUrl && (
          <div className="flex-shrink-0 w-80 md:w-[500px] lg:w-[600px]">
            <img src={posterUrl} alt={title} className="w-full rounded-2xl shadow-2xl shadow-black/60 border border-gray-700/20" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            {genreArr.slice(0, 2).map((g, i) => (
              <span key={i} className="px-3 py-1 bg-indigo-500/15 text-indigo-300 text-xs font-semibold rounded-md">{g}</span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-wide">{title}</h1>
          <p className="text-sm md:text-base text-gray-300 max-w-xl mb-6 line-clamp-2">{overview}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${id}`)} className="flex items-center gap-2 px-7 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              {type === 'tv' ? 'Watch Series' : 'Watch Movie'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}