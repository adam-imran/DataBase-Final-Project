import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/products', icon: '📦', label: 'Products' },
  { to: '/categories', icon: '🗂️', label: 'Categories' },
  { to: '/suppliers', icon: '🏭', label: 'Suppliers' },
  { to: '/orders', icon: '🛒', label: 'Orders' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/reports', icon: '📊', label: 'Reports' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">🛍️ ShopSphere</div>
        <div className="sidebar-logo-subtitle">E-Commerce Dashboard</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'sidebar-nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        ShopSphere v1.0 &mdash; Admin Panel
      </div>
    </aside>
  )
}
