import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchMovies, searchAiText } from '../../api/endpoints'
import { useDebounce } from '../../hooks/useDebounce'
import { useTheme } from '../../context/ThemeContext'

export default function TopBar({ trendingPoster }) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSuggestions([]); setShowDropdown(false); return }
    let mounted = true
    setLoading(true)
    searchMovies(debouncedQuery.trim()).then(data => {
      if (!mounted) return
      setSuggestions(data)
      setShowDropdown(data.length > 0)
      setActiveIndex(-1)
      setLoading(false)
    }).catch(() => { if (mounted) { setLoading(false) } })
    return () => { mounted = false }
  }, [debouncedQuery])

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowDropdown(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const selectSuggestion = useCallback((item) => {
    setShowDropdown(false)
    setQuery('')
    const type = item.media_type === 'tv' ? 'tv' : 'movie'
    navigate(`/${type}/${item.Id}`)
  }, [navigate])

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    }
  }

  const getYear = (item) => {
    const d = item.Release_date || item.release_date
    return d ? d.split('-')[0] : ''
  }

  return (
    <div className="mb-4 mt-16 md:mt-28" ref={containerRef}>
      <div className="relative mb-4 md:mb-6">
        {trendingPoster && (
          <div className="absolute inset-0 -top-8 -bottom-8 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)] z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)] z-10" />
            <div
              className="w-full h-full bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${trendingPoster})` }}
            />
          </div>
        )}
        <h1 className="relative z-20 text-3xl sm:text-5xl md:text-7xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center tracking-tight">MovieSphere</h1>
      </div>
      <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length && debouncedQuery.trim()) setShowDropdown(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search movies & shows..."
          className="w-full pl-11 pr-12 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-indigo-500/50 focus:bg-[var(--bg-input)] focus:shadow-[0_0_20px_-8px_#6366f1] transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </button>
          <button type="button" onClick={() => { if (query.trim()) { setShowDropdown(false); navigate(`/search?text=${encodeURIComponent(query.trim())}`) } }} className="w-7 h-7 flex items-center justify-center rounded-md bg-purple-500/20 hover:bg-purple-500/40 transition-all cursor-pointer">
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

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-2xl shadow-[var(--shadow-color)] z-50">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--text-muted)]">Searching...</span>
              </div>
            )}
            {!loading && suggestions.map((item, i) => {
              const year = getYear(item)
              const poster = item.Poster_path || item.poster_path
              return (
                <button
                  key={item.Id || item.id}
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    i === activeIndex ? 'bg-indigo-500/15' : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                  style={{ borderTop: i > 0 ? '1px solid var(--border-primary)' : 'none' }}
                >
                  <div className="w-9 h-[54px] rounded-md overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0">
                    {poster ? (
                      <img src={poster} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.Title || item.title || item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border text-indigo-300 border-indigo-500/30 bg-indigo-500/10">
                        {item.media_type === 'tv' ? 'TV' : 'Movie'}
                      </span>
                      {year && <span className="text-xs text-[var(--text-muted)]">{year}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </form>
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[var(--text-muted)]">
        <span className="text-[10px] tracking-wider uppercase">AI search:</span>
        <button type="button" onClick={() => { setQuery('a movie about dreams'); navigate('/search?text=a movie about dreams') }} className="px-2.5 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-md text-indigo-400 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">dreams</button>
        <button type="button" onClick={() => { setQuery('time travel love story'); navigate('/search?text=time travel love story') }} className="px-2.5 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-md text-indigo-400 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">time travel</button>
      </div>
    </div>
  )
}
