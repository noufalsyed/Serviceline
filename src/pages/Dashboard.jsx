import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { StatusPill } from '../components/Pill.jsx'
import { useData } from '../lib/store.jsx'
import { buckets, statusOf } from '../lib/status.js'
import { daysUntil, fmtShort, relative, stamp } from '../lib/dates.js'

const STATUS_ORDER = [
  ['ok', 'Operational', 'var(--ok)'],
  ['due', 'Due soon', 'var(--warn)'],
  ['over', 'Overdue', 'var(--crit)'],
  ['exp', 'Expiring', 'var(--accent)'],
  ['maint', 'Maintenance', 'var(--steel)'],
  ['fail', 'Failed', 'var(--crit)']
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { me, myEquipment, myRecords, scopeLabel, where, can } = useData()

  const b = buckets(myEquipment)
  const counts = myEquipment.reduce((acc, e) => {
    const k = statusOf(e).key
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  const inspectionsDue = myEquipment.filter((e) => {
    const d = daysUntil(e.nextInspectionDate || e.nextServiceDate)
    return d !== null && d <= 30
  }).length

  const tiles = [
    { k: 'Total equipment', v: myEquipment.length, s: 'in your scope', c: 'var(--steel)', to: '/equipment' },
    { k: 'Due in 30 days', v: b.today.length + b.week.length + b.month.length, s: 'service falling due', c: 'var(--warn)', to: '/reminders' },
    { k: 'Overdue', v: b.overdue.length, s: 'past next-service date', c: 'var(--crit)', to: '/reminders' },
    { k: 'Inspections due', v: inspectionsDue, s: 'within 30 days', c: 'var(--warn)', to: '/reminders' },
    { k: 'Expiring soon', v: b.expiring.length, s: 'cylinder or unit expiry', c: 'var(--accent)', to: '/reminders' },
    { k: 'Under maintenance', v: counts.maint || 0, s: 'currently tagged', c: 'var(--steel)', to: '/equipment' }
  ]

  const upcoming = myEquipment
    .map((e) => ({ e, d: daysUntil(e.nextServiceDate) }))
    .filter((x) => x.d !== null && x.d <= 45)
    .sort((a, x) => a.d - x.d)
    .slice(0, 8)

  const recent = [...myRecords].sort((a, x) => (a.date < x.date ? 1 : -1)).slice(0, 5)
  const max = Math.max(1, myEquipment.length)

  return (
    <>
      <p className="scope-chip"><Icon name="shield" />{scopeLabel()}</p>

      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>{stamp()} · signed in as {me.name}</p>
        </div>
        {can('service') && (
          <button className="btn primary" onClick={() => navigate('/scan')}>
            <Icon name="qr" />Scan and service
          </button>
        )}
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <button key={t.k} className="tile" onClick={() => navigate(t.to)}>
            <span className="k"><i style={{ background: t.c }} />{t.k}</span>
            <span className="v">{t.v}</span>
            <span className="s">{t.s}</span>
          </button>
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <h2>
            Upcoming and overdue service
            <button className="aux" onClick={() => navigate('/reminders')}>All reminders</button>
          </h2>
          <div className="body flush">
            {upcoming.length === 0 ? (
              <p className="empty"><Icon name="check" />Nothing due in the next 45 days.</p>
            ) : (
              <div className="rows">
                {upcoming.map(({ e, d }) => (
                  <button key={e.id} className="row" onClick={() => navigate(`/e/${e.id}`)}>
                    <StatusPill equipment={e} dotOnly />
                    <span className="grow">
                      <span className="t"><span className="eid">{e.id}</span>{e.name}</span>
                      <span className="sub">{where(e)}</span>
                    </span>
                    <span className={`when ${d < 0 ? 'late' : ''}`}>{relative(e.nextServiceDate)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Fleet status</h2>
          <div className="body">
            <div className="bars">
              {STATUS_ORDER.filter(([k]) => counts[k]).map(([k, label, colour]) => (
                <div className="bar" key={k}>
                  <span className="lab">{label}</span>
                  <span className="track">
                    <span className="fill" style={{ width: `${Math.round((counts[k] / max) * 100)}%`, background: colour }} />
                  </span>
                  <span className="val">{counts[k]}</span>
                </div>
              ))}
            </div>

            <h3 style={{
              fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '.05em',
              textTransform: 'uppercase', color: 'var(--ink-3)',
              marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)'
            }}>
              Recent activity
            </h3>
            {recent.length === 0 ? (
              <p className="empty">No service records yet.</p>
            ) : (
              <div className="rows">
                {recent.map((r) => (
                  <button key={r.id} className="row" style={{ paddingLeft: 0, paddingRight: 0 }} onClick={() => navigate(`/e/${r.equipmentId}`)}>
                    <Icon name={r.result === 'Failed' ? 'alert' : 'check'} size={16} />
                    <span className="grow">
                      <span className="t" style={{ fontSize: 13 }}>
                        <span className="eid">{r.equipmentId}</span>{r.type} — {r.result}
                      </span>
                      <span className="sub">{r.engineer}</span>
                    </span>
                    <span className="when">{fmtShort(r.date)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
