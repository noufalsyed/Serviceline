import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { StatusPill } from '../components/Pill.jsx'
import { useData } from '../lib/store.jsx'
import { buckets } from '../lib/status.js'
import { fmtShort, relative, daysUntil } from '../lib/dates.js'

const GROUPS = [
  { key: 'overdue', title: 'Overdue', icon: 'alert', colour: 'var(--crit)' },
  { key: 'today', title: 'Due today', icon: 'clock', colour: 'var(--warn)' },
  { key: 'week', title: 'Next 7 days', icon: 'clock', colour: 'var(--warn)' },
  { key: 'expiring', title: 'Expiring within 30 days', icon: 'file', colour: 'var(--accent)', by: 'expiry' },
  { key: 'month', title: 'Next 8 to 30 days', icon: 'clock', colour: 'var(--steel)' },
  { key: 'quarter', title: '31 to 90 days', icon: 'clock', colour: 'var(--ink-3)' }
]

export default function Reminders() {
  const navigate = useNavigate()
  const { myEquipment, where, scopeLabel } = useData()
  const b = buckets(myEquipment)

  return (
    <>
      <p className="scope-chip"><Icon name="shield" />{scopeLabel()}</p>

      <div className="page-head">
        <div>
          <h1>Reminders and alerts</h1>
          <p>Service, inspection and expiry monitoring across your scope</p>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12.5, margin: '-6px 0 16px' }}>
        Notifications go out in-app and by email at 90, 60, 30, 7 and 1 day before a due date,
        then daily once overdue. SMS and WhatsApp channels can be added later.
      </p>

      {b.attention === 0 && b.month.length === 0 && b.quarter.length === 0 ? (
        <section className="panel">
          <p className="empty"><Icon name="check" />Nothing needs attention in your scope right now.</p>
        </section>
      ) : GROUPS.map(({ key, title, icon, colour, by }) => {
        const items = b[key]
        if (!items.length) return null
        return (
          <section className="panel bucket" key={key}>
            <h2>
              <span className="bucket-title" style={{ color: colour }}>
                <Icon name={icon} />{title}
              </span>
              <span className="aux num">{items.length}</span>
            </h2>
            <div className="body flush">
              <div className="rows">
                {items.map((e) => (
                  <button className="row" key={e.id} onClick={() => navigate(`/e/${e.id}`)}>
                    <StatusPill equipment={e} dotOnly />
                    <span className="grow">
                      <span className="t"><span className="eid">{e.id}</span>{e.name}</span>
                      <span className="sub">{where(e)}{e.area ? ` · ${e.area}` : ''}</span>
                    </span>
                    <span className={`when ${daysUntil(e.nextServiceDate) < 0 ? 'late' : ''}`}>
                      {by === 'expiry'
                        ? `expires ${fmtShort(e.expiryDate)}`
                        : relative(e.nextServiceDate)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
