import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import type { GoogleUser } from '../App'

interface LayoutProps {
  user: GoogleUser
  onSignOut: () => void
}

export default function Layout({ user, onSignOut }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app-layout">
      <Header onMenuToggle={() => setSidebarOpen(o => !o)} user={user} onSignOut={onSignOut} />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Outlet />
          <footer className="app-footer">
            <div className="footer-text">
              © Samagam 2026 | <a href="/privacy">Privacy</a> | Made with ❤️ in Bharat 🇮🇳
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
