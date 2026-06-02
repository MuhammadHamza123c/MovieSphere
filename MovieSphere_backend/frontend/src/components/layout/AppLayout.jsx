import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const { pathname } = useLocation()
  const showSearch = pathname === '/home' || pathname === '/shows' || pathname.startsWith('/search')

  return (
    <div className="flex min-h-screen bg-[#0b0d17]">
      <Sidebar />
      <main className="flex-1 p-6 pb-12 overflow-x-hidden min-w-0">
        {showSearch && <TopBar />}
        <Outlet />
      </main>
    </div>
  )
}
