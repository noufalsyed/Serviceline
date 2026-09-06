import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useStore } from '../lib/store.jsx'

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Login() {
  const { db, signIn } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Set when the router bounced a deep link here — i.e. someone scanned a
  // label while signed out. After sign-in we hand them straight to it.
  const from = location.state?.from
  const target = from?.pathname?.match(/^\/e\/(.+)$/)?.[1]

  const enter = (user) => {
    signIn(user)
    navigate(from?.pathname ? from.pathname + (from.search || '') : '/', { replace: true })
  }

  const scopeOf = (u) => {
    if (u.scopeCustomer) return db.customers.find((c) => c.id === u.scopeCustomer)?.name
    if (u.scopeSites) return `${u.scopeSites.length} assigned sites`
    return 'All customers and sites'
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="mark"><Icon name="qr" /></div>
        <h1>Serviceline</h1>
        <p>
          QR-based equipment and service-history management. Choose a demo account —
          each role is given a different slice of the system.
        </p>

        {target && (
          <p className="gate-target">
            <Icon name="qr" />
            <span>
              Scanned <b className="mono">{target}</b> — sign in to continue to that equipment.
            </span>
          </p>
        )}

        {db.users.map((u) => (
          <button key={u.id} className="user-btn" onClick={() => enter(u)}>
            <span className="avatar">{initials(u.name)}</span>
            <span className="who">
              <b>{u.name}</b>
              <span>{u.role} · {scopeOf(u)}</span>
            </span>
            <span className="go"><Icon name="chevron" /></span>
          </button>
        ))}

        <p className="gate-note">
          Demo environment — sample data only, no real customer information. Records are
          saved in this browser, so anything you add stays on your own device.
        </p>
      </div>
    </div>
  )
}
