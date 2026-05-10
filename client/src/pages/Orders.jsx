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

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/orders')
      .then(data => setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader message="Loading orders..." />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">All customer orders and their current status.</p>
      </div>

      {error ? (
        <div className="error-box">Failed to load orders: {error}</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">No orders found.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount (PKR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const status = o.status || o.order_status || 'Unknown'
                const badgeClass = STATUS_BADGE[status] || 'badge-gray'
                const date = o.order_date || o.date || o.created_at || ''
                const amount = o.total_amount || o.amount || o.total || 0
                const customer = o.customer_name || o.customer || '—'
                const orderId = o.order_id || o.id || i + 1
                return (
                  <tr key={orderId}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{String(orderId).padStart(4, '0')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{customer}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {date ? new Date(date).toLocaleDateString() : '—'}
                    </td>
                    <td>PKR {Number(amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
