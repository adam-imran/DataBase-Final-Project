import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Categories() {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [openIds, setOpenIds] = useState(new Set())

  useEffect(() => {
    apiFetch('/categories/tree')
      .then(data => {
        const items = Array.isArray(data) ? data : []
        setTree(items)
        setOpenIds(new Set(items.slice(0, 3).map(x => x._id)))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toggle = id => setOpenIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const q = search.toLowerCase()
  const filtered = tree.filter(cat =>
    !q || cat.name?.toLowerCase().includes(q) ||
    cat.description?.toLowerCase().includes(q) ||
    cat.subcategories?.some(s => s.name?.toLowerCase().includes(q))
  )

  const totalProducts = tree.reduce((s, c) => s + (c.productCount || 0) + (c.subcategories || []).reduce((ss, sc) => ss + (sc.productCount || 0), 0), 0)

  if (loading) return <Loader message="Loading categories…" />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Product category hierarchy — {tree.length} top-level, {totalProducts} products total</p>
        </div>
        <div className="info-chip">🗂️ {tree.length} categories</div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon-el">🔍</span>
          <input
            className="search-input"
            placeholder="Filter categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpenIds(new Set(tree.map(x => x._id)))}>
          Expand All
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpenIds(new Set())}>
          Collapse All
        </button>
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear</button>
        )}
      </div>

      {error ? <div className="error-box">⚠️ {error}</div> : filtered.length === 0 ? (
        <div className="card"><div className="empty"><div className="empty-icon">🗂️</div>No categories match</div></div>
      ) : (
        <div className="cat-list">
          {filtered.map(cat => {
            const isOpen = openIds.has(cat._id)
            const subs = cat.subcategories || []
            const totalProd = (cat.productCount || 0) + subs.reduce((s, c) => s + (c.productCount || 0), 0)
            return (
              <div key={cat._id} className={`cat-item ${isOpen ? 'open' : ''}`}>
                <div className="cat-row" onClick={() => toggle(cat._id)}>
                  <span style={{ fontSize: '18px' }}>🗂️</span>
                  <div className="cat-main">
                    <div className="cat-parent-name">{cat.name}</div>
                    {cat.description && <div className="cat-parent-desc">{cat.description}</div>}
                  </div>
                  <span className="badge badge-green" style={{ marginRight: '6px' }}>{totalProd} products</span>
                  {subs.length > 0 && (
                    <span className="badge badge-gray" style={{ marginRight: '10px' }}>{subs.length} sub</span>
                  )}
                  <span className="cat-arrow">▶</span>
                </div>
                {isOpen && subs.length > 0 && (
                  <div className="cat-children">
                    {subs.map((sub, si) => (
                      <div key={sub._id || si} className="cat-child">
                        <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>↳</span>
                        <span className="cat-child-name">{sub.name}</span>
                        {sub.description && (
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '8px' }}>{sub.description}</span>
                        )}
                        <span className="badge badge-blue">{sub.productCount || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isOpen && subs.length === 0 && (
                  <div className="cat-children">
                    <div className="cat-child" style={{ color: 'var(--text-dim)', fontSize: '12.5px', fontStyle: 'italic' }}>
                      No subcategories
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
