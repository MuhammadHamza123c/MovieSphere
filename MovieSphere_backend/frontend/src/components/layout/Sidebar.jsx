import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'


const nav = [
  { to: '/home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/shows', label: 'TV Shows', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { to: '/favorites', label: 'Favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { to: '/top-rated', label: 'Top Rated', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { to: '/upcoming', label: 'Upcoming', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/watch-later', label: 'Watch Later', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/recommend', label: 'Recommend', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="group w-14 hover:w-56 bg-[#12142a] border-r border-[#1e2040] flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-200 z-50">
      <div className="flex items-center h-16 border-b border-[#1e2040]">
        <div className="flex items-center justify-center w-14 min-w-[56px]">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-400 to-purple-400" />
        </div>
        <h1 className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap hidden group-hover:block">
          MovieSphere
        </h1>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e2040]'
              }`
            }
          >
            <div className="flex items-center justify-center w-14 min-w-[56px]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </div>
            <span className="hidden group-hover:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="border-t border-[#1e2040]">
          <div className="py-3">
            <div className="flex items-center h-10 mb-2">
              <div className="flex items-center justify-center w-14 min-w-[56px]">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  {(user.username || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
              <span className="text-sm text-gray-400 truncate hidden group-hover:block">{user.username || user.email}</span>
            </div>
            <div className="hidden group-hover:block px-3.5">
              <button onClick={logout} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-[#1e2040] transition-all cursor-pointer">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
