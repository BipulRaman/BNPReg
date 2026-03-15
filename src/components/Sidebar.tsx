import { NavLink } from 'react-router-dom'
import { Home, Table, BarChart3, FileText } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/registrations', label: 'Registrations', icon: Table },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/docgen', label: 'Docgen', icon: FileText },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-profile">
          <img src="/logo-bnp.png" alt="Profile" className="profile-avatar" />
          <h2 className="profile-name">Samagam 5.0</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
