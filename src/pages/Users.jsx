import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import Confirm from '../components/Confirm.jsx'
import UserForm from '../components/UserForm.jsx'
import { Pill } from '../components/Pill.jsx'
import { useData, useStore } from '../lib/store.jsx'
import { effectivePermissions, isCustomised, describeScope } from '../lib/permissions.js'

export default function Users() {
  const { db, me, customer } = useData()
  const { updateUser, setUserPassword, deleteUser, toast } = useStore()
  const [editing, setEditing] = useState(null)   // user object or 'new'
  const [resetting, setResetting] = useState(null)
  const [removing, setRemoving] = useState(null)

  const active = db.users.filter((u) => u.active !== false).length

  const toggleActive = (u) => {
    if (u.id === me.id) { toast('You cannot disable your own account', 'warn'); return }
    const admins = db.users.filter((x) => x.role === 'Administrator' && x.active !== false)
    if (u.active !== false && u.role === 'Administrator' && admins.length <= 1) {
      toast('That is the only active administrator', 'warn')
      return
    }
    updateUser(u.id, { active: u.active === false })
    toast(u.active === false ? `${u.login} enabled` : `${u.login} disabled`)
  }

  const remove = (u) => {
    const result = deleteUser(u.id)
    if (!result.ok) toast(result.error, 'warn')
    else toast(`${u.login} deleted`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>User accounts</h1>
          <p>{db.users.length} accounts · {active} active</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}>
          <Icon name="plus" />Create account
        </button>
      </div>

      <section className="panel">
        <div className="body flush">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>User ID</th><th>Name</th><th>Role</th><th>Data scope</th>
                  <th>Permissions</th><th>Status</th><th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {db.users.map((u) => {
                  const disabled = u.active === false
                  return (
                    <tr key={u.id} className={disabled ? 'dimmed' : undefined}>
                      <td><span className="eid">{u.login}</span></td>
                      <td>
                        <b style={{ fontWeight: 600 }}>{u.name}</b>
                        {u.id === me.id && <span className="muted"> · you</span>}
                      </td>
                      <td>{u.role}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>
                        {describeScope(u, customer(u.scopeCustomer)?.name).replace('Scoped to ', '')}
                      </td>
                      <td>
                        {isCustomised(u)
                          ? <Pill tone="exp">{effectivePermissions(u).length} custom</Pill>
                          : <span className="muted" style={{ fontSize: 12.5 }}>Role defaults</span>}
                      </td>
                      <td>
                        {disabled
                          ? <Pill tone="over">Disabled</Pill>
                          : <Pill tone="ok">Active</Pill>}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn" title="Edit account" aria-label={`Edit ${u.login}`} onClick={() => setEditing(u)}>
                            <Icon name="edit" />
                          </button>
                          <button className="icon-btn" title="Reset password" aria-label={`Reset password for ${u.login}`} onClick={() => setResetting(u)}>
                            <Icon name="key" />
                          </button>
                          <button
                            className="icon-btn" title={disabled ? 'Enable account' : 'Disable account'}
                            aria-label={disabled ? `Enable ${u.login}` : `Disable ${u.login}`}
                            onClick={() => toggleActive(u)}
                          >
                            <Icon name={disabled ? 'check' : 'ban'} />
                          </button>
                          <button className="icon-btn danger" title="Delete account" aria-label={`Delete ${u.login}`} onClick={() => setRemoving(u)}>
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        Individual accounts rather than a shared engineer login are what make the audit
        trail worth keeping: every service record, edit and export is attributed to the
        person who performed it. Disabling an account preserves that history; deleting one
        does not remove the records they created.
      </p>

      {editing && (
        <UserForm
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {resetting && (
        <ResetPassword
          user={resetting}
          onClose={() => setResetting(null)}
          onSave={setUserPassword}
          toast={toast}
        />
      )}

      {removing && (
        <Confirm
          title={`Delete ${removing.login}?`}
          body={`${removing.name}'s account will be removed. Service records they filed stay in the system, attributed to their name. This cannot be undone.`}
          confirmLabel="Delete account"
          onConfirm={() => remove(removing)}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}

function ResetPassword({ user, onClose, onSave, toast }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const result = await onSave(user.id, password)
      if (!result.ok) { setError(result.error); return }
      toast(`Password reset for ${user.login}`)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={`Reset password · ${user.login}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>
            <Icon name="key" />{busy ? 'Saving…' : 'Set password'}
          </button>
        </>
      )}
    >
      <label className="field">
        <span>New password <span className="req">*</span></span>
        <input
          type="text" value={password} autoComplete="new-password"
          placeholder="At least 8 characters, with a number"
          onChange={(e) => { setPassword(e.target.value); setError('') }}
        />
      </label>
      {error && <p className="field-error" style={{ margin: 0 }}>{error}</p>}
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Give this to {user.name} privately. They will be asked to change it after signing in.
        The reset is recorded in the audit trail against your account.
      </p>
    </Sheet>
  )
}
