import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import { fetchNotifications, fetchUnreadCount, markNotificationsRead, deleteNotification } from '../../api/endpoints'

const nav = [
  { to: '/home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/shows', label: 'TV Shows', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { to: '/favorites', label: 'Favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { to: '/top-rated', label: 'Top Rated', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { to: '/upcoming', label: 'Upcoming', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/watch-later', label: 'Watch Later', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/recommend', label: 'Recommend', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
]

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try { setUnreadCount(await fetchUnreadCount()) } catch {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!showNotifs || !user) return
    fetchNotifications().then(setNotifications).catch(() => {})
  }, [showNotifs, user])

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const handleDeleteNotification = async (e, id, wasUnread) => {
    e.stopPropagation()
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  return (
    <aside ref={notifRef} className="group w-14 hover:w-56 bg-[#12142a] border-r border-[#1e2040] flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-200 z-50">
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
          <div className="relative">
            <button onClick={() => setShowNotifs(prev => !prev)} className="flex items-center h-10 w-full rounded-lg text-sm font-medium transition-all duration-200 text-gray-400 hover:text-gray-200 hover:bg-[#1e2040]">
              <div className="flex items-center justify-center w-14 min-w-[56px] relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-indigo-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden group-hover:inline">Notifications</span>
            </button>
            {showNotifs && (
              <div className="absolute left-full bottom-full mb-3 w-[32rem] bg-[#12142a] border border-[#1e2040] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2040]">
                  <h3 className="text-base font-bold text-gray-200">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer bg-transparent border-0 p-0">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[600px] overflow-y-auto scrollbar-vertical">
                  {notifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="relative group/item">
                        <button
                          onClick={() => { if (n.media_id && n.media_type) navigate(`/${n.media_type}/${n.media_id}`); if (!n.is_read) handleMarkRead(n.id) }}
                          className={`w-full text-left px-5 py-4 border-b border-[#1e2040]/50 flex gap-4 transition-colors cursor-pointer ${
                            n.is_read ? 'bg-transparent hover:bg-[#1e2040]/30' : 'bg-indigo-500/5 hover:bg-indigo-500/10'
                          }`}
                        >
                          {n.poster_url && (
                            <img src={n.poster_url} alt="" className="w-14 h-20 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${n.is_read ? 'text-gray-300' : 'text-gray-100 font-semibold'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-3">{n.body}</p>
                            <p className="text-xs text-gray-600 mt-1.5">{timeAgo(n.created_at)}</p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteNotification(e, n.id, !n.is_read)}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover/item:opacity-100 hover:bg-red-500/60 transition-all text-gray-400 hover:text-white cursor-pointer border-0"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
