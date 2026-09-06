import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { checklistFor } from '../data/seed.js'
import { addMonths, todayISO } from '../lib/dates.js'
import { downscale } from '../lib/files.js'
import { useData, useStore } from '../lib/store.jsx'

const TYPES = ['Inspection', 'Maintenance', 'Repair', 'Refill / recharge', 'Commissioning']
const RESULTS = ['Passed', 'Completed', 'In Progress', 'Failed']
const MAX_PHOTOS = 4

/** Extinguishers run on a quarterly cycle here; heavier plant on six months. */
const defaultNext = (equipment) =>
  addMonths(todayISO(), equipment.category === 'Fire Extinguisher' ? 3 : 6)

export default function ServiceForm({ equipment, onClose }) {
  const { me, addRecord, toast } = useStore()
  const { db } = useData()
  const engineers = db.users.filter((u) => u.role === 'Service Engineer')
  const items = checklistFor(equipment.category)
  const fileInput = useRef(null)

  const [form, setForm] = useState({
    date: todayISO(),
    type: 'Inspection',
    engineer: engineers.some((u) => u.name === me.name) ? me.name : engineers[0].name,
    result: 'Passed',
    remarks: '',
    nextService: defaultNext(equipment)
  })
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(items.map((i) => [i, 'pass'])))
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const failures = items.filter((i) => checks[i] === 'fail')

  const mark = (item, value) => {
    setChecks((c) => ({ ...c, [item]: value }))
    // A failed line item is the whole visit's result — keep them honest.
    if (value === 'fail') setForm((f) => ({ ...f, result: 'Failed' }))
  }

  const addPhotos = async (e) => {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length)
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    try {
      const shrunk = await Promise.all(files.map((f) => downscale(f)))
      setPhotos((p) => [...p, ...shrunk])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    if (!form.nextService) {
      setError('Set the next service date before saving.')
      return
    }
    if (form.result === 'Failed' && !form.remarks.trim()) {
      setError('A failed result needs remarks explaining what failed.')
      return
    }
    addRecord({
      id: `SR-${Date.now().toString(36).toUpperCase()}`,
      equipmentId: equipment.id,
      date: form.date,
      type: form.type,
      engineer: form.engineer,
      result: form.result,
      remarks: form.remarks.trim(),
      checklist: form.type === 'Inspection' ? checks : null,
      photos: photos.map((p) => p.dataUrl)
    }, { nextService: form.nextService })
    toast('Service record saved')
    onClose()
  }

  return (
    <Sheet
      title={`Service · ${equipment.id}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy}>
            <Icon name="check" />Save record
          </button>
        </>
      )}
    >
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {equipment.name} — {equipment.category}
      </p>

      <div className="grid-2">
        <label className="field">
          <span>Date</span>
          <input type="date" value={form.date} onChange={set('date')} />
        </label>
        <label className="field">
          <span>Type of visit</span>
          <select value={form.type} onChange={set('type')}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Engineer</span>
          <select value={form.engineer} onChange={set('engineer')}>
            {engineers.map((u) => <option key={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Result</span>
          <select value={form.result} onChange={set('result')}>
            {RESULTS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
      </div>

      {form.type === 'Inspection' && (
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
            {items.length}-point checklist
            {failures.length > 0 && (
              <span style={{ color: 'var(--crit)' }}> · {failures.length} failed</span>
            )}
          </span>
          <div className="checklist" style={{ marginTop: 8 }}>
            {items.map((item) => (
              <div className="check-row" key={item}>
                <span>{item}</span>
                <span className="seg">
                  {['pass', 'fail', 'na'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      data-v={v}
                      aria-pressed={checks[item] === v}
                      aria-label={`${item}: ${v === 'na' ? 'not applicable' : v}`}
                      onClick={() => mark(item, v)}
                    >
                      {v === 'na' ? 'N/A' : v === 'pass' ? 'Pass' : 'Fail'}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="field">
        <span>
          Remarks {form.result === 'Failed' && <span className="req">*</span>}
        </span>
        <textarea
          value={form.remarks}
          onChange={set('remarks')}
          placeholder="Findings, parts used, actions taken…"
        />
      </label>

      <div className="field">
        <span>Photos ({photos.length}/{MAX_PHOTOS})</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={addPhotos}
        />
        <button
          className="btn"
          onClick={() => fileInput.current?.click()}
          disabled={busy || photos.length >= MAX_PHOTOS}
        >
          <Icon name="camera" />
          {busy ? 'Processing…' : photos.length ? 'Add another photo' : 'Take or choose a photo'}
        </button>
        {photos.length > 0 && (
          <div className="thumbs">
            {photos.map((p, i) => (
              <img key={p.name + i} src={p.dataUrl} alt={`Evidence photo ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      <label className="field">
        <span>Next service date <span className="req">*</span></span>
        <input type="date" value={form.nextService} onChange={set('nextService')} />
      </label>

      {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
    </Sheet>
  )
}
