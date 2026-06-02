import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchMovies, searchAiText, fetchGenres } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import GenreFilter from '../components/GenreFilter'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')

  const q = searchParams.get('q')
  const text = searchParams.get('text')

  useEffect(() => {
    if (q) { setLoading(true); searchMovies(q).then(data => { setItems(data); setLoading(false) }).catch(() => setLoading(false)) }
    else if (text) { setLoading(true); searchAiText(text).then(data => { setItems(data); setLoading(false) }).catch(() => setLoading(false)) }
    else { setItems([]) }
  }, [q, text])

  const allGenres = useMemo(() => {
    const seen = new Set()
    return items.reduce((acc, item) => {
      const genreStr = item.Genre || item.genres || ''
      genreStr.split('|').filter(Boolean).forEach(g => {
        if (!seen.has(g)) { seen.add(g); acc.push(g) }
      })
      return acc
    }, [])
  }, [items])

  const filtered = selectedGenre ? items.filter(item => {
    const genreStr = item.Genre || item.genres || ''
    return genreStr.split('|').includes(selectedGenre)
  }) : items

  if (!q && !text) return null

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Results for: <span className="text-gray-300 font-medium">&ldquo;{q || text}&rdquo;</span></p>
      {allGenres.length > 1 && (
        <GenreFilter genres={allGenres.map(g => ({ id: g, name: g }))} selected={selectedGenre} onSelect={setSelectedGenre} />
      )}
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
        <MovieGrid items={filtered} />
      )}
    </div>
  )
}
