import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { CATEGORIES } from '../data/seed.js'
import { nextEquipmentId } from '../lib/ids.js'
import { equipmentURL } from '../lib/qr.js'
import { addMonths, todayISO } from '../lib/dates.js'
import { useData, useStore } from '../lib/store.jsx'

const blank = {
  name: '', category: 'Fire Extinguisher', type: '',
  manufacturer: '', model: '', serial: '', assetTag: '',
  customerId: '', siteId: '',
  building: '', floor: '', area: '',
  installDate: '', warrantyEnd: '', expiryDate: '',
  nextServiceDate: '', remarks: ''
}

export default function EquipmentForm({ existing, onClose }) {
  const navigate = useNavigate()
  const { db, assignableSites, customer } = useData()
  const { createEquipment, updateEquipment, toast } = useStore()
  const editing = Boolean(existing)

  const [form, setForm] = useState(() => (
    editing ? { ...blank, ...existing } : { ...blank, nextServiceDate: addMonths(todayISO(), 3) }
  ))
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  // Which customers this user may file against, derived from their site scope.
  const customers = useMemo(() => {
    const ids = new Set(assignableSites.map((s) => s.customerId))
    return db.customers.filter((c) => ids.has(c.id))
  }, [db.customers, assignableSites])

  const sites = assignableSites.filter((s) => !form.customerId || s.customerId === form.customerId)
  const previewId = editing ? existing.id : nextEquipmentId(db.equipment, form.category)

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => (key === 'customerId' ? { ...f, customerId: value, siteId: '' } : { ...f, [key]: value }))
    setError('')
  }

  const save = () => {
    if (!form.name.trim()) return setError('Give the equipment a name.')
    if (!form.customerId) return setError('Choose the customer this equipment belongs to.')
    if (!form.siteId) return setError('Choose the site where it is installed.')
    if (!form.nextServiceDate) return setError('Set the first service due date.')

    const payload = { ...form, name: form.name.trim() }
    if (editing) {
      updateEquipment(existing.id, payload)
      toast(`${existing.id} updated`)
      onClose()
      return
    }
    const id = createEquipment(payload)
    setCreated(id)
  }

  if (created) {
    const url = equipmentURL(created)
    return (
      <Sheet
        title="Equipment added"
        onClose={onClose}
        footer={(
          <>
            <button className="btn" onClick={onClose}>Add another</button>
            <button
              className="btn primary"
              onClick={() => { onClose(); navigate(`/e/${created}`) }}
            >
              <Icon name="chevron" />Open record
            </button>
          </>
        )}
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          <b className="mono">{created}</b> is registered, and its QR code was generated
          automatically from the identifier.
        </p>
        <div className="label-card">
          <QRCodeCanvas value={url} size={158} level="M" marginSize={2} bgColor="#ffffff" fgColor="#141B1E" />
          <div className="lid">{created}</div>
          <div className="lnm">{form.name}</div>
          <div className="lurl">{url}</div>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Print it from the equipment record or the QR labels page, then fix it to the
          equipment. Anyone scanning it reaches this record after signing in.
        </p>
      </Sheet>
    )
  }

  return (
    <Sheet
      title={editing ? `Edit ${existing.id}` : 'Add equipment'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>
            <Icon name="check" />{editing ? 'Save changes' : 'Add equipment'}
          </button>
        </>
      )}
    >
      {!editing && (
        <p className="assigned-id">
          <Icon name="qr" />
          <span>
            Identifier <b className="mono">{previewId}</b> will be assigned, and its QR
            code generated on save.
          </span>
        </p>
      )}

      <label className="field">
        <span>Equipment name <span className="req">*</span></span>
        <input
          type="text" value={form.name} onChange={set('name')}
          placeholder="Extinguisher — Control Room A"
        />
      </label>

      <div className="grid-2">
        <label className="field">
          <span>Category <span className="req">*</span></span>
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Type or rating</span>
          <input type="text" value={form.type} onChange={set('type')} placeholder="CO₂ 6 kg" />
        </label>
        <label className="field">
          <span>Customer <span className="req">*</span></span>
          <select value={form.customerId} onChange={set('customerId')}>
            <option value="">Select…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Site <span className="req">*</span></span>
          <select value={form.siteId} onChange={set('siteId')} disabled={!form.customerId}>
            <option value="">{form.customerId ? 'Select…' : 'Choose a customer first'}</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.city}</option>)}
          </select>
        </label>
      </div>

      <details className="more" open={editing}>
        <summary>Identification and location</summary>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <label className="field">
            <span>Manufacturer</span>
            <input type="text" value={form.manufacturer} onChange={set('manufacturer')} />
          </label>
          <label className="field">
            <span>Model</span>
            <input type="text" value={form.model} onChange={set('model')} />
          </label>
          <label className="field">
            <span>Serial number</span>
            <input type="text" value={form.serial} onChange={set('serial')} />
          </label>
          <label className="field">
            <span>Customer asset tag</span>
            <input type="text" value={form.assetTag} onChange={set('assetTag')} />
          </label>
          <label className="field">
            <span>Building</span>
            <input type="text" value={form.building} onChange={set('building')} />
          </label>
          <label className="field">
            <span>Floor</span>
            <input type="text" value={form.floor} onChange={set('floor')} />
          </label>
          <label className="field">
            <span>Area</span>
            <input type="text" value={form.area} onChange={set('area')} />
          </label>
        </div>
      </details>

      <details className="more" open={editing}>
        <summary>Dates</summary>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <label className="field">
            <span>Installed</span>
            <input type="date" value={form.installDate} onChange={set('installDate')} />
          </label>
          <label className="field">
            <span>Warranty end</span>
            <input type="date" value={form.warrantyEnd} onChange={set('warrantyEnd')} />
          </label>
          <label className="field">
            <span>Expiry date</span>
            <input type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </label>
          <label className="field">
            <span>Next service due <span className="req">*</span></span>
            <input type="date" value={form.nextServiceDate} onChange={set('nextServiceDate')} />
          </label>
        </div>
      </details>

      <label className="field">
        <span>Remarks</span>
        <textarea
          value={form.remarks} onChange={set('remarks')}
          placeholder="Mounting position, access notes, anything an engineer should know."
          style={{ minHeight: 64 }}
        />
      </label>

      {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
    </Sheet>
  )
}
