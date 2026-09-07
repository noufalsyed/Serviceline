import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { PERMISSIONS } from '../lib/permissions.js'
import { useData, useStore } from '../lib/store.jsx'

export default function Account() {
  const { me, permissions, scopeLabel } = useData()
  const { changePassword, signOut, toast } = useStore()

  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.next !== form.confirm) { setError('The two new passwords do not match.'); return }
    setBusy(true)
    try {
      const result = await changePassword(form.current, form.next)
      if (!result.ok) { setError(result.error); return }
      setForm({ current: '', next: '', confirm: '' })
      toast('Password changed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your account</h1>
          <p>{me.name} · <span className="mono">{me.login}</span></p>
        </div>
        <button className="btn" onClick={signOut}>
          <Icon name="logout" />Sign out
        </button>
      </div>

      {me.mustChangePassword && (
        <p className="banner warn">
          <Icon name="alert" />
          <span>
            This account is still using the password an administrator issued. Change it below.
          </span>
        </p>
      )}

      <div className="split">
        <section className="panel">
          <h2>Change password</h2>
          <div className="body">
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <label className="field">
                <span>Current password</span>
                <input type="password" value={form.current} onChange={set('current')} autoComplete="current-password" />
              </label>
              <label className="field">
                <span>New password</span>
                <input type="password" value={form.next} onChange={set('next')} autoComplete="new-password" />
                <span className="muted" style={{ fontSize: 11.5 }}>
                  At least 8 characters, including a letter and a number.
                </span>
              </label>
              <label className="field">
                <span>Confirm new password</span>
                <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
              </label>
              {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
              <button className="btn primary" type="submit" disabled={busy}>
                <Icon name="key" />{busy ? 'Saving…' : 'Change password'}
              </button>
            </form>
          </div>
        </section>

        <section className="panel">
          <h2>Access <span className="aux">{me.role}</span></h2>
          <div className="body">
            <p className="scope-chip" style={{ marginBottom: 14 }}>
              <Icon name="shield" />{scopeLabel()}
            </p>
            <ul className="permission-list">
              {PERMISSIONS.map((p) => {
                const granted = permissions.includes(p.key)
                return (
                  <li key={p.key} className={granted ? 'yes' : 'no'}>
                    <Icon name={granted ? 'check' : 'close'} />
                    {p.label}
                  </li>
                )
              })}
            </ul>
            <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              Only an administrator can change what your account may do. Ask one if
              something you need is missing.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
