import { useState, useEffect, useCallback } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/categories')
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback((search, cat, ls) => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (cat) params.set('category', cat)
    if (ls) params.set('lowStock', 'true')
    const qs = params.toString()
    apiFetch(`/products${qs ? '?' + qs : ''}`)
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchProducts('', '', false) }, [fetchProducts])

  const handleSearch = e => { e.preventDefault(); fetchProducts(query, catFilter, lowStock) }
  const handleLowStock = () => { const next = !lowStock; setLowStock(next); fetchProducts(query, catFilter, next) }
  const handleCat = e => { setCatFilter(e.target.value); fetchProducts(query, e.target.value, lowStock) }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Browse and manage the full product catalog</p>
        </div>
        {!loading && <div className="info-chip">📦 {products.length.toLocaleString()} items</div>}
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="search-wrap">
          <span className="search-icon-el">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search products…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <select className="select-input" value={catFilter} onChange={handleCat}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <div className="toggle-row" onClick={handleLowStock}>
          <div className={`toggle-track ${lowStock ? 'on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <span className="toggle-label">Low Stock only</span>
        </div>
        <button className="btn btn-primary btn-sm" type="submit">Search</button>
        {(query || catFilter || lowStock) && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setQuery(''); setCatFilter(''); setLowStock(false); fetchProducts('', '', false) }}>
            Clear
          </button>
        )}
      </form>

      {loading ? <Loader message="Loading products…" /> : error ? (
        <div className="error-box">⚠️ {error}</div>
      ) : products.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon">📦</div>No products found</div></div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Product Catalog</span>
            <span className="card-subtitle">{products.length.toLocaleString()} results</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const stock = Number(p.stockQuantity ?? 0)
                  const cat = p.categoryId?.name || '—'
                  const sup = p.supplierId?.name || '—'
                  return (
                    <tr key={p._id || i}>
                      <td className="td-mono td-muted">{i + 1}</td>
                      <td className="td-bold">{p.name || '—'}</td>
                      <td><span className="badge badge-blue">{cat}</span></td>
                      <td className="td-bold">PKR {Number(p.price || 0).toLocaleString()}</td>
                      <td>
                        {stock < 5 ? (
                          <span className="badge badge-red">⚠ {stock} Critical</span>
                        ) : stock < 10 ? (
                          <span className="badge badge-yellow">⬇ {stock} Low</span>
                        ) : (
                          <span className="badge badge-green">{stock}</span>
                        )}
                      </td>
                      <td className="td-muted">{sup}</td>
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
