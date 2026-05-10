import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

const STATUS_BADGE = {
  Pending: 'badge-yellow',
  Confirmed: 'badge-blue',
  Shipped: 'badge-purple',
  Delivered: 'badge-green',
  Cancelled: 'badge-red',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/dashboard')
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader message="Loading dashboard data..." />
  if (error) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <div className="error-box">Failed to load dashboard: {error}</div>
    </div>
  )

  const {
    totalOrders = 0,
    totalCustomers = 0,
    totalProducts = 0,
    totalRevenue = 0,
    orderStatusBreakdown = [],
    recentActivity = [],
  } = stats || {}

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back — here's what's happening with ShopSphere.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">🛒</div>
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-value">{Number(totalOrders).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-value">{Number(totalCustomers).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📦</div>
          <div className="stat-card-label">Total Products</div>
          <div className="stat-card-value">{Number(totalProducts).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value accent">
            PKR {Number(totalRevenue).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="two-col-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Order Status Breakdown</span>
          </div>
          {orderStatusBreakdown.length === 0 ? (
            <div className="empty-state">No order data available.</div>
          ) : (
            <div className="status-list">
              {orderStatusBreakdown.map((item) => {
                const status = item.status || item.order_status || 'Unknown'
                const count = item.count || item.total || 0
                const badgeClass = STATUS_BADGE[status] || 'badge-gray'
                return (
                  <div className="status-list-item" key={status}>
                    <div className="status-list-left">
                      <span className={`badge ${badgeClass}`}>{status}</span>
                    </div>
                    <span className="status-count">{Number(count).toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state">No recent activity.</div>
          ) : (
            <div className="status-list">
              {recentActivity.slice(0, 8).map((item, i) => {
                const label =
                  item.customer_name ||
                  item.name ||
                  item.description ||
                  item.activity ||
                  `Activity #${i + 1}`
                const detail =
                  item.total_amount != null
                    ? `PKR ${Number(item.total_amount).toLocaleString()}`
                    : item.date
                    ? new Date(item.date).toLocaleDateString()
                    : item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : ''
                const status = item.status || item.order_status || ''
                const badgeClass = STATUS_BADGE[status] || 'badge-gray'
                return (
                  <div className="status-list-item" key={i}>
                    <div className="status-list-left">
                      {status && <span className={`badge ${badgeClass}`}>{status}</span>}
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
                    </div>
                    {detail && (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{detail}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
