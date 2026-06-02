import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStreamUrl } from '../api/endpoints'

export default function WatchPage() {
  const { type, id, season, epi } = useParams()
  const navigate = useNavigate()
  const [streamUrl, setStreamUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getStreamUrl(id, season, epi).then(url => {
      if (!url || url.startsWith('Error')) { setError('Stream not available for this title') }
      else { setStreamUrl(url) }
    }).catch(() => setError('Failed to load stream'))
  }, [id, season, epi])

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <button onClick={() => navigate(-1)} className="px-3.5 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-[#1e2040] transition-all cursor-pointer bg-transparent">&larr; Back</button>
        <h2 className="text-lg font-extrabold text-gray-100">Now Watching</h2>
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