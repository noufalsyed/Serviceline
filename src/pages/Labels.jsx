import { useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Icon from '../components/Icon.jsx'
import { useData, useStore } from '../lib/store.jsx'
import { equipmentURL } from '../lib/qr.js'

/**
 * Batch label sheet — what you actually need when commissioning a site:
 * filter to one site, print the page, stick the labels on.
 */
export default function Labels() {
  const { db, myEquipment, customer, site } = useData()
  const { log } = useStore()
  const [siteId, setSiteId] = useState('')

  const siteOptions = db.sites.filter((s) => myEquipment.some((e) => e.siteId === s.id))
  const items = useMemo(
    () => myEquipment.filter((e) => !siteId || e.siteId === siteId),
    [myEquipment, siteId]
  )

  const print = () => {
    log('QR labels printed', siteId || 'all sites', `${items.length} labels`)
    window.print()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>QR labels</h1>
          <p>{items.length} label{items.length === 1 ? '' : 's'} ready to print</p>
        </div>
        <button className="btn primary no-print" onClick={print}>
          <Icon name="printer" />Print sheet
        </button>
      </div>

      <div className="filters no-print">
        <select value={siteId} onChange={(e) => setSiteId(e.target.value)} aria-label="Filter by site">
          <option value="">All sites in scope</option>
          {siteOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {customer(s.customerId)?.name} — {s.name}
            </option>
          ))}
        </select>
      </div>

      <p className="muted no-print" style={{ fontSize: 12.5, margin: '0 0 16px' }}>
        Each code resolves to this deployment, so a label printed from the live site opens the
        live record. Print at 50 × 70 mm on weatherproof stock.
      </p>

      {items.length === 0 ? (
        <section className="panel"><p className="empty">No equipment at that site.</p></section>
      ) : (
        <div className="label-grid">
          {items.map((e) => (
            <div className="label-tile" key={e.id}>
              <QRCodeCanvas value={equipmentURL(e.id)} size={116} level="M" marginSize={2} bgColor="#ffffff" fgColor="#141B1E" />
              <div className="lid">{e.id}</div>
              <div className="lnm">{e.name}</div>
              <div className="lnm" style={{ color: '#8E9B9F' }}>{site(e.siteId)?.name}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
