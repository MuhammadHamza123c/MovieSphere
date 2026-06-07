import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchMovies, searchAiText, fetchGenres, fetchFavorites, fetchContinueWatching } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import GenreFilter from '../components/GenreFilter'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')

  const q = searchParams.get('q')
  const text = searchParams.get('text')

  useEffect(() => {
    if (q) {
      setLoading(true); Promise.all([searchMovies(q), fetchFavorites(), fetchContinueWatching()])
        .then(([data, favs, cw]) => {
          const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
          const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
          setItems(data.map(item => ({ ...item, _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()), _progress: cwMap.get(String(item.Id || item.id))?.total_seconds > 0 ? cwMap.get(String(item.Id || item.id)).progress_seconds / cwMap.get(String(item.Id || item.id)).total_seconds : 0 })))
          setLoading(false)
        }).catch(() => setLoading(false))
    } else if (text) {
      setLoading(true); Promise.all([searchAiText(text), fetchFavorites(), fetchContinueWatching()])
        .then(([data, favs, cw]) => {
          const cwMap = new Map(cw.map(i => [String(i.media_id), i]))
          const favTitles = new Set(favs.map(f => (f.Title || f.title || '').toLowerCase()))
          setItems(data.map(item => ({ ...item, _isFav: favTitles.has((item.Title || item.title || item.name || '').toLowerCase()), _progress: cwMap.get(String(item.Id || item.id))?.total_seconds > 0 ? cwMap.get(String(item.Id || item.id)).progress_seconds / cwMap.get(String(item.Id || item.id)).total_seconds : 0 })))
          setLoading(false)
        }).catch(() => setLoading(false))
    } else { setItems([]) }
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

  const filtered = items.filter(item => {
    const genreStr = item.Genre || item.genres || ''
    if (selectedGenre && !genreStr.split('|').filter(Boolean).includes(selectedGenre)) return false
    const raw = item.Release_date || item.release_date || item['Starting Date'] || item.first_air_date || ''
    const year = raw.split('-')[0]
    if (yearFrom && year < yearFrom) return false
    if (yearTo && year > yearTo) return false
    return true
  })

  if (!q && !text) return null

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Results for: <span className="text-gray-300 font-medium">&ldquo;{q || text}&rdquo;</span></p>
      {allGenres.length > 1 && (
        <>
          <GenreFilter genres={allGenres.map(g => ({ id: g, name: g }))} selected={selectedGenre} onSelect={setSelectedGenre} />
          <div className="mt-4" />
        </>
      )}
      <div className="flex items-center gap-2 mb-4">
        <input type="number" placeholder="From year" value={yearFrom} onChange={e => setYearFrom(e.target.value)} min="1900" max="2099" className="w-24 px-2.5 py-1.5 bg-[#12142a] border border-gray-700/50 rounded-lg text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all" />
        <span className="text-gray-600 text-xs">to</span>
        <input type="number" placeholder="To year" value={yearTo} onChange={e => setYearTo(e.target.value)} min="1900" max="2099" className="w-24 px-2.5 py-1.5 bg-[#12142a] border border-gray-700/50 rounded-lg text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all" />
        {(yearFrom || yearTo) && (
          <button onClick={() => { setYearFrom(''); setYearTo('') }} className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-0">Clear</button>
        )}
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
        <MovieGrid items={filtered} />
      )}
    </div>
  )
}
