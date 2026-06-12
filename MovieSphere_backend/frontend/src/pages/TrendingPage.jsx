import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTrending, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'

function SpotlightHero({ item }) {
  const navigate = useNavigate()
  if (!item) return null

  const id = item.Id || item.id
  const title = item.Title || item.title || item.name || 'Untitled'
  const poster = item.Poster_path || item.poster_path || ''
  const backdrop = item.Backdrop_path || item.backdrop_path || ''
  const backdropUrl = backdrop || ''
  const posterUrl = poster ? poster : ''
  const overview = item.Overview || item.overview || ''
  const type = item.media_type || 'movie'
  const genreStr = item.Genre || item.genres || ''
  const genreArr = typeof genreStr === 'string' ? genreStr.split('|').filter(Boolean) : []
  const rating = item.Popularity || item.vote_average || 0

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl bg-[#0f1025] min-h-[480px] md:min-h-[520px] group">
      {backdropUrl && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1025]/95 via-[#0f1025]/70 to-[#0f1025]/95 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1025] via-transparent to-[#0f1025]/30 z-10" />
          <img
            src={`https://image.tmdb.org/t/p/w1280${backdropUrl}`}
            alt=""
            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
          />
        </div>
      )}
      {!backdropUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-[#0f1025] to-purple-900/30" />
      )}
      <div className="relative z-20 flex flex-col md:flex-row items-center gap-8 md:gap-12 p-8 md:p-12 h-full min-h-[480px] md:min-h-[520px]">
        {posterUrl && (
          <div className="flex-shrink-0 w-48 md:w-64 lg:w-72 -mt-4 md:mt-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-2xl blur-xl opacity-60" />
              <img
                src={`https://image.tmdb.org/t/p/w500${posterUrl}`}
                alt={title}
                className="relative w-full rounded-2xl shadow-2xl shadow-black/50 border border-white/5"
              />
            </div>
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Behind MovieSphere
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-3 mb-4 justify-center md:justify-start">
            {genreArr.slice(0, 3).map((g, i) => (
              <span key={i} className="px-3 py-1 bg-white/5 text-gray-300 text-xs font-medium rounded-md border border-white/5">{g}</span>
            ))}
            <span className="flex items-center gap-1 text-sm text-yellow-400 font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              {rating > 0 ? rating.toFixed(1) : 'N/A'}
            </span>
          </div>
          {overview && (
            <p className="text-sm md:text-base text-gray-400 max-w-xl mb-6 line-clamp-2 md:line-clamp-3 leading-relaxed">{overview}</p>
          )}
          <button
            onClick={() => navigate(`/${type === 'tv' ? 'tv' : 'movie'}/${id}`)}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TrendingPage() {
  const [items, setItems] = useState([])
  const [spotlight, setSpotlight] = useState(null)
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
        if (page === 1 && marked.length) setSpotlight(marked[0])
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [page, timeWindow])

  return (
    <div>
      {page === 1 && !loading && <SpotlightHero item={spotlight} />}
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
