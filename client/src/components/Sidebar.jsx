import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '⚡', label: 'Dashboard', end: true },
  { to: '/products', icon: '📦', label: 'Products' },
  { to: '/categories', icon: '🗂️', label: 'Categories' },
  { to: '/suppliers', icon: '🏭', label: 'Suppliers' },
  { to: '/orders', icon: '🛒', label: 'Orders' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/reports', icon: '📊', label: 'Analytics' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon">🛍️</div>
          <div>
            <div className="brand-name">ShopSphere</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status">
          <div className="status-dot" />
          <div className="status-text">
            <strong>LIVE</strong> — Atlas M0 + Render
          </div>
        </div>
      </div>
    </aside>
  )
}
