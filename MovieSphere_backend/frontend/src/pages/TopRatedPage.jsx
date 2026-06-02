import { useState, useEffect } from 'react'
import { fetchTopRated } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'

export default function TopRatedPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('movie')

  useEffect(() => {
    setLoading(true)
    fetchTopRated(type, page).then(data => {
      setItems(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page, type])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-100">Top Rated</h2>
          <p className="text-sm text-gray-500 mt-0.5">{type === 'movie' ? 'Highest-rated movies' : 'Highest-rated TV shows'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setType('movie'); setPage(1) }} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${type === 'movie' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-[#1a1b32] text-gray-400 border-gray-700/50 hover:border-gray-600 hover:text-gray-200'}`}>Movies</button>
          <button onClick={() => { setType('tv'); setPage(1) }} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${type === 'tv' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-[#1a1b32] text-gray-400 border-gray-700/50 hover:border-gray-600 hover:text-gray-200'}`}>TV Shows</button>
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
        <MovieGrid items={items} mediaType={type === 'tv' ? 'tv' : undefined} />
      )}
      <Pagination currentPage={page} onPageChange={setPage} />
    </div>
  )
}
