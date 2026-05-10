import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

const STATUS_CONFIG = {
  Delivered:  { bar: '#10b981', badge: 'badge-green' },
  Shipped:    { bar: '#8b5cf6', badge: 'badge-purple' },
  Confirmed:  { bar: '#3b82f6', badge: 'badge-blue' },
  Pending:    { bar: '#f59e0b', badge: 'badge-yellow' },
  Cancelled:  { bar: '#ef4444', badge: 'badge-red' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    apiFetch('/reports/dashboard')
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    apiFetch('/orders?limit=8')
      .then(data => setOrders(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => {})
  }, [])

  if (loading) return <Loader message="Loading dashboard…" />
  if (error) return (
    <div>
      <div className="page-header"><div className="page-header-left"><h1 className="page-title">Dashboard</h1></div></div>
      <div className="error-box">⚠️ {error}</div>
    </div>
  )

  const { totalOrders = 0, totalCustomers = 0, totalProducts = 0, totalRevenue = 0, ordersByStatus = [] } = stats || {}
  const total = ordersByStatus.reduce((s, x) => s + (x.count || 0), 0) || 1

  const sorted = [...ordersByStatus].sort((a, b) => (b.count || 0) - (a.count || 0))

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live overview of your ShopSphere store</p>
        </div>
        <div className="info-chip">🕐 Live data from Atlas</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-top">
            <div className="stat-icon">🛒</div>
          </div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{Number(totalOrders).toLocaleString()}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-top">
            <div className="stat-icon">👥</div>
          </div>
          <div className="stat-label">Customers</div>
          <div className="stat-value">{Number(totalCustomers).toLocaleString()}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-top">
            <div className="stat-icon">📦</div>
          </div>
          <div className="stat-label">Products</div>
          <div className="stat-value">{Number(totalProducts).toLocaleString()}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-top">
            <div className="stat-icon">💰</div>
          </div>
          <div className="stat-label">Revenue</div>
          <div className="stat-value" style={{ fontSize: '20px' }}>
            PKR {Number(totalRevenue).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card card-last">
          <div className="card-header">
            <span className="card-title">Order Status Breakdown</span>
            <span className="card-subtitle">{Number(total).toLocaleString()} total</span>
          </div>
          <div className="card-body">
            {sorted.map(item => {
              const status = item._id || 'Unknown'
              const count = item.count || 0
              const cfg = STATUS_CONFIG[status] || { bar: '#7a9cc4', badge: 'badge-gray' }
              const pct = Math.round((count / total) * 100)
              return (
                <div className="progress-row" key={status}>
                  <span className="progress-label">
                    <span className={`badge ${cfg.badge}`} style={{ fontSize: '10.5px', padding: '2px 8px' }}>{status}</span>
                  </span>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: cfg.bar }} />
                  </div>
                  <span className="progress-count">{count.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card card-last">
          <div className="card-header">
            <span className="card-title">Recent Orders</span>
            <a href="/orders" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>City</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>No orders</td></tr>
                ) : orders.map((o, i) => {
                  const status = o.status || 'Unknown'
                  const cfg = STATUS_CONFIG[status] || { badge: 'badge-gray' }
                  const city = o.shippingAddress?.city || '—'
                  const oid = String(o._id || i + 1).slice(-6).toUpperCase()
                  return (
                    <tr key={o._id || i}>
                      <td className="td-mono">#{oid}</td>
                      <td className="td-muted">{city}</td>
                      <td className="td-bold">PKR {Number(o.totalAmount || 0).toLocaleString()}</td>
                      <td><span className={`badge ${cfg.badge}`}>{status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
