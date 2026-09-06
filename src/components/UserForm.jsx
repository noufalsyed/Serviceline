import { useState } from 'react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { PERMISSIONS, ROLES, ROLE_DEFAULTS } from '../lib/permissions.js'
import { suggestLogin } from '../lib/ids.js'
import { useStore } from '../lib/store.jsx'

const scopeKind = (u) => (u?.scopeCustomer ? 'customer' : u?.scopeSites?.length ? 'sites' : 'all')

export default function UserForm({ existing, onClose }) {
  const { db, createUser, updateUser, toast } = useStore()
  const editing = Boolean(existing)

  const [form, setForm] = useState(() => ({
    name: existing?.name || '',
    login: existing?.login || '',
    role: existing?.role || 'Service Engineer',
    scope: scopeKind(existing),
    scopeCustomer: existing?.scopeCustomer || '',
    scopeSites: existing?.scopeSites || []
  }))
  const [custom, setCustom] = useState(Array.isArray(existing?.permissions))
  const [permissions, setPermissions] = useState(
    () => existing?.permissions || ROLE_DEFAULTS[existing?.role || 'Service Engineer']
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [key]: value }
      // Keep the login suggestion in step with the name until it is edited.
      if (key === 'name' && !editing && (!f.login || f.login === suggestLogin(f.name, db.users))) {
        next.login = suggestLogin(value, db.users)
      }
      return next
    })
    if (key === 'role' && !custom) setPermissions(ROLE_DEFAULTS[value])
    setError('')
  }

  const togglePermission = (key) => {
    setCustom(true)
    setPermissions((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))
  }

  const toggleSite = (id) => {
    setForm((f) => ({
      ...f,
      scopeSites: f.scopeSites.includes(id)
        ? f.scopeSites.filter((s) => s !== id)
        : [...f.scopeSites, id]
    }))
  }

  const resetToRole = () => {
    setCustom(false)
    setPermissions(ROLE_DEFAULTS[form.role])
  }

  const save = async () => {
    if (!form.name.trim()) return setError('Enter the person’s name.')
    if (!/^[a-z0-9._-]{3,}$/i.test(form.login)) {
      return setError('User ID must be at least 3 characters: letters, numbers, dot, dash or underscore.')
    }
    if (form.scope === 'customer' && !form.scopeCustomer) return setError('Choose the customer to scope this account to.')
    if (form.scope === 'sites' && !form.scopeSites.length) return setError('Select at least one site.')

    const payload = {
      name: form.name.trim(),
      login: form.login.trim().toLowerCase(),
      role: form.role,
      permissions: custom ? permissions : null,
      scopeCustomer: form.scope === 'customer' ? form.scopeCustomer : null,
      scopeSites: form.scope === 'sites' ? form.scopeSites : null
    }

    setBusy(true)
    try {
      if (editing) {
        updateUser(existing.id, payload)
        toast('Account updated')
      } else {
        const result = await createUser(payload, password)
        if (!result.ok) { setError(result.error); return }
        toast(`Account ${payload.login} created`)
      }
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const groups = [...new Set(PERMISSIONS.map((p) => p.group))]
  const sitesOf = (customerId) => db.sites.filter((s) => s.customerId === customerId)

  return (
    <Sheet
      title={editing ? `Edit ${existing.login}` : 'Create user account'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>
            <Icon name="check" />{busy ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
          </button>
        </>
      )}
    >
      <div className="grid-2">
        <label className="field">
          <span>Full name <span className="req">*</span></span>
          <input type="text" value={form.name} onChange={set('name')} placeholder="Ahmed Al-Otaibi" />
        </label>
        <label className="field">
          <span>User ID <span className="req">*</span></span>
          <input
            type="text" value={form.login} onChange={set('login')}
            placeholder="ahmed.a" autoCapitalize="none" spellCheck="false"
            disabled={editing}
          />
        </label>
      </div>

      {!editing && (
        <label className="field">
          <span>Initial password <span className="req">*</span></span>
          <input
            type="text" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
            placeholder="At least 8 characters, with a number"
            autoComplete="new-password"
          />
          <span className="muted" style={{ fontSize: 11.5 }}>
            Give this to the user privately. They will be prompted to change it.
          </span>
        </label>
      )}

      <label className="field">
        <span>Role</span>
        <select value={form.role} onChange={set('role')}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>

      <div className="field">
        <span>Data the account can see</span>
        <div className="radio-row">
          {[
            ['all', 'All customers'],
            ['customer', 'One customer'],
            ['sites', 'Selected sites']
          ].map(([value, label]) => (
            <label key={value} className={`radio-chip ${form.scope === value ? 'on' : ''}`}>
              <input
                type="radio" name="scope" value={value}
                checked={form.scope === value}
                onChange={() => setForm((f) => ({ ...f, scope: value }))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {form.scope === 'customer' && (
        <label className="field">
          <span>Customer</span>
          <select value={form.scopeCustomer} onChange={set('scopeCustomer')}>
            <option value="">Select…</option>
            {db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}

      {form.scope === 'sites' && (
        <div className="field">
          <span>Assigned sites</span>
          <div className="check-list">
            {db.customers.map((c) => (
              <div key={c.id}>
                <b className="check-list-head">{c.name}</b>
                {sitesOf(c.id).map((s) => (
                  <label key={s.id} className="check-item">
                    <input
                      type="checkbox"
                      checked={form.scopeSites.includes(s.id)}
                      onChange={() => toggleSite(s.id)}
                    />
                    {s.name} <span className="muted">· {s.city}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          What the account can do
          {custom && (
            <button className="btn small ghost" onClick={resetToRole}>
              <Icon name="refresh" />Reset to {form.role} defaults
            </button>
          )}
        </span>
        <div className="check-list">
          {groups.map((group) => (
            <div key={group}>
              <b className="check-list-head">{group}</b>
              {PERMISSIONS.filter((p) => p.group === group).map((p) => (
                <label key={p.key} className="check-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 11.5 }}>
          {custom
            ? 'Customised for this account — role defaults no longer apply.'
            : `Using the ${form.role} defaults. Tick or untick anything to customise.`}
        </span>
      </div>

      {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
    </Sheet>
  )
}
