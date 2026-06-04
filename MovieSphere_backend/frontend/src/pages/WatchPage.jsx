import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStreamUrl } from '../api/endpoints'

export default function WatchPage() {
  const { type, id, season, epi } = useParams()
  const navigate = useNavigate()
  const [streamUrl, setStreamUrl] = useState('')
  const [error, setError] = useState('')
  const [cinema, setCinema] = useState(false)

  useEffect(() => {
    getStreamUrl(id, season, epi).then(url => {
      if (!url || url.startsWith('Error')) { setError('Stream not available for this title') }
      else { setStreamUrl(url) }
    }).catch(() => setError('Failed to load stream'))
  }, [id, season, epi])

  if (cinema && streamUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center group">
        <button
          onClick={() => setCinema(false)}
          className="absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/20 text-sm"
          title="Exit Cinema Mode"
        >✕</button>
        <div className="w-full h-full max-w-[98vw] max-h-[98vh] p-4">
          <iframe src={streamUrl} allowFullScreen allow="autoplay; encrypted-media" className="w-full h-full border-0 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <button onClick={() => navigate(-1)} className="px-3.5 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-[#1e2040] transition-all cursor-pointer bg-transparent">&larr; Back</button>
        <h2 className="text-lg font-extrabold text-gray-100">Now Watching</h2>
        {streamUrl && (
          <button onClick={() => setCinema(true)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/25">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cinema Mode
          </button>
        )}
      </div>
      {error ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer">Go Back</button>
        </div>
      ) : !streamUrl ? (
        <div className="aspect-video rounded-xl bg-black flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-xl shadow-black/50">
          <iframe src={streamUrl} allowFullScreen allow="autoplay; encrypted-media" className="w-full h-full border-0" />
        </div>
      )}
    </div>
  )
}
