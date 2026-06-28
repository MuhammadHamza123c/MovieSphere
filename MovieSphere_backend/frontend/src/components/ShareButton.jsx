import { useState, useCallback } from 'react'

export default function ShareButton({ mediaId, mediaType, title, season, epi }) {
  const [showToast, setShowToast] = useState(false)

  const shareUrl = mediaType === 'tv' && season && epi
    ? `https://movie-sphere-sigma.vercel.app/tv/${mediaId}`
    : `https://movie-sphere-sigma.vercel.app/movie/${mediaId}`

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl })
        return
      } catch (e) {
        if (e.name !== 'AbortError') {
          navigator.clipboard?.writeText(shareUrl)
          setShowToast(true)
          setTimeout(() => setShowToast(false), 2000)
        }
        return
      }
    }
    navigator.clipboard?.writeText(shareUrl)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }, [shareUrl, title])

  return (
    <>
      <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-700/50 rounded-lg text-sm font-medium transition-all cursor-pointer bg-transparent hover:border-gray-500 text-gray-400 hover:text-gray-200 relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        Share
      </button>
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/25 animate-bounce">
          Link copied!
        </div>
      )}
    </>
  )
}
