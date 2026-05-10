import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

const STATUS_CONFIG = {
  Pending:   { badge: 'badge-yellow', pill: 'p-yellow' },
  Confirmed: { badge: 'badge-blue',   pill: 'active' },
  Shipped:   { badge: 'badge-purple', pill: 'p-purple' },
  Delivered: { badge: 'badge-green',  pill: 'p-green' },
  Cancelled: { badge: 'badge-red',    pill: 'p-red' },
}
const ALL_STATUSES = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'All') params.set('status', statusFilter)
    apiFetch(`/orders${params.toString() ? '?' + params.toString() : ''}`)
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = orders.filter(o => {
    if (!search) return true
    const city = o.shippingAddress?.city || ''
    const customer = o.customerId?.name || ''
    const id = String(o._id || '')
    return city.toLowerCase().includes(search.toLowerCase()) ||
           customer.toLowerCase().includes(search.toLowerCase()) ||
           id.includes(search)
  })

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === 'All' ? orders.length : orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">All customer orders and their fulfilment status</p>
        </div>
        {!loading && <div className="info-chip">🛒 {orders.length.toLocaleString()} orders</div>}
      </div>

      <div className="pills">
        {ALL_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s] || {}
          const isActive = statusFilter === s
          return (
            <button
              key={s}
              className={`pill ${isActive ? (cfg.pill || 'active') : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s} {counts[s] > 0 && <span style={{ opacity: 0.7, marginLeft: '2px' }}>({counts[s]})</span>}
            </button>
          )
        })}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon-el">🔍</span>
          <input
            className="search-input"
            placeholder="Search by customer or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear</button>}
      </div>

      {loading ? <Loader message="Loading orders…" /> : error ? (
        <div className="error-box">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon">🛒</div>No orders found</div></div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Order List</span>
            <span className="card-subtitle">{filtered.length.toLocaleString()} results</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => {
                  const status = o.status || 'Unknown'
                  const cfg = STATUS_CONFIG[status] || { badge: 'badge-gray' }
                  const city = o.shippingAddress?.city || '—'
                  const customer = o.customerId?.name || 'Guest'
                  const oid = String(o._id || '').slice(-8).toUpperCase()
                  const date = o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                  return (
                    <tr key={o._id || i}>
                      <td className="td-muted" style={{ fontSize: '12px' }}>{i + 1}</td>
                      <td className="td-mono">#{oid}</td>
                      <td className="td-bold">{customer}</td>
                      <td className="td-muted">{city}</td>
                      <td className="td-muted">{date}</td>
                      <td className="td-bold">PKR {Number(o.totalAmount || 0).toLocaleString()}</td>
                      <td><span className={`badge ${cfg.badge}`}>{status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
