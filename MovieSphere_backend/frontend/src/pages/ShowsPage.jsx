import { useState, useEffect } from 'react'
import { fetchShows, fetchGenres } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import GenreFilter from '../components/GenreFilter'
import Pagination from '../components/Pagination'

export default function ShowsPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')

  useEffect(() => { fetchGenres().then(g => setGenres(g.tv)).catch(() => {}) }, [])

  useEffect(() => {
    setLoading(true)
    fetchShows(page, selectedGenre).then(data => {
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
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">TV Shows</h2>
        <p className="text-sm text-gray-500 mt-0.5">{selectedGenre ? 'Filtered by genre' : 'Popular series right now'}</p>
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
        <MovieGrid items={items} mediaType="tv" />
      )}
      <Pagination currentPage={page} onPageChange={setPage} />
    </div>
  )
}
