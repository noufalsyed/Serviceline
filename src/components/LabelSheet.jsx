import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { equipmentURL } from '../lib/qr.js'
import { download, labelPNG } from '../lib/files.js'
import { useData, useStore } from '../lib/store.jsx'

export default function LabelSheet({ equipment, onClose }) {
  const { customer, site, where } = useData()
  const { log, toast } = useStore()
  const plate = useRef(null)
  const [busy, setBusy] = useState(false)
  const url = equipmentURL(equipment.id)

  const savePNG = async () => {
    setBusy(true)
    try {
      const canvas = plate.current?.querySelector('canvas')
      const blob = await labelPNG(canvas, {
        id: equipment.id,
        name: equipment.name,
        customer: customer(equipment.customerId)?.name,
        url
      })
      if (!blob) throw new Error('empty')
      download(`qr-label-${equipment.id}.png`, blob)
      log('QR label generated', equipment.id, 'PNG label downloaded')
      toast('Label downloaded')
    } catch {
      toast('The label could not be generated', 'warn')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={`QR label · ${equipment.id}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={savePNG} disabled={busy}>
            <Icon name="download" />{busy ? 'Preparing…' : 'Download PNG'}
          </button>
        </>
      )}
    >
      <div className="label-card" ref={plate}>
        <QRCodeCanvas value={url} size={170} level="M" marginSize={2} bgColor="#ffffff" fgColor="#141B1E" />
        <div className="lid">{equipment.id}</div>
        <div className="lnm">{equipment.name}</div>
        <div className="lco">{where(equipment)}</div>
        <div className="lurl">{url}</div>
      </div>

      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Print at 50 × 70 mm on weatherproof label stock and fix it where an engineer can
        reach it without moving the equipment. The code carries the identifier only —
        {' '}<b>{site(equipment.siteId)?.name}</b> service history is served from the database
        after sign-in and a permission check.
      </p>
    </Sheet>
  )
}
