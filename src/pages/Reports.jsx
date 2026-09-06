import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useData, useStore } from '../lib/store.jsx'
import { daysUntil, fmt, todayISO } from '../lib/dates.js'
import { statusOf } from '../lib/status.js'
import { download, toCSV } from '../lib/files.js'

const REPORTS = [
  { key: 'register', title: 'Equipment register', blurb: 'Every item in scope with location, dates and status' },
  { key: 'history', title: 'Service history', blurb: 'All service and inspection records with engineer and result' },
  { key: 'upcoming', title: 'Upcoming service', blurb: 'Items falling due within 90 days' },
  { key: 'overdue', title: 'Overdue service', blurb: 'Items past their next-service date' },
  { key: 'expiry', title: 'Expiry and warranty', blurb: 'Cylinder expiry and warranty-end tracking' },
  { key: 'engineer', title: 'Engineer activity', blurb: 'Service records grouped by engineer' }
]

export default function Reports() {
  const { myEquipment, myRecords, customer, site } = useData()
  const { log, toast } = useStore()
  const [preview, setPreview] = useState(null)

  const build = (key) => {
    const nameOf = (e) => ({ c: customer(e.customerId)?.name, s: site(e.siteId)?.name })
    switch (key) {
      case 'register':
        return {
          cols: ['ID', 'Name', 'Category', 'Type', 'Customer', 'Site', 'Building', 'Area', 'Installed', 'Next service', 'Status'],
          rows: myEquipment.map((e) => {
            const { c, s } = nameOf(e)
            return [e.id, e.name, e.category, e.type, c, s, e.building, e.area, e.installDate, e.nextServiceDate, statusOf(e).label]
          })
        }
      case 'history':
        return {
          cols: ['Date', 'Equipment', 'Type', 'Engineer', 'Result', 'Remarks'],
          rows: [...myRecords].sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((r) => [r.date, r.equipmentId, r.type, r.engineer, r.result, r.remarks])
        }
      case 'upcoming':
        return {
          cols: ['ID', 'Name', 'Customer', 'Site', 'Next service', 'Days'],
          rows: myEquipment
            .filter((e) => { const d = daysUntil(e.nextServiceDate); return d !== null && d >= 0 && d <= 90 })
            .sort((a, b) => daysUntil(a.nextServiceDate) - daysUntil(b.nextServiceDate))
            .map((e) => { const { c, s } = nameOf(e); return [e.id, e.name, c, s, e.nextServiceDate, daysUntil(e.nextServiceDate)] })
        }
      case 'overdue':
        return {
          cols: ['ID', 'Name', 'Customer', 'Site', 'Next service', 'Days overdue'],
          rows: myEquipment
            .filter((e) => daysUntil(e.nextServiceDate) < 0)
            .sort((a, b) => daysUntil(a.nextServiceDate) - daysUntil(b.nextServiceDate))
            .map((e) => { const { c, s } = nameOf(e); return [e.id, e.name, c, s, e.nextServiceDate, Math.abs(daysUntil(e.nextServiceDate))] })
        }
      case 'expiry':
        return {
          cols: ['ID', 'Name', 'Customer', 'Expiry', 'Warranty end'],
          rows: myEquipment
            .filter((e) => e.expiryDate || e.warrantyEnd)
            .sort((a, b) => ((a.expiryDate || a.warrantyEnd) < (b.expiryDate || b.warrantyEnd) ? -1 : 1))
            .map((e) => [e.id, e.name, customer(e.customerId)?.name, e.expiryDate, e.warrantyEnd])
        }
      case 'engineer':
        return {
          cols: ['Engineer', 'Date', 'Equipment', 'Type', 'Result'],
          rows: [...myRecords]
            .sort((a, b) => (a.engineer === b.engineer ? (a.date < b.date ? 1 : -1) : a.engineer < b.engineer ? -1 : 1))
            .map((r) => [r.engineer, r.date, r.equipmentId, r.type, r.result])
        }
      default:
        return { cols: [], rows: [] }
    }
  }

  const exportCSV = (key) => {
    const { cols, rows } = build(key)
    download(`serviceline-${key}-${todayISO()}.csv`, toCSV(cols, rows))
    log('Report exported', key, `${rows.length} rows`)
    toast(`${rows.length} rows downloaded`)
  }

  const shown = preview ? build(preview) : null

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>Filtered by your access scope · exported as CSV</p>
        </div>
      </div>

      <div className="label-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(238px, 1fr))' }}>
        {REPORTS.map((r) => (
          <section className="panel" key={r.key}>
            <div className="body">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--steel)' }}><Icon name="file" /></span>
                <div>
                  <b style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</b>
                  <p className="muted" style={{ fontSize: 12.5, margin: '2px 0 0' }}>{r.blurb}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn small" onClick={() => exportCSV(r.key)}>
                  <Icon name="download" />Export CSV
                </button>
                <button
                  className="btn small ghost"
                  onClick={() => setPreview(preview === r.key ? null : r.key)}
                >
                  {preview === r.key ? 'Hide' : 'Preview'}
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>

      {shown && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>
            {REPORTS.find((r) => r.key === preview).title}
            <span className="aux">{shown.rows.length} rows</span>
          </h2>
          <div className="body flush">
            {shown.rows.length === 0 ? (
              <p className="empty">Nothing to report — that is good news.</p>
            ) : (
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr>{shown.cols.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {shown.rows.slice(0, 40).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className={j === 0 ? 'eid' : undefined}>
                            {/^\d{4}-\d{2}-\d{2}$/.test(String(cell)) ? fmt(cell) : (cell ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {shown.rows.length > 40 && (
              <p className="muted" style={{ fontSize: 12, padding: '10px 14px', margin: 0 }}>
                Showing the first 40 rows. The CSV export contains all {shown.rows.length}.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  )
}
