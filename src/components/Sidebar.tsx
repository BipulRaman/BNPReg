import { NavLink } from 'react-router-dom'
import { Home, Table, BarChart3, FileText } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  allowedPages: string[]
}

const navItems = [
  { to: '/', label: 'Home', icon: Home, page: 'home' },
  { to: '/registrations', label: 'Registrations', icon: Table, page: 'registrations' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, page: 'analytics' },
  { to: '/docgen', label: 'Docgen', icon: FileText, page: 'docgen' },
]

export default function Sidebar({ isOpen, onClose, allowedPages }: SidebarProps) {
  const visibleItems = navItems.filter(item => allowedPages.includes(item.page))

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-profile">
          <img src="/logo-bnp.png" alt="Profile" className="profile-avatar" />
          <h2 className="profile-name">Samagam 5.0</h2>
        </div>
        <nav className="sidebar-nav">
          {visibleItems.map(({ to, label, icon: Icon }) => (
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
