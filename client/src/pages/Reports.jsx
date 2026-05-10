import { useState } from 'react'
import apiFetch from '../api.js'

const REPORTS = [
  {
    id: 'revenue',
    icon: '💹',
    title: 'Monthly Revenue by Category',
    sql: 'SELECT category, month, year, SUM(qty×price) AS revenue\nFROM OrderItems JOIN Orders JOIN Categories\nWHERE status=Delivered GROUP BY category, year, month\nORDER BY revenue DESC',
    endpoint: '/reports/revenue-by-category',
    columns: ['category', 'year', 'month', 'revenue'],
    color: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    fmt: { revenue: v => `PKR ${Number(v).toLocaleString()}` },
  },
  {
    id: 'top-products',
    icon: '🏆',
    title: 'Top 5 Best-Selling Products',
    sql: 'SELECT name, category, SUM(quantity) AS totalSold,\nSUM(qty×price) AS revenue\nFROM OrderItems JOIN Products\nGROUP BY product ORDER BY totalSold DESC LIMIT 5',
    endpoint: '/reports/top-products',
    columns: ['productName', 'category', 'totalSold', 'totalRevenue'],
    color: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    fmt: { totalRevenue: v => `PKR ${Number(v).toLocaleString()}` },
  },
  {
    id: 'high-spenders',
    icon: '👑',
    title: 'High-Value Customers',
    sql: 'SELECT name, city, COUNT(orders) AS orders,\nSUM(totalAmount) AS totalSpend\nFROM Orders JOIN Customers WHERE status!=Cancelled\nGROUP BY customer HAVING spend > AVG(spend)',
    endpoint: '/reports/high-spenders',
    columns: ['name', 'city', 'orderCount', 'totalSpend'],
    color: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.3)',
    fmt: { totalSpend: v => `PKR ${Number(v).toLocaleString()}` },
  },
  {
    id: 'low-stock',
    icon: '⚠️',
    title: 'Low Stock Alert (< 10 units)',
    sql: 'SELECT name, stockQty, price, category, supplier\nFROM Products WHERE stockQuantity < 10\nORDER BY stockQuantity ASC',
    endpoint: '/reports/low-stock',
    columns: ['productName', 'stockQuantity', 'price', 'category'],
    color: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    fmt: { price: v => `PKR ${Number(v).toLocaleString()}` },
  },
  {
    id: 'order-history',
    icon: '📋',
    title: 'Order History with Payments',
    sql: 'SELECT customer, orderDate, totalAmount, orderStatus,\npaymentMethod, paymentStatus\nFROM Orders JOIN Customers JOIN Payments\nORDER BY orderDate DESC LIMIT 15',
    endpoint: '/reports/order-history',
    columns: ['customerName', 'orderDate', 'totalAmount', 'orderStatus', 'paymentMethod', 'paymentStatus'],
    color: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    fmt: { totalAmount: v => `PKR ${Number(v).toLocaleString()}` },
  },
  {
    id: 'top-rated',
    icon: '⭐',
    title: 'Top Rated Products (≥5 reviews)',
    sql: 'SELECT name, category, COUNT(reviews) AS reviews,\nAVG(rating) AS avgRating\nFROM Reviews JOIN Products JOIN Categories\nGROUP BY product HAVING reviews >= 5\nORDER BY avgRating DESC LIMIT 10',
    endpoint: '/reports/top-rated',
    columns: ['productName', 'category', 'reviewCount', 'avgRating'],
    color: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.3)',
    fmt: {},
  },
]

const STATUS_BADGE = {
  Delivered: 'badge-green', Shipped: 'badge-purple', Confirmed: 'badge-blue',
  Pending: 'badge-yellow', Cancelled: 'badge-red', Completed: 'badge-green', Failed: 'badge-red',
}

function ReportCard({ report }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const data = await apiFetch(report.endpoint)
      setResult(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const colLabel = col => col.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

  return (
    <div className="report-card" style={{ borderColor: result ? report.border : '' }}>
      <div className="report-card-icon" style={{ background: report.color, border: `1px solid ${report.border}` }}>
        {report.icon}
      </div>
      <div className="report-card-title">{report.title}</div>
      <pre className="report-card-sql">{report.sql}</pre>
      <button className="run-btn" onClick={run} disabled={loading}>
        {loading ? '⏳ Running…' : result ? '🔄 Re-run Query' : '▶  Run Query'}
      </button>
      {error && <div className="error-box" style={{ marginTop: '12px', fontSize: '12px' }}>⚠️ {error}</div>}
      {result && !loading && (
        <div className="report-result">
          {result.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '12.5px', textAlign: 'center', padding: '12px' }}>No results returned</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="result-table">
                  <thead><tr>{report.columns.map(col => <th key={col}>{colLabel(col)}</th>)}</tr></thead>
                  <tbody>
                    {result.map((row, i) => (
                      <tr key={i}>
                        {report.columns.map(col => {
                          const val = row[col] ?? '—'
                          const isBadge = (col === 'orderStatus' || col === 'paymentStatus') && STATUS_BADGE[val]
                          const fmt = report.fmt?.[col]
                          return (
                            <td key={col}>
                              {isBadge
                                ? <span className={`badge ${STATUS_BADGE[val]}`} style={{ fontSize: '10px', padding: '2px 7px' }}>{val}</span>
                                : fmt ? fmt(val) : String(val)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="result-count">{result.length} row{result.length !== 1 ? 's' : ''} returned</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Reports() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">6 analytical queries — click Run to execute against live MongoDB data</p>
        </div>
        <div className="info-chip">📊 6 queries</div>
      </div>
      <div className="report-grid">
        {REPORTS.map(r => <ReportCard key={r.id} report={r} />)}
      </div>
    </div>
  )
}
