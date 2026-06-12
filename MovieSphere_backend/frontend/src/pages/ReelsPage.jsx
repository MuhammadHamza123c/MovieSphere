import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchReels } from '../api/endpoints'

export default function ReelsPage() {
  const [reels, setReels] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(new Set())
  const [soundOn, setSoundOn] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef(null)
  const touchStartRef = useRef(null)
  const touchStartTimeRef = useRef(0)
  const loadedPages = useRef(new Set())
  const currentPageRef = useRef(1)
  const wheelThrottleRef = useRef(false)
  const playersRef = useRef({})
  const apiReadyRef = useRef(false)
  const lastTapRef = useRef(0)
  const [doubleTapHeart, setDoubleTapHeart] = useState(null)
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
    if (window.YT?.Player) { apiReadyRef.current = true; return }
    window.onYouTubeIframeAPIReady = () => { apiReadyRef.current = true }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }, [])

  useEffect(() => {
    setLoading(true)
    loadReels(1).then(() => setLoading(false))
  }, [loadReels])

  const getPlayer = useCallback((videoId) => playersRef.current[videoId], [])

  const goTo = useCallback((index) => {
    setCurrentIndex(prev => {
      const next = Math.max(0, Math.min(index, reels.length - 1))
      if (next >= reels.length - 3) {
        currentPageRef.current += 1
        loadReels(currentPageRef.current)
      }
      const prevReel = reels[prev]
      if (prevReel) {
        const p = playersRef.current[prevReel.videoId]
        if (p?.pauseVideo) p.pauseVideo()
      }
      return next
    })
  }, [reels.length, loadReels, reels])

  useEffect(() => {
    if (!apiReadyRef.current || !reels.length) return
    const reel = reels[currentIndex]
    if (!reel) return

    const containerId = `reel-player-${currentIndex}`
    const existing = playersRef.current[reel.videoId]

    if (existing) {
      existing.playVideo()
      if (!soundOn) existing.mute()
      else existing.unMute()
      return
    }

    const container = document.getElementById(containerId)
    if (!container) return

    playersRef.current[reel.videoId] = new YT.Player(containerId, {
      videoId: reel.videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        controls: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
        fs: 0,
        cc_load_policy: 0,
      },
      events: {
        onReady: (e) => {
          e.target.mute()
          e.target.playVideo()
          setSoundOn(false)
          setPaused(false)
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) setPaused(false)
          if (e.data === YT.PlayerState.PAUSED) setPaused(true)
          if (e.data === YT.PlayerState.ENDED) {
            goTo(currentIndex + 1)
          }
        },
      },
    })
  }, [currentIndex, reels, soundOn, goTo])

  useEffect(() => {
    if (!reels[currentIndex]) return
    const interval = setInterval(() => {
      const reel = reels[currentIndex]
      if (!reel) return
      const player = playersRef.current[reel.videoId]
      if (player?.getCurrentTime && player?.getDuration) {
        const dur = player.getDuration()
        if (dur > 0) setProgress(player.getCurrentTime() / dur)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [currentIndex, reels])

  useEffect(() => {
    return () => {
      Object.values(playersRef.current).forEach(p => {
        try { p.destroy() } catch {}
      })
      playersRef.current = {}
    }
  }, [])

  const toggleLike = (videoId) => {
    setLiked(prev => {
      const next = new Set(prev)
      if (next.has(videoId)) next.delete(videoId)
      else next.add(videoId)
      return next
    })
  }

  const toggleSound = useCallback(() => {
    setSoundOn(prev => {
      const next = !prev
      const reel = reels[currentIndex]
      if (reel) {
        const player = playersRef.current[reel.videoId]
        if (player) {
          if (next) player.unMute()
          else player.mute()
        }
      }
      return next
    })
  }, [currentIndex, reels])

  const handleVideoTap = useCallback((e) => {
    const now = Date.now()
    if (now - lastTapRef.current < 350) {
      const vid = reels[currentIndex]?.videoId
      if (vid) {
        toggleLike(vid)
        const id = Date.now()
        setDoubleTapHeart(id)
        setTimeout(() => setDoubleTapHeart(prev => prev === id ? null : prev), 800)
      }
      lastTapRef.current = 0
      return
    }
    lastTapRef.current = now
    setTimeout(() => {
      if (lastTapRef.current === now) {
        const reel = reels[currentIndex]
        if (!reel) return
        const player = playersRef.current[reel.videoId]
        if (!player) return
        const state = player.getPlayerState()
        if (state === YT.PlayerState.PLAYING) {
          player.pauseVideo()
          setPaused(true)
        } else {
          player.playVideo()
          setPaused(false)
        }
      }
    }, 350)
  }, [currentIndex, reels])

  const handleWheel = useCallback((e) => {
    if (wheelThrottleRef.current) return
    wheelThrottleRef.current = true
    requestAnimationFrame(() => {
      if (Math.abs(e.deltaY) > 20) goTo(currentIndex + (e.deltaY > 0 ? 1 : -1))
      wheelThrottleRef.current = false
    })
  }, [currentIndex, goTo])

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.changedTouches[0].clientY
    touchStartTimeRef.current = Date.now()
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return
    const diff = touchStartRef.current - e.changedTouches[0].clientY
    const elapsed = Date.now() - touchStartTimeRef.current
    if (Math.abs(diff) > 30 && elapsed < 600) {
      goTo(currentIndex + (diff > 0 ? 1 : -1))
    }
    touchStartRef.current = null
  }, [currentIndex, goTo])

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); goTo(currentIndex + 1) }
    if (e.key === 'ArrowUp') { e.preventDefault(); goTo(currentIndex - 1) }
  }, [currentIndex, goTo])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('keydown', handleKey)
    return () => {
      el.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKey)
    }
  }, [handleWheel, handleKey])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!reels.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg mb-4">No reels available</p>
          <button onClick={() => { loadedPages.current.clear(); currentPageRef.current = 1; setLoading(true); loadReels(1).then(() => setLoading(false)) }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer backdrop-blur-sm">Refresh</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {reels.map((reel, i) => {
          const isActive = i === currentIndex
          const offset = (i - currentIndex) * 100
          return (
            <div
              key={`${reel.videoId}-${i}`}
              className="absolute inset-0 transition-transform duration-[400ms] ease-out bg-black"
              style={{ transform: `translateY(${offset}%)` }}
            >
              <div className="relative h-full w-full flex items-center justify-center bg-black">
                <div className="relative h-full w-full max-w-[56.25vh]">
                  <div id={`reel-player-${i}`} className="h-full w-full" />

                  {paused && isActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handleVideoTap}
                  />
                </div>
              </div>

              {doubleTapHeart !== null && isActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-bounce" style={{ animationDuration: '0.8s' }}>
                  <svg className="w-20 h-20 text-red-500 drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-5 pt-20 pb-2 pointer-events-none">
                <div className="max-w-[56.25vh] mx-auto w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {reel.channelTitle?.charAt(0)?.toUpperCase() || 'Y'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate drop-shadow-lg">{reel.channelTitle}</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed drop-shadow-lg line-clamp-2">{reel.title}</p>
                </div>
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
                  <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress * 100}%` }} />
                </div>
              )}

              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-20">
                <button
                  onClick={() => toggleLike(reel.videoId)}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="flex flex-col items-center gap-0.5 group cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
                    liked.has(reel.videoId) ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'
                  }`}>
                    <svg className={`w-6 h-6 transition-all ${liked.has(reel.videoId) ? 'text-red-400 scale-110' : 'text-white group-hover:text-white/90'}`} fill={liked.has(reel.videoId) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={toggleSound}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="flex flex-col items-center gap-0.5 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {soundOn ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      )}
                    </svg>
                  </div>
                </button>
              </div>

              <button
                onClick={() => navigate('/home')}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute top-12 left-3 z-20 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white/80 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm"
                title="Close Reels"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {reels.length > 1 && (
        <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-center gap-[3px] pr-1.5 z-30 pointer-events-none">
          {reels.slice(0, 10).map((_, dotIdx) => (
            <div
              key={dotIdx}
              className={`rounded-full transition-all duration-200 ${
                dotIdx === currentIndex ? 'w-[3px] h-5 bg-white' : 'w-[3px] h-[3px] bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
