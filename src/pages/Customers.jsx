import { useNavigate } from 'react-router-dom'
import { Pill } from '../components/Pill.jsx'
import { useData } from '../lib/store.jsx'
import { statusOf } from '../lib/status.js'

export default function Customers() {
  const navigate = useNavigate()
  const { db } = useData()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers and sites</h1>
          <p>{db.customers.length} customers · {db.sites.length} sites</p>
        </div>
      </div>

      {db.customers.map((c) => {
        const sites = db.sites.filter((s) => s.customerId === c.id)
        const items = db.equipment.filter((e) => e.customerId === c.id)
        const overdue = items.filter((e) => statusOf(e).key === 'over').length

        return (
          <section className="panel" key={c.id} style={{ marginBottom: 14 }}>
            <h2>
              {c.name}
              <span className="aux">{items.length} items · {sites.length} sites</span>
            </h2>
            <div className="body">
              <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
                {c.contact} · <span className="mono">{c.phone}</span>
                {overdue > 0 && (
                  <span style={{ color: 'var(--crit)', fontWeight: 600 }}> · {overdue} overdue</span>
                )}
              </p>
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr><th>Site</th><th>City</th><th>Equipment</th><th>Attention</th></tr>
                  </thead>
                  <tbody>
                    {sites.map((s) => {
                      const own = items.filter((e) => e.siteId === s.id)
                      const flagged = own.filter((e) => ['over', 'due', 'fail'].includes(statusOf(e).key)).length
                      return (
                        <tr
                          key={s.id}
                          className="clickable"
                          onClick={() => navigate(`/equipment?q=${encodeURIComponent(s.name)}`)}
                        >
                          <td><b style={{ fontWeight: 600 }}>{s.name}</b></td>
                          <td className="muted">{s.city}</td>
                          <td className="num">{own.length}</td>
                          <td>
                            {flagged
                              ? <Pill tone="due">{flagged} need attention</Pill>
                              : <Pill tone="ok">Clear</Pill>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
