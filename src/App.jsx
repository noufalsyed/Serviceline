import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Toast from './components/Toast.jsx'
import Icon from './components/Icon.jsx'
import { useStore, useData } from './lib/store.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EquipmentList from './pages/EquipmentList.jsx'
import EquipmentDetail from './pages/EquipmentDetail.jsx'
import Reminders from './pages/Reminders.jsx'
import Labels from './pages/Labels.jsx'
import Reports from './pages/Reports.jsx'
import Requests from './pages/Requests.jsx'
import Audit from './pages/Audit.jsx'
import Customers from './pages/Customers.jsx'
import Users from './pages/Users.jsx'
import Backup from './pages/Backup.jsx'
import Account from './pages/Account.jsx'

// The camera decoder is the single biggest dependency here. Split it out so a
// phone on mobile data only pays for it at the moment someone taps Scan.
const Scan = lazy(() => import('./pages/Scan.jsx'))

const THEME_KEY = 'serviceline.theme.v1'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'system' } catch { return 'system' }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* non-fatal */ }
  }, [theme])

  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  return { theme, isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') }
}

function RequireAuth({ children }) {
  const { me } = useStore()
  const location = useLocation()
  // Preserve where the scan was heading so sign-in can hand the engineer
  // straight to that equipment.
  if (!me) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

/** Routes that need a specific permission, not merely a signed-in account. */
function RequirePermission({ permission, children }) {
  const { can } = useData()
  if (!can(permission)) {
    return (
      <>
        <div className="page-head"><h1>Not available to your account</h1></div>
        <section className="panel">
          <p className="empty">
            <Icon name="shield" />
            Your account does not hold the permission this page needs.
            <br />An administrator can grant it from the user accounts page.
          </p>
        </section>
      </>
    )
  }
  return children
}

export default function App() {
  const { ready, notice } = useStore()

  if (!ready) {
    return (
      <div className="gate">
        <div className="splash">
          <span className="mark"><Icon name="qr" /></span>
          <p>Preparing the demo…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={(
            <RequireAuth>
              <Layout />
            </RequireAuth>
          )}
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<EquipmentList />} />
          <Route path="/e/:id" element={<EquipmentDetail />} />
          <Route
            path="/scan"
            element={(
              <Suspense fallback={<p className="empty">Loading the scanner…</p>}>
                <Scan />
              </Suspense>
            )}
          />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/account" element={<Account />} />
          <Route path="/requests" element={<Requests />} />
          <Route
            path="/labels"
            element={<RequirePermission permission="labels.print"><Labels /></RequirePermission>}
          />
          <Route
            path="/reports"
            element={<RequirePermission permission="reports.export"><Reports /></RequirePermission>}
          />
          <Route
            path="/audit"
            element={<RequirePermission permission="audit.view"><Audit /></RequirePermission>}
          />
          <Route
            path="/users"
            element={<RequirePermission permission="users.manage"><Users /></RequirePermission>}
          />
          <Route
            path="/backup"
            element={<RequirePermission permission="backup.manage"><Backup /></RequirePermission>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {notice && <Toast notice={notice} />}
    </>
  )
}
