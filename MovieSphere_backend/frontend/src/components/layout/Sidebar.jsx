import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import client from '../../api/client'

const nav = [
  { to: '/home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/shows', label: 'TV Shows', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { to: '/trending', label: 'Trending', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { to: '/favorites', label: 'Favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { to: '/top-rated', label: 'Top Rated', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { to: '/upcoming', label: 'Upcoming', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/watch-later', label: 'Watch Later', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/recommend', label: 'Recommend', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { to: '/reels', label: 'Reels', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await client.delete('/auth/account')
      await logout()
    } catch (e) {
      alert('Failed to delete account: ' + (e.response?.data?.detail || e.message))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const navLinkClasses = ({ isActive }) =>
    `flex items-center h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-500/15 text-indigo-400'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
    }`

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 h-16 border-b border-[var(--border-primary)] px-4">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-400 to-purple-400" />
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MovieSphere</h1>
            </div>
            <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
              {nav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 h-12 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`
                  }
                >
                  <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-[var(--border-primary)] px-4 py-3 flex gap-2">
              <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer text-sm">
                {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
            {user && (
              <div className="border-t border-[var(--border-primary)] px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {(user.username || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)] truncate">{user.username || user.email}</span>
                </div>
                <button onClick={logout} className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer">
                  Sign Out
                </button>
                <button onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 w-full mt-2 px-3 py-1.5 rounded-lg text-[11px] text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer bg-transparent border-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex group w-14 hover:w-56 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-200 z-50">
        <div className="flex items-center h-16 border-b border-[var(--border-primary)]">
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
              className={navLinkClasses}
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
        {/* Theme toggle */}
        <div className="px-3.5 mb-2 hidden group-hover:block">
          <button onClick={toggleTheme} className="w-full flex items-center gap-2 h-10 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer text-sm justify-center">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
        <div className="flex items-center justify-center w-14 min-w-[56px] mb-2 hidden group-hover:hidden">
          <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer text-sm">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        {user && (
          <div className="border-t border-[var(--border-primary)]">
            <div className="py-3">
              <div className="flex items-center h-10 mb-2">
                <div className="flex items-center justify-center w-14 min-w-[56px]">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    {(user.username || user.email || 'U')[0].toUpperCase()}
                  </div>
                </div>
                <span className="text-sm text-[var(--text-secondary)] truncate hidden group-hover:block">{user.username || user.email}</span>
              </div>
              <div className="hidden group-hover:block px-3.5">
                <button onClick={logout} className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer">
                  Sign Out
                </button>
                <button onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 w-full mt-2 px-3 py-1.5 rounded-lg text-[11px] text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer bg-transparent border-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete account
                </button>
              </div>
              <div className="flex items-center justify-center w-14 min-w-[56px] hidden group-hover:hidden">
                <button onClick={() => setShowDeleteModal(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer border-0 bg-transparent">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-[#12142a] border border-red-900/40 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              This will permanently delete your account, favorites, watch later, comments, and all saved data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-700/50 text-sm text-gray-300 hover:bg-white/5 transition-all cursor-pointer bg-transparent disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-600 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
