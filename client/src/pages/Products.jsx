import { useState, useEffect, useCallback } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback((searchTerm) => {
    setLoading(true)
    setError(null)
    const endpoint = searchTerm ? `/products?search=${encodeURIComponent(searchTerm)}` : '/products'
    apiFetch(endpoint)
      .then(data => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchProducts('')
  }, [fetchProducts])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts(query)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">Browse and search all products in the catalog.</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or category..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="run-btn">Search</button>
        {query && (
          <button
            type="button"
            className="run-btn"
            style={{ background: 'var(--border)', color: 'var(--text)' }}
            onClick={() => { setQuery(''); fetchProducts('') }}
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <Loader message="Loading products..." />
      ) : error ? (
        <div className="error-box">Failed to load products: {error}</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products found.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price (PKR)</th>
                <th>Stock</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const stock = Number(p.stock_quantity ?? p.stock ?? 0)
                return (
                  <tr key={p.product_id || p.id || i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.name || p.product_name || '—'}</td>
                    <td>{p.category_name || p.category || '—'}</td>
                    <td>PKR {Number(p.price ?? 0).toLocaleString()}</td>
                    <td>
                      {stock < 10 ? (
                        <span className="badge badge-red">{stock} Low</span>
                      ) : (
                        <span className="badge badge-green">{stock}</span>
                      )}
                    </td>
                    <td>{p.supplier_name || p.supplier || '—'}</td>
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
