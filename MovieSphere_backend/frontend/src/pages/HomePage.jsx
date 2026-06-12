import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHome, fetchGenres, fetchFavorites, fetchContinueWatching, fetchDidYouKnow } from '../api/endpoints'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import MovieGrid from '../components/MovieGrid'
import GenreFilter from '../components/GenreFilter'
import Pagination from '../components/Pagination'

export default function HomePage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const { recentlyViewed } = useRecentlyViewed()
  const [trivia, setTrivia] = useState([])
  const [triviaIndex, setTriviaIndex] = useState(0)

  useEffect(() => { fetchGenres().then(g => setGenres(g.movie)).catch(() => {}) }, [])

  useEffect(() => {
    fetchDidYouKnow().then(facts => setTrivia(facts)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchHome(page, selectedGenre), fetchFavorites(), fetchContinueWatching()])
      .then(([data, favs, cw]) => {
        const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
        const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
        const marked = data.map(item => {
          const cwItem = cwMap.get(String(item.Id || item.id))
          return {
            ...item,
            _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()),
            _progress: cwItem && cwItem.total_seconds > 0 ? cwItem.progress_seconds / cwItem.total_seconds : 0,
          }
        })
        setItems(marked)
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [page, selectedGenre])

  const handleGenreChange = (id) => {
    setSelectedGenre(id)
    setPage(1)
  }

  return (
    <div className="space-y-8">

      <section>
        {trivia.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/10 flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Did You Know?</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{trivia[triviaIndex]}</p>
            </div>
            <button
              onClick={() => setTriviaIndex(i => (i + 1) % trivia.length)}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-[var(--bg-tertiary)] hover:bg-indigo-500/20 text-[var(--text-secondary)] hover:text-indigo-400 transition-all cursor-pointer"
              title="Next fact"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-gray-100">{selectedGenre ? 'Filtered' : 'Now Playing'}</h2>
            <p className="text-sm text-gray-500 mt-1">{selectedGenre ? 'Filtered by genre' : 'Latest movies in theaters'}</p>
          </div>
        </div>
        <GenreFilter genres={genres} selected={selectedGenre} onSelect={handleGenreChange} />
        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-[#12142a] overflow-hidden animate-pulse border border-[#1e2040]">
                  <div className="aspect-[2/3] bg-[#1a1c36]" />
                  <div className="p-3"><div className="h-3 bg-[#1a1c36] rounded w-3/4" /></div>
                </div>
              ))}
            </div>
          ) : (
            <MovieGrid items={items} />
          )}
        </div>
        <div className="mt-8">
          <Pagination currentPage={page} onPageChange={setPage} />
        </div>
      </section>
    </div>
  )
}
