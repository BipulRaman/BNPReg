import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import type { GoogleUser } from '../App'

interface LayoutProps {
  user: GoogleUser
  onSignOut: () => void
  allowedPages: string[]
}

export default function Layout({ user, onSignOut, allowedPages }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app-layout">
      <Header onMenuToggle={() => setSidebarOpen(o => !o)} user={user} onSignOut={onSignOut} />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} allowedPages={allowedPages} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
