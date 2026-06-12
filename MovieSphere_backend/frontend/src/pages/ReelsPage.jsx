import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchReels } from '../api/endpoints'

export default function ReelsPage() {
  const [reels, setReels] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(new Set())
  const containerRef = useRef(null)
  const touchStartRef = useRef(null)
  const loadedPages = useRef(new Set())
  const currentPageRef = useRef(1)
  const navigate = useNavigate()

  const loadReels = useCallback(async (page) => {
    if (loadedPages.current.has(page)) return
    loadedPages.current.add(page)
    try {
      const data = await fetchReels(page)
      setReels(prev => [...prev, ...data])
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    loadReels(1).then(() => setLoading(false))
  }, [loadReels])

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(index, reels.length - 1))
    setCurrentIndex(clamped)
    if (clamped >= reels.length - 3) {
      currentPageRef.current += 1
      loadReels(currentPageRef.current)
    }
  }

  const toggleLike = (videoId) => {
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(videoId)) next.delete(videoId)
      else next.add(videoId)
      return next
    })
  }

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return
    const diff = touchStartRef.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      goTo(currentIndex + (diff > 0 ? 1 : -1))
    }
    touchStartRef.current = null
  }

  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) {
        goTo(currentIndex + (e.deltaY > 0 ? 1 : -1))
      }
    }
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); goTo(currentIndex + 1) }
      if (e.key === 'ArrowUp') { e.preventDefault(); goTo(currentIndex - 1) }
    }
    const el = containerRef.current
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: true })
      window.addEventListener('keydown', handleKey)
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKey)
    }
  }, [currentIndex, reels.length])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!reels.length) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-gray-500">No reels available right now. Try again later.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 z-20 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white/70 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/10"
      >&larr;</button>

      <div
        className="flex flex-col transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {reels.map((reel, i) => (
          <div key={`${reel.videoId}-${i}`} className="h-full w-full flex-shrink-0 relative bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${reel.videoId}?autoplay=${i === currentIndex ? 1 : 0}&controls=0&rel=0&showinfo=0&loop=1&playlist=${reel.videoId}&modestbranding=1`}
              allow="autoplay; encrypted-media; fullscreen"
              className="w-full h-full pointer-events-none"
              style={{ pointerEvents: i === currentIndex ? 'auto' : 'none' }}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20">
              <h3 className="text-white text-lg font-bold drop-shadow-lg line-clamp-2">{reel.title}</h3>
              <p className="text-gray-300 text-sm mt-1 drop-shadow-lg">{reel.channelTitle}</p>
            </div>

            <div className="absolute right-4 bottom-28 flex flex-col items-center gap-5">
              <button
                onClick={() => toggleLike(reel.videoId)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border ${
                  liked.has(reel.videoId)
                    ? 'bg-red-500/30 border-red-400/60 shadow-lg shadow-red-500/20'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}>
                  <svg className={`w-6 h-6 transition-colors ${liked.has(reel.videoId) ? 'text-red-400' : 'text-white/80 group-hover:text-white'}`} fill={liked.has(reel.videoId) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {reels.slice(0, 10).map((_, dotIdx) => (
                <div
                  key={dotIdx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    dotIdx === i ? 'bg-white w-3' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
