import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchActor } from '../api/endpoints'
import MovieGrid from '../components/MovieGrid'

export default function ActorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchActor(id).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex gap-8"><div className="w-72 bg-[#1a1b32] rounded-2xl flex-shrink-0 min-h-[300px]" /><div className="flex-1 space-y-3"><div className="h-5 bg-[#1a1b32] rounded w-1/3" /><div className="h-3 bg-[#1a1b32] rounded w-1/4" /><div className="h-3 bg-[#1a1b32] rounded w-1/5" /><div className="h-24 bg-[#1a1b32] rounded-xl mt-4" /></div></div>
        <div className="h-40 bg-[#1a1b32] rounded-xl" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-20 text-gray-500">Actor not found</div>

  const name = data.Name || data.name || 'Unknown'
  const profile = data.Profile_pic || data.profile_path || ''
  const profileUrl = profile ? (profile.startsWith('http') ? profile : `https://image.tmdb.org/t/p/original${profile}`) : ''
  const bio = data.Biography || data.biography || 'No biography available.'
  const birthday = data.Birthday || data.birthday || ''
  const birthplace = data.Birth_place || data.birth_place || ''
  const knownFor = data.Known_for || data.known_for || ''
  const workList = data.work_list || data.work || []

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-5 px-3 py-1.5 border border-gray-700/50 rounded-lg text-xs text-gray-500 hover:text-gray-200 hover:border-gray-600 hover:bg-[#1e2040]/50 transition-all cursor-pointer bg-transparent">
        &larr; Back
      </button>
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="flex-shrink-0 self-stretch min-h-[300px]">
          {profileUrl ? (
            <img src={profileUrl} alt={name} className="w-72 h-full object-cover rounded-2xl shadow-2xl shadow-black/40 border border-gray-700/20" />
          ) : (
            <div className="w-72 h-full min-h-[200px] rounded-2xl bg-[#1e2040] flex items-center justify-center text-4xl font-bold text-gray-500">{name[0]}</div>
          )}
        </div>
        <div className="flex-1 pt-2">
          <h1 className="text-3xl font-extrabold text-gray-100 mb-4">{name}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-gray-400 mb-6">
            {birthday && <p><span className="text-gray-500">Born</span> {birthday}</p>}
            {birthplace && <p><span className="text-gray-500">From</span> {birthplace}</p>}
            {knownFor && <p><span className="text-gray-500">Known for</span> {knownFor}</p>}
          </div>
          <h3 className="text-base font-bold text-gray-200 mb-3">Biography</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{bio}</p>
        </div>
      </div>
      {workList.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-200 mb-4">Filmography</h3>
          <MovieGrid items={workList} />
        </div>
      )}
    </div>
  )
}
