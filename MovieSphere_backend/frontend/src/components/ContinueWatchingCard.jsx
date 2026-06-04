import { useNavigate } from 'react-router-dom'

export default function ContinueWatchingCard({ item }) {
  const navigate = useNavigate()
  const id = item.media_id
  const mediaType = item.media_type
  const title = item.title || 'Untitled'
  const posterUrl = item.poster_url || ''
  const progress = item.progress_seconds || 0
  const total = item.total_seconds || 1
  const pct = Math.min(100, Math.round((progress / total) * 100))

  const handleResume = () => {
    if (mediaType === 'tv' && item.season != null && item.episode != null) {
      navigate(`/watch/tv/${id}/${item.season}/${item.episode}`)
    } else {
      navigate(`/watch/${mediaType}/${id}`)
    }
  }

  return (
    <div onClick={() => navigate(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}`)} className="group rounded-xl overflow-hidden bg-[#1a1b32] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/40 border border-transparent hover:border-gray-700/50">
      <div className="relative aspect-[2/3] overflow-hidden bg-[#12142a]">
        {posterUrl ? (
          <img src={posterUrl} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-700">{title[0]}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
          <div className="w-full bg-gray-800/80 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 font-medium">{pct}% watched</p>
        </div>
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-center justify-center">
          <button onClick={e => { e.stopPropagation(); handleResume() }} className="w-10 h-10 rounded-full bg-indigo-500 border-0 flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:bg-indigo-400 shadow-lg shadow-indigo-500/30" title="Resume">
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <h3 className="text-sm font-semibold text-gray-200 truncate">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{pct}% watched</p>
      </div>
    </div>
  )
}