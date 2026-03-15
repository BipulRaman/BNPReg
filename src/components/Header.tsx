import { Menu, LogOut } from 'lucide-react'
import type { GoogleUser } from '../App'

interface HeaderProps {
  onMenuToggle: () => void
  user: GoogleUser
  onSignOut: () => void
}

export default function Header({ onMenuToggle, user, onSignOut }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <img src="/logo-bnp.png" alt="Samagam logo" className="header-logo" />
        <span className="header-title">Samagam</span>
      </div>
      <div className="header-right">
        <img src={user.picture} alt={user.name} className="header-avatar" referrerPolicy="no-referrer" />
        <button className="settings-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
