import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/customers')
      .then(data => setCustomers(Array.isArray(data) ? data : data.customers || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader message="Loading customers..." />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">Registered customers and their account details.</p>
      </div>

      {error ? (
        <div className="error-box">Failed to load customers: {error}</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">No customers found.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => {
                const name =
                  c.name ||
                  (c.first_name && c.last_name
                    ? `${c.first_name} ${c.last_name}`
                    : c.customer_name || '—')
                const joined = c.created_at || c.joined_date || c.registration_date || ''
                return (
                  <tr key={c.customer_id || c.id || i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                    <td>{c.city || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {joined ? new Date(joined).toLocaleDateString() : '—'}
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
