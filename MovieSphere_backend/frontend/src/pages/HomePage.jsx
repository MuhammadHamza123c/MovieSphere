import { useState, useEffect } from 'react'
import { fetchHome, fetchGenres, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import GenreFilter from '../components/GenreFilter'
import Pagination from '../components/Pagination'
import ContinueWatchingCard from '../components/ContinueWatchingCard'

export default function HomePage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [continueWatching, setContinueWatching] = useState([])

  useEffect(() => { fetchGenres().then(g => setGenres(g.movie)).catch(() => {}) }, [])

  useEffect(() => {
    fetchContinueWatching().then(setContinueWatching).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchHome(page, selectedGenre).then(data => {
      setItems(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page, selectedGenre])

  const handleGenreChange = (id) => {
    setSelectedGenre(id)
    setPage(1)
  }

  return (
    <div>
      {continueWatching.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-gray-100">Continue Watching</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pick up where you left off</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {continueWatching.map((item, i) => (
              <ContinueWatchingCard key={`${item.media_id}-${item.season ?? 0}-${item.episode ?? 0}-${i}`} item={item} />
            ))}
          </div>
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">Movies</h2>
        <p className="text-sm text-gray-500 mt-0.5">{selectedGenre ? 'Filtered by genre' : 'Latest movies in theaters'}</p>
      </div>
      <GenreFilter genres={genres} selected={selectedGenre} onSelect={handleGenreChange} />
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
