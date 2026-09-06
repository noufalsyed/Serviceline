import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Pill } from '../components/Pill.jsx'
import { useData } from '../lib/store.jsx'
import { fmt } from '../lib/dates.js'

export default function Requests() {
  const navigate = useNavigate()
  const { myRequests, equipment, where } = useData()
  const open = myRequests.filter((r) => r.status === 'Open').length

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Service requests</h1>
          <p>Raised by client users · {open} open</p>
        </div>
      </div>

      <section className="panel">
        <div className="body flush">
          {myRequests.length === 0 ? (
            <p className="empty"><Icon name="list" />No service requests have been raised.</p>
          ) : (
            <div className="rows">
              {myRequests.map((r) => {
                const e = equipment(r.equipmentId)
                return (
                  <button className="row" key={r.id} onClick={() => navigate(`/e/${r.equipmentId}`)}>
                    <Pill tone={r.status === 'Open' ? 'due' : 'ok'}>{r.status}</Pill>
                    <span className="grow">
                      <span className="t"><span className="eid">{r.equipmentId}</span>{e?.name}</span>
                      <span className="sub">{r.by} — {r.note}</span>
                    </span>
                    <span className="when">{fmt(r.date)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        A request closes automatically when an engineer files a completed service record
        against the same equipment. Requests raised here are visible to the client who
        raised them and to anyone servicing that site.
      </p>
    </>
  )
}
