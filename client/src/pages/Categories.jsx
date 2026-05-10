import { useState, useEffect } from 'react'
import apiFetch from '../api.js'
import Loader from '../components/Loader.jsx'

export default function Categories() {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/categories/tree')
      .then(data => setTree(Array.isArray(data) ? data : data.categories || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader message="Loading categories..." />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <p className="page-subtitle">Product category hierarchy with subcategories.</p>
      </div>

      {error ? (
        <div className="error-box">Failed to load categories: {error}</div>
      ) : tree.length === 0 ? (
        <div className="empty-state">No categories found.</div>
      ) : (
        <div className="card">
          <div className="category-tree">
            {tree.map((parent, pi) => {
              const parentName =
                parent.category_name || parent.name || `Category ${pi + 1}`
              const parentCount =
                parent.product_count ?? parent.productCount ?? null
              const children =
                parent.subcategories || parent.children || []

              return (
                <div className="category-parent" key={parent.category_id || parent.id || pi}>
                  <div className="category-parent-row">
                    <span style={{ fontSize: '18px' }}>🗂️</span>
                    <span style={{ flex: 1 }}>{parentName}</span>
                    {parentCount !== null && (
                      <span className="badge badge-green">{parentCount} products</span>
                    )}
                    {children.length > 0 && (
                      <span className="badge badge-gray">{children.length} sub</span>
                    )}
                  </div>

                  {children.length > 0 && (
                    <div className="category-children">
                      {children.map((child, ci) => {
                        const childName =
                          child.category_name || child.name || `Subcategory ${ci + 1}`
                        const childCount =
                          child.product_count ?? child.productCount ?? null
                        return (
                          <div
                            className="category-child-row"
                            key={child.category_id || child.id || ci}
                          >
                            <span style={{ fontSize: '14px' }}>↳</span>
                            <span style={{ flex: 1 }}>{childName}</span>
                            {childCount !== null && (
                              <span className="badge badge-blue">{childCount} products</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
