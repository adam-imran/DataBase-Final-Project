import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/suppliers')
      .then(data => setSuppliers(Array.isArray(data) ? data : data.suppliers || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader message="Loading suppliers..." />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <p className="page-subtitle">All registered product suppliers and their details.</p>
      </div>

      {error ? (
        <div className="error-box">Failed to load suppliers: {error}</div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state">No suppliers found.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr key={s.supplier_id || s.id || i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{s.name || s.supplier_name || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                  <td>{s.phone || s.phone_number || '—'}</td>
                  <td>
                    <span className="badge badge-blue">
                      {s.product_count ?? s.products ?? 0} products
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
