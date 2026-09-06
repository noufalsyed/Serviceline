import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useTheme } from '../App.jsx'
import { useStore, useData } from '../lib/store.jsx'
import { buckets } from '../lib/status.js'

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Layout() {
  const { me, signOut } = useStore()
  const { myEquipment, myRequests, can } = useData()
  const { isDark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const attention = buckets(myEquipment).attention
  const openRequests = myRequests.filter((r) => r.status === 'Open').length

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/equipment?q=${encodeURIComponent(query.trim())}`)
  }

  const links = [
    { to: '/', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/equipment', icon: 'equipment', label: 'Equipment', count: myEquipment.length },
    { to: '/reminders', icon: 'bell', label: 'Reminders', count: attention || null },
    can('viewAll') && { to: '/customers', icon: 'building', label: 'Customers & sites' }
  ].filter(Boolean)

  const recordLinks = [
    can('labels') && { to: '/labels', icon: 'qr', label: 'QR labels' },
    { to: '/reports', icon: 'chart', label: 'Reports' },
    { to: '/requests', icon: 'list', label: 'Service requests', count: openRequests || null },
    can('viewAll') && { to: '/audit', icon: 'shield', label: 'Audit trail' }
  ].filter(Boolean)

  const navItem = ({ to, icon, label, count, end }) => (
    <NavLink key={to} to={to} end={end}>
      <Icon name={icon} />
      {label}
      {count ? <span className="count">{count}</span> : null}
    </NavLink>
  )

  return (
    <div className="shell">
      <aside className={`side ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="mark"><Icon name="qr" /></span>
          <span>
            <b>Serviceline</b>
            <small>Equipment registry</small>
          </span>
        </div>

        <nav className="nav">
          {links.map(navItem)}
          <div className="group">Records</div>
          {recordLinks.map(navItem)}
        </nav>

        <div className="whoami">
          <span className="avatar">{initials(me.name)}</span>
          <span className="who">
            <b>{me.name}</b>
            <span>{me.role}</span>
          </span>
          <button className="icon-btn" onClick={signOut} title="Sign out" aria-label="Sign out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="list" />
          </button>

          <form className="searchbox" onSubmit={submitSearch} role="search">
            <Icon name="search" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, serial, location…"
              aria-label="Search equipment"
            />
          </form>

          <button className="btn primary no-print" onClick={() => navigate('/scan')}>
            <Icon name="qr" />
            <span className="scan-word">Scan</span>
          </button>

          <button
            className="icon-btn no-print"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={isDark ? 'sun' : 'moon'} />
          </button>
        </header>

        <div className="ribbon">Demo environment — sample data, not real customer records</div>

        <main className="page">
          <Outlet />
        </main>
      </div>

      <nav className="tabbar no-print" aria-label="Primary">
        <NavLink to="/" end><Icon name="dashboard" />Home</NavLink>
        <NavLink to="/equipment"><Icon name="equipment" />Register</NavLink>
        <NavLink to="/scan" className="scan-tab">
          <span className="ring"><Icon name="qr" /></span>
          Scan
        </NavLink>
        <NavLink to="/reminders"><Icon name="bell" />Due</NavLink>
        <NavLink to="/reports"><Icon name="chart" />Reports</NavLink>
      </nav>
    </div>
  )
}
