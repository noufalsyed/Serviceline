import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { DEMO_PASSWORDS } from '../data/seed.js'
import { cryptoAvailable } from '../lib/crypto.js'
import { useStore } from '../lib/store.jsx'

export default function Login() {
  const { db, signIn } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)

  // Set when the router bounced a deep link here — someone scanned a label
  // while signed out. After sign-in we hand them straight to it.
  const from = location.state?.from
  const target = from?.pathname?.match(/^\/e\/(.+)$/)?.[1]

  const secure = cryptoAvailable()

  const submit = async (e) => {
    e.preventDefault()
    if (!login.trim() || !password) {
      setError('Enter your user ID and password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await signIn(login, password)
      if (!result.ok) { setError(result.error); return }
      navigate(from?.pathname ? from.pathname + (from.search || '') : '/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const fill = (id) => {
    setLogin(id)
    setPassword(DEMO_PASSWORDS[id] || '')
    setError('')
    setShowAccounts(false)
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="mark"><Icon name="qr" /></div>
        <h1>Serviceline</h1>
        <p>Sign in with the account issued to you. Every action is recorded against it.</p>

        {target && (
          <p className="gate-target">
            <Icon name="qr" />
            <span>Scanned <b className="mono">{target}</b> — sign in to continue to that equipment.</span>
          </p>
        )}

        {!secure && (
          <p className="gate-warning">
            <Icon name="alert" />
            <span>
              This page is not on a secure connection, so password checking is unavailable.
              Open it over <b>https</b> or on <b>localhost</b>.
            </span>
          </p>
        )}

        <form onSubmit={submit}>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>User ID</span>
            <input
              type="text" value={login} autoCapitalize="none" spellCheck="false"
              autoComplete="username" placeholder="ahmed.a"
              onChange={(e) => { setLogin(e.target.value); setError('') }}
            />
          </label>

          <label className="field" style={{ marginBottom: 16 }}>
            <span>Password</span>
            <span className="password-wrap">
              <input
                type={reveal ? 'text' : 'password'} value={password}
                autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); setError('') }}
              />
              <button
                type="button" className="reveal" onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {error && <p className="field-error" style={{ marginTop: -6, marginBottom: 12 }}>{error}</p>}

          <button className="btn primary block" type="submit" disabled={busy || !secure}>
            <Icon name="logout" />{busy ? 'Checking…' : 'Sign in'}
          </button>
        </form>

        <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setShowAccounts((s) => !s)}>
          <Icon name={showAccounts ? 'close' : 'user'} />
          {showAccounts ? 'Hide demo accounts' : 'Show demo accounts'}
        </button>

        {showAccounts && (
          <div className="demo-list">
            {db.users.filter((u) => DEMO_PASSWORDS[u.login]).map((u) => (
              <button key={u.id} className="demo-row" onClick={() => fill(u.login)} type="button">
                <span className="grow">
                  <b>{u.login}</b>
                  <span className="muted"> · {u.name} — {u.role}</span>
                </span>
                <span className="mono">{DEMO_PASSWORDS[u.login]}</span>
              </button>
            ))}
            <p className="gate-note" style={{ marginTop: 8 }}>
              Sample credentials for this demonstration only. Passwords are stored as
              PBKDF2 hashes with a per-account salt, never as text.
            </p>
          </div>
        )}

        <p className="gate-note">
          Demo environment — sample data, no real customer information. Records are kept in
          this browser, so anything you add stays on your own device.
        </p>
      </div>
    </div>
  )
}
