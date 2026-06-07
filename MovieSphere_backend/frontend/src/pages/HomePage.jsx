import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHome, fetchGenres, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
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

  useEffect(() => { fetchGenres().then(g => setGenres(g.movie)).catch(() => {}) }, [])

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
