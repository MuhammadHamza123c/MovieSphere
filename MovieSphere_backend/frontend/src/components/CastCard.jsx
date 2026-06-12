import { useNavigate } from 'react-router-dom'

export default function CastCard({ cast }) {
  const navigate = useNavigate()
  const actorId = cast.Id || cast.id
  const name = cast.Name || cast.name || 'Unknown'
  const role = cast.Role || cast.character || cast.role || ''
  const profilePath = cast.Profile_path || cast.profile_path || ''
  const profileUrl = profilePath ? (profilePath.startsWith('http') ? profilePath : `https://image.tmdb.org/t/p/w185${profilePath}`) : ''

  return (
    <div onClick={() => actorId && navigate(`/actor/${actorId}`)}
         className="flex-shrink-0 w-32 text-center cursor-pointer transition-transform duration-200 hover:-translate-y-1">
      <div className="w-28 h-28 mx-auto mb-2 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-indigo-500/50 transition-all duration-200 bg-[var(--bg-tertiary)]">
        {profileUrl ? (
          <img src={profileUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-primary)]">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</p>
      {role && <p className="text-xs text-[var(--text-muted)] truncate">{role}</p>}
    </div>
  )
}
