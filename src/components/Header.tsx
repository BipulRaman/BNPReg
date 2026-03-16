import { useState, useRef, useEffect } from 'react'
import { Menu, LogOut } from 'lucide-react'
import type { GoogleUser } from '../App'

interface HeaderProps {
  onMenuToggle: () => void
  user: GoogleUser
  onSignOut: () => void
}

export default function Header({ onMenuToggle, user, onSignOut }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <img src="/logo-bnp.png" alt="Samagam logo" className="header-logo" />
        <span className="header-title">Samagam</span>
      </div>
      <div className="header-right" ref={menuRef}>
        <button className="header-avatar-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Account menu">
          <img src={user.picture} alt={user.name} className="header-avatar" referrerPolicy="no-referrer" />
        </button>
        {menuOpen && (
          <div className="header-dropdown">
            <div className="header-dropdown-info">
              <img src={user.picture} alt={user.name} className="header-dropdown-avatar" referrerPolicy="no-referrer" />
              <div>
                <div className="header-dropdown-name">{user.name}</div>
                <div className="header-dropdown-email">{user.email}</div>
              </div>
            </div>
            <button className="header-dropdown-logout" onClick={onSignOut}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
