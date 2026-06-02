import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function TopBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="mb-4 mt-28">
      <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center mb-6 tracking-tight">MovieSphere</h1>
      <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies & shows..."
          className="w-full pl-11 pr-12 py-3 bg-[#12142a]/80 border border-[#1e2040] rounded-xl text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50 focus:bg-[#12142a] focus:shadow-[0_0_20px_-8px_#6366f1] transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </button>
          <button type="button" onClick={() => navigate(`/search?text=${encodeURIComponent(query.trim())}`)} className="w-7 h-7 flex items-center justify-center rounded-md bg-purple-500/20 hover:bg-purple-500/40 transition-all cursor-pointer">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="8" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
            <path d="M12 2v4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 20l-1 2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20l1 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
        <span className="text-[10px] tracking-wider uppercase">AI search:</span>
        <button type="button" onClick={() => { setQuery('a movie about dreams'); navigate('/search?text=a movie about dreams') }} className="px-2.5 py-1 bg-[#1e1f37] border border-[#2a2b4a] rounded-md text-indigo-400 hover:bg-[#2a2b4a] transition-colors cursor-pointer">dreams</button>
        <button type="button" onClick={() => { setQuery('time travel love story'); navigate('/search?text=time travel love story') }} className="px-2.5 py-1 bg-[#1e1f37] border border-[#2a2b4a] rounded-md text-indigo-400 hover:bg-[#2a2b4a] transition-colors cursor-pointer">time travel</button>
      </div>
    </div>
  )
}
