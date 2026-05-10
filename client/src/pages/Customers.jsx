import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (cityFilter) params.set('city', cityFilter)
    setLoading(true)
    apiFetch(`/customers${params.toString() ? '?' + params.toString() : ''}`)
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [search, cityFilter])

  const cities = [...new Set(customers.flatMap(c => (c.addresses || []).map(a => a.city)).filter(Boolean))].sort()

  const filtered = cityFilter
    ? customers.filter(c => (c.addresses || []).some(a => a.city === cityFilter))
    : customers

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Registered customer accounts</p>
        </div>
        {!loading && <div className="info-chip">👥 {customers.length.toLocaleString()} customers</div>}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon-el">🔍</span>
          <input
            className="search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {cities.length > 0 && (
          <select className="select-input" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(search || cityFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCityFilter('') }}>Clear</button>
        )}
      </div>

      {loading ? <Loader message="Loading customers…" /> : error ? (
        <div className="error-box">⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon">👥</div>No customers found</div></div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Customer Accounts</span>
            <span className="card-subtitle">{filtered.length.toLocaleString()} results</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const city = c.addresses?.[0]?.city || '—'
                  const joined = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                  return (
                    <tr key={c._id || i}>
                      <td className="td-muted" style={{ fontSize: '12px' }}>{i + 1}</td>
                      <td className="td-bold">{c.name || '—'}</td>
                      <td className="td-muted">{c.email || '—'}</td>
                      <td className="td-muted">{c.phone || '—'}</td>
                      <td>
                        {city !== '—' ? <span className="badge badge-blue">{city}</span> : <span className="td-muted">—</span>}
                      </td>
                      <td className="td-muted">{joined}</td>
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
