import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useStore } from '../lib/store.jsx'

export default function Audit() {
  const { db } = useStore()
  const [query, setQuery] = useState('')
  const [who, setWho] = useState('')

  const people = useMemo(
    () => [...new Set(db.audit.map((a) => a.user))].sort(),
    [db.audit]
  )

  const rows = db.audit.filter((a) => {
    if (who && a.user !== who) return false
    if (!query.trim()) return true
    const needle = query.trim().toLowerCase()
    return [a.action, a.entity, a.detail, a.user, a.ts].join(' ').toLowerCase().includes(needle)
  })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p>{rows.length} of {db.audit.length} recorded actions · newest first</p>
        </div>
      </div>

      <div className="filters">
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by user">
          <option value="">Every user</option>
          {people.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by action, equipment or detail…"
          aria-label="Filter the audit trail"
          style={{ flex: '2 1 220px', width: 'auto' }}
        />
      </div>

      <section className="panel">
        <div className="body flush">
          {rows.length === 0 ? (
            <p className="empty"><Icon name="search" />Nothing matches that filter.</p>
          ) : (
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr><th>When</th><th>User</th><th>Action</th><th>Record</th><th>Detail</th></tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{a.ts}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{a.user}</td>
                      <td><b style={{ fontWeight: 600 }}>{a.action}</b></td>
                      <td className="eid">{a.entity}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{a.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        Sign-ins and failed sign-in attempts, equipment added, edited and deleted, customers
        and sites changed, service records filed, QR labels generated, report exports,
        account changes, password resets, backups and restores are all recorded against the
        individual account that performed them. This is what individual logins buy you over
        a shared engineer account.
      </p>
    </>
  )
}
