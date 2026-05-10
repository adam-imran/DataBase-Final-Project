import { useState } from 'react'
import apiFetch from '../api.js'

const REPORTS = [
  {
    id: 'revenue-by-category',
    title: 'Monthly Revenue by Category',
    endpoint: '/reports/revenue-by-category',
    description: 'Revenue breakdown grouped by product category per month.',
  },
  {
    id: 'top-products',
    title: 'Top 5 Best-Selling Products',
    endpoint: '/reports/top-products',
    description: 'The five products with the highest total sales volume.',
  },
  {
    id: 'high-spenders',
    title: 'Customers Above Average Spend',
    endpoint: '/reports/high-spenders',
    description: 'Customers whose total spending exceeds the store average.',
  },
  {
    id: 'low-stock',
    title: 'Low Stock Alert',
    endpoint: '/reports/low-stock',
    description: 'Products with stock quantity below the critical threshold.',
  },
  {
    id: 'order-history',
    title: 'Order History with Payment Status',
    endpoint: '/reports/order-history',
    description: 'Full order history including payment method and status.',
  },
  {
    id: 'top-rated',
    title: 'Top Rated Products',
    endpoint: '/reports/top-rated',
    description: 'Products sorted by average customer rating.',
  },
]

function ReportTable({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state" style={{ padding: '20px' }}>No results returned.</div>
  }
  const keys = Object.keys(data[0])
  return (
    <div style={{ overflowX: 'auto', marginTop: '12px' }}>
      <table style={{ fontSize: '12.5px' }}>
        <thead>
          <tr>
            {keys.map(k => (
              <th key={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {keys.map(k => {
                let val = row[k]
                if (val === null || val === undefined) val = '—'
                else if (
                  typeof val === 'string' &&
                  (k.includes('date') || k.includes('_at'))
                ) {
                  val = new Date(val).toLocaleDateString()
                } else if (
                  typeof val === 'number' &&
                  (k.includes('amount') || k.includes('revenue') || k.includes('price') || k.includes('spend') || k.includes('total'))
                ) {
                  val = `PKR ${Number(val).toLocaleString()}`
                }
                return <td key={k}>{String(val)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReportCard({ report }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [ran, setRan] = useState(false)

  const runQuery = () => {
    setLoading(true)
    setError(null)
    setRan(true)
    apiFetch(report.endpoint)
      .then(data => setResult(Array.isArray(data) ? data : data.data || data.results || [data]))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="report-card">
      <div className="report-card-header">
        <div>
          <div className="report-card-title">{report.title}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {report.description}
          </div>
        </div>
        <button className="run-btn" onClick={runQuery} disabled={loading}>
          {loading ? '⏳' : '▶'} {loading ? 'Running...' : 'Run Query'}
        </button>
      </div>

      {ran && (
        <div className="report-card-body">
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              Loading data from server...
            </div>
          )}
          {error && !loading && (
            <div className="error-box">Query failed: {error}</div>
          )}
          {result && !loading && (
            <ReportTable data={result} />
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
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Run analytical queries on the ShopSphere database.</p>
      </div>

      <div className="reports-grid">
        {REPORTS.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  )
}
