import { useNavigate } from 'react-router-dom'

export default function CastCard({ cast }) {
  const navigate = useNavigate()
  const name = cast.Name || cast.name || 'Unknown'
  const img = cast.Profile_path || cast.profile_path || ''
  const imgUrl = img ? (img.startsWith('http') ? img : `https://image.tmdb.org/t/p/w342${img}`) : ''
  const role = cast.Character_play || cast.character || ''
  const actorId = cast.Id || cast.id
  return (
    <div onClick={() => actorId && navigate(`/actor/${actorId}`)} className="flex-shrink-0 w-32 text-center cursor-pointer transition-transform duration-200 hover:-translate-y-1">
      {imgUrl ? (
        <img src={imgUrl} alt={name} className="w-28 h-28 rounded-full object-cover object-center mx-auto mb-2 ring-2 ring-transparent hover:ring-indigo-500/50 transition-all" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-[#1e2040] flex items-center justify-center text-xl font-bold text-gray-500 mx-auto mb-2">
          {name[0]}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-200 truncate">{name}</p>
      {role && <p className="text-xs text-gray-500 truncate">{role}</p>}
    </div>
  )
}
