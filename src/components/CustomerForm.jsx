import { useState } from 'react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { useStore } from '../lib/store.jsx'

export function CustomerForm({ existing, onClose }) {
  const { createCustomer, updateCustomer, toast } = useStore()
  const [form, setForm] = useState(existing || { name: '', contact: '', phone: '' })
  const [error, setError] = useState('')

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const save = () => {
    if (!form.name.trim()) return setError('Enter the customer name.')
    if (existing) {
      updateCustomer(existing.id, { ...form, name: form.name.trim() })
      toast('Customer updated')
    } else {
      createCustomer({ ...form, name: form.name.trim() })
      toast('Customer added')
    }
    onClose()
  }

  return (
    <Sheet
      title={existing ? 'Edit customer' : 'Add customer'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}><Icon name="check" />Save</button>
        </>
      )}
    >
      <label className="field">
        <span>Customer name <span className="req">*</span></span>
        <input type="text" value={form.name} onChange={set('name')} placeholder="Al-Rajhi Industrial" />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Contact person</span>
          <input type="text" value={form.contact} onChange={set('contact')} placeholder="Khalid Al-Rajhi" />
        </label>
        <label className="field">
          <span>Telephone</span>
          <input type="text" value={form.phone} onChange={set('phone')} placeholder="+966 13 800 1200" />
        </label>
      </div>
      {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Add the customer first, then its sites. Equipment is filed against a site, which
        keeps customer, site and equipment records separate but linked.
      </p>
    </Sheet>
  )
}

export function SiteForm({ customerId, existing, onClose }) {
  const { db } = useStore()
  const { createSite, updateSite, toast } = useStore()
  const [form, setForm] = useState(existing || { name: '', city: '', customerId })
  const [error, setError] = useState('')

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const save = () => {
    if (!form.name.trim()) return setError('Enter the site name.')
    if (!form.customerId) return setError('Choose the customer this site belongs to.')
    if (existing) {
      updateSite(existing.id, { ...form, name: form.name.trim() })
      toast('Site updated')
    } else {
      createSite({ ...form, name: form.name.trim() })
      toast('Site added')
    }
    onClose()
  }

  return (
    <Sheet
      title={existing ? 'Edit site' : 'Add site'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}><Icon name="check" />Save</button>
        </>
      )}
    >
      <label className="field">
        <span>Customer <span className="req">*</span></span>
        <select value={form.customerId} onChange={set('customerId')}>
          <option value="">Select…</option>
          {db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Site name <span className="req">*</span></span>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Dammam Plant" />
        </label>
        <label className="field">
          <span>City</span>
          <input type="text" value={form.city} onChange={set('city')} placeholder="Dammam" />
        </label>
      </div>
      {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
    </Sheet>
  )
}
