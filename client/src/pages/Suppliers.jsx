import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch('/suppliers')
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = suppliers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contactEmail?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Loader message="Loading suppliers…" />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Registered product suppliers and their contact details</p>
        </div>
        {!loading && <div className="info-chip">🏭 {suppliers.length} suppliers</div>}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon-el">🔍</span>
          <input
            className="search-input"
            placeholder="Search suppliers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear</button>}
      </div>

      {error ? <div className="error-box">⚠️ {error}</div> : filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon">🏭</div>No suppliers found</div></div>
      ) : (
        <div className="supplier-grid">
          {filtered.map((s, i) => (
            <div key={s._id || i} className="supplier-card">
              <div className="supplier-avatar">🏭</div>
              <div className="supplier-name">{s.name || '—'}</div>
              <div className="supplier-detail">
                <span className="supplier-detail-icon">✉️</span>
                <span style={{ wordBreak: 'break-all' }}>{s.contactEmail || '—'}</span>
              </div>
              <div className="supplier-detail">
                <span className="supplier-detail-icon">📞</span>
                <span>{s.phone || '—'}</span>
              </div>
              {s.address && (
                <div className="supplier-detail">
                  <span className="supplier-detail-icon">📍</span>
                  <span>{s.address}</span>
                </div>
              )}
              <div style={{ marginTop: '12px' }}>
                <span className="badge badge-purple">📦 {s.productCount ?? 0} products</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
