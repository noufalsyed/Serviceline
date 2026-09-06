import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import ServiceForm from '../components/ServiceForm.jsx'
import LabelSheet from '../components/LabelSheet.jsx'
import { StatusPill, Pill } from '../components/Pill.jsx'
import { useData, useStore } from '../lib/store.jsx'
import { equipmentURL } from '../lib/qr.js'
import { fmt, relative, daysUntil } from '../lib/dates.js'

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { equipment, customer, site, inScope, can, recordsFor, requestsFor, where } = useData()
  const { addRequest, toast } = useStore()

  const [sheet, setSheet] = useState(null) // 'service' | 'label' | 'request'
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')

  const e = equipment(id)

  if (!e) {
    return (
      <section className="panel">
        <p className="empty">
          <Icon name="search" />
          No equipment is registered against <b className="mono">{id}</b>.
          <br />That label may belong to another system, or the item has been removed.
        </p>
        <p style={{ textAlign: 'center', paddingBottom: 24 }}>
          <button className="btn" onClick={() => navigate('/scan')}><Icon name="qr" />Scan again</button>
        </p>
      </section>
    )
  }

  if (!can('viewAll') && !inScope(e)) {
    return (
      <>
        <div className="page-head"><h1>Access restricted</h1></div>
        <section className="panel">
          <p className="empty">
            <Icon name="shield" />
            <b className="mono">{e.id}</b> belongs to a customer or site outside your authorization.
            <br />Scanning a label identifies equipment; it never grants access to its records.
          </p>
        </section>
      </>
    )
  }

  const records = recordsFor(e.id)
  const requests = requestsFor(e.id)
  const url = equipmentURL(e.id)
  const overdue = daysUntil(e.nextServiceDate) < 0

  const spec = [
    ['Category', e.category], ['Type', e.type],
    ['Manufacturer', e.manufacturer], ['Model', e.model],
    ['Serial number', e.serial], ['Asset / tag no.', e.assetTag],
    ['Customer', customer(e.customerId)?.name],
    ['Site', site(e.siteId) ? `${site(e.siteId).name} · ${site(e.siteId).city}` : ''],
    ['Building', e.building], ['Floor', e.floor], ['Area', e.area],
    ['Installed', fmt(e.installDate)], ['Warranty end', fmt(e.warrantyEnd)],
    ['Expiry date', fmt(e.expiryDate)],
    ['Last service', fmt(e.lastServiceDate)], ['Next service', fmt(e.nextServiceDate)],
    ['Last inspection', fmt(e.lastInspectionDate)], ['Next inspection', fmt(e.nextInspectionDate)]
  ]

  const submitRequest = () => {
    if (!note.trim()) { setNoteError('Describe what needs attention before submitting.'); return }
    addRequest(e.id, note.trim())
    toast('Service request submitted')
    setNote(''); setNoteError(''); setSheet(null)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22 }}>{e.name}</h1>
            <StatusPill equipment={e} />
          </div>
          <p>
            <span className="eid">{e.id}</span> · {where(e)}
            {e.area ? ` · ${e.area}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {can('service') && (
            <button className="btn primary" onClick={() => setSheet('service')}>
              <Icon name="wrench" />Add service
            </button>
          )}
          {can('request') && (
            <button className="btn" onClick={() => setSheet('request')}>
              <Icon name="send" />Request service
            </button>
          )}
        </div>
      </div>

      <div className="detail-top">
        <section className="panel">
          <h2>Equipment information</h2>
          <div className="body">
            <dl className="spec">
              {spec.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v || '—'}</dd>
                </div>
              ))}
            </dl>
            {e.remarks && <p className="tl-note" style={{ marginBottom: 0 }}>{e.remarks}</p>}
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="qr-card">
            <div className="qr-plate">
              <QRCodeCanvas value={url} size={148} level="M" marginSize={2} bgColor="#ffffff" fgColor="#141B1E" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 10 }} className="mono">{e.id}</div>
            <div className="qr-url">{url}</div>
            {can('labels') && (
              <button className="btn small block" style={{ marginTop: 10 }} onClick={() => setSheet('label')}>
                <Icon name="printer" />Label and print
              </button>
            )}
          </div>

          <div className="tile" style={{ cursor: 'default' }}>
            <span className="k"><i style={{ background: overdue ? 'var(--crit)' : 'var(--warn)' }} />Next service</span>
            <span style={{ fontWeight: 600, fontSize: 15, marginTop: 6, display: 'block' }} className="num">
              {fmt(e.nextServiceDate)}
            </span>
            <span className="s" style={{ color: overdue ? 'var(--crit)' : undefined, fontWeight: overdue ? 600 : 400 }}>
              {relative(e.nextServiceDate)}
            </span>
          </div>
        </div>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>
          Service and inspection history
          <span className="aux">{records.length} record{records.length === 1 ? '' : 's'}</span>
        </h2>
        <div className="body">
          {records.length === 0 ? (
            <p className="empty"><Icon name="clock" />No service history recorded yet.</p>
          ) : (
            <div className="timeline">
              {records.map((r) => {
                const tone = ['Passed', 'Completed'].includes(r.result) ? 'pass'
                  : r.result === 'Failed' ? 'fail' : ''
                const failed = r.checklist
                  ? Object.keys(r.checklist).filter((k) => r.checklist[k] === 'fail')
                  : []
                return (
                  <article className={`tl-item ${tone}`} key={r.id}>
                    <div className="tl-head">
                      <b>{r.type}</b>
                      <Pill tone={tone === 'fail' ? 'over' : 'flat'}>{r.result}</Pill>
                      <span className="date">{fmt(r.date)}</span>
                    </div>
                    <div className="tl-meta">Engineer: {r.engineer}</div>
                    {r.remarks && <p className="tl-note">{r.remarks}</p>}
                    {r.checklist && (
                      <div className="chips">
                        <span className="chip">
                          <Icon name="check" />{Object.keys(r.checklist).length}-point checklist
                        </span>
                        {failed.length > 0
                          ? <span className="chip bad">{failed.length} failed: {failed.join(', ')}</span>
                          : <span className="chip good">All points passed</span>}
                      </div>
                    )}
                    {r.photos?.length > 0 && (
                      <div className="thumbs">
                        {r.photos.map((src, i) => (
                          <img key={i} src={src} alt={`${r.type} on ${fmt(r.date)}, photo ${i + 1}`} />
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {requests.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>Service requests</h2>
          <div className="body flush">
            <div className="rows">
              {requests.map((r) => (
                <div className="row" key={r.id} style={{ cursor: 'default' }}>
                  <Pill tone={r.status === 'Open' ? 'due' : 'ok'}>{r.status}</Pill>
                  <span className="grow">
                    <span className="t" style={{ fontSize: 13.5, fontWeight: 500 }}>{r.note}</span>
                    <span className="sub">Raised by {r.by}</span>
                  </span>
                  <span className="when">{fmt(r.date)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {sheet === 'service' && <ServiceForm equipment={e} onClose={() => setSheet(null)} />}
      {sheet === 'label' && <LabelSheet equipment={e} onClose={() => setSheet(null)} />}
      {sheet === 'request' && (
        <Sheet
          title={`Request service · ${e.id}`}
          onClose={() => setSheet(null)}
          footer={(
            <>
              <button className="btn" onClick={() => setSheet(null)}>Cancel</button>
              <button className="btn primary" onClick={submitRequest}><Icon name="send" />Submit</button>
            </>
          )}
        >
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{e.name} — {where(e)}</p>
          <label className="field">
            <span>What needs attention? <span className="req">*</span></span>
            <textarea
              value={note}
              onChange={(ev) => { setNote(ev.target.value); setNoteError('') }}
              placeholder="Describe the fault or the service you need…"
            />
          </label>
          {noteError && <p className="field-error" style={{ margin: 0 }}>{noteError}</p>}
        </Sheet>
      )}
    </>
  )
}
