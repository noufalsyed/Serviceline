import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_PASSWORDS, seed } from '../data/seed.js'
import { rebase, stamp, todayISO } from './dates.js'
import { makeCredential, passwordProblem, verifyPassword } from './crypto.js'
import { effectivePermissions, hasPermission, describeScope } from './permissions.js'
import {
  nextCustomerId, nextEquipmentId, nextRecordId, nextRequestId, nextSiteId, nextUserId
} from './ids.js'

const DB_KEY = 'serviceline.db.v2'
const SESSION_KEY = 'serviceline.session.v2'
const SCHEMA = 2
const MAX_SNAPSHOTS = 5

const StoreContext = createContext(null)

function readStored() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // An older schema has no login credentials, so it cannot be signed into.
    if (parsed?.version !== SCHEMA || !parsed.users?.length) return null
    return parsed
  } catch {
    return null
  }
}

async function buildSeed() {
  const db = rebase(seed())
  await Promise.all(db.users.map(async (u) => {
    Object.assign(u, await makeCredential(DEMO_PASSWORDS[u.login] || 'Serviceline2026'))
  }))
  return db
}

const auditEntry = (user, action, entity, detail) => ({
  id: `A-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
  ts: stamp(),
  user: user ? `${user.name} (${user.login})` : 'System',
  action,
  entity: entity || '—',
  detail: detail || ''
})

const withAudit = (db, user, action, entity, detail) => ({
  ...db,
  audit: [auditEntry(user, action, entity, detail), ...db.audit].slice(0, 400)
})

export function StoreProvider({ children }) {
  const [db, setDb] = useState(null)
  const [meId, setMeId] = useState(null)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  // Derive the signed-in user from the database rather than holding a copy, so
  // permission edits and account suspensions take effect immediately.
  const me = useMemo(() => {
    if (!db || !meId) return null
    const user = db.users.find((u) => u.id === meId)
    return user && user.active !== false ? user : null
  }, [db, meId])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const stored = readStored()
      const next = stored || await buildSeed()
      if (!alive) return
      setDb(next)
      try {
        const saved = localStorage.getItem(SESSION_KEY)
        if (saved && next.users.some((u) => u.id === saved && u.active !== false)) setMeId(saved)
      } catch { /* storage blocked — start signed out */ }
      setReady(true)
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!db) return
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch {
      setNotice({ tone: 'warn', text: 'Browser storage is full — remove an old backup snapshot.' })
    }
  }, [db])

  const toast = useCallback((text, tone = 'ok') => {
    setNotice({ text, tone })
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3400)
  }, [])

  const log = useCallback((action, entity, detail) => {
    setDb((d) => withAudit(d, d.users.find((u) => u.id === meId), action, entity, detail))
  }, [meId])

  /* ---------------- authentication ---------------- */

  const signIn = useCallback(async (login, password) => {
    const current = readStored() || db
    const user = current.users.find((u) => u.login.toLowerCase() === login.trim().toLowerCase())
    if (!user) return { ok: false, error: 'No account with that user ID.' }
    if (user.active === false) {
      return { ok: false, error: 'That account is disabled. Ask an administrator to re-enable it.' }
    }
    const valid = await verifyPassword(password, user.salt, user.passwordHash)
    if (!valid) {
      setDb((d) => withAudit(d, null, 'Sign-in failed', user.login, 'Incorrect password'))
      return { ok: false, error: 'Incorrect password.' }
    }
    setMeId(user.id)
    try { localStorage.setItem(SESSION_KEY, user.id) } catch { /* non-fatal */ }
    setDb((d) => withAudit(d, user, 'Signed in', '—', user.role))
    return { ok: true }
  }, [db])

  const signOut = useCallback(() => {
    setDb((d) => withAudit(d, d.users.find((u) => u.id === meId), 'Signed out', '—', ''))
    setMeId(null)
    try { localStorage.removeItem(SESSION_KEY) } catch { /* non-fatal */ }
  }, [meId])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!me) return { ok: false, error: 'Not signed in.' }
    const valid = await verifyPassword(currentPassword, me.salt, me.passwordHash)
    if (!valid) return { ok: false, error: 'Your current password is not correct.' }
    const problem = passwordProblem(newPassword)
    if (problem) return { ok: false, error: problem }
    if (await verifyPassword(newPassword, me.salt, me.passwordHash)) {
      return { ok: false, error: 'Choose a password you have not used here before.' }
    }
    const credential = await makeCredential(newPassword)
    setDb((d) => withAudit(
      { ...d, users: d.users.map((u) => (u.id === me.id ? { ...u, ...credential, mustChangePassword: false } : u)) },
      me, 'Password changed', me.login, 'Changed by the account holder'
    ))
    return { ok: true }
  }, [me])

  /* ---------------- equipment ---------------- */

  const createEquipment = useCallback((data) => {
    const id = nextEquipmentId(db.equipment, data.category)
    const item = {
      manufacturer: '', model: '', serial: '', assetTag: '',
      building: '', floor: '', area: '',
      installDate: '', warrantyEnd: '', expiryDate: '',
      lastServiceDate: '', lastInspectionDate: '', nextInspectionDate: '',
      remarks: '', status: 'Operational', photos: [],
      ...data,
      id,
      createdAt: todayISO(),
      createdBy: me.name
    }
    setDb((d) => withAudit(
      { ...d, equipment: [...d.equipment, item] },
      me, 'Equipment added', id, `${data.category} · ${data.name}`
    ))
    return id
  }, [db, me])

  const updateEquipment = useCallback((id, patch) => {
    setDb((d) => withAudit(
      { ...d, equipment: d.equipment.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
      me, 'Equipment updated', id, Object.keys(patch).join(', ')
    ))
  }, [me])

  const deleteEquipment = useCallback((id) => {
    setDb((d) => withAudit({
      ...d,
      equipment: d.equipment.filter((e) => e.id !== id),
      records: d.records.filter((r) => r.equipmentId !== id),
      requests: d.requests.filter((r) => r.equipmentId !== id)
    }, me, 'Equipment deleted', id, 'Service history removed with it'))
  }, [me])

  const addRecord = useCallback((draft, { nextService }) => {
    setDb((d) => {
      const record = { ...draft, id: nextRecordId(d.records) }
      const equipment = d.equipment.map((e) => {
        if (e.id !== record.equipmentId) return e
        const patch = { ...e, lastServiceDate: record.date, nextServiceDate: nextService || e.nextServiceDate }
        if (record.type === 'Inspection') {
          patch.lastInspectionDate = record.date
          patch.nextInspectionDate = nextService || e.nextInspectionDate
        }
        if (record.result === 'Failed') patch.status = 'Failed'
        else if (record.result === 'In Progress') patch.status = 'Under Maintenance'
        else patch.status = 'Operational'
        return patch
      })
      // A completed visit closes any request still open against that item.
      const settled = ['Failed', 'In Progress'].includes(record.result)
      const requests = settled ? d.requests : d.requests.map((r) => (
        r.equipmentId === record.equipmentId && r.status === 'Open' ? { ...r, status: 'Closed' } : r
      ))
      return withAudit(
        { ...d, records: [record, ...d.records], equipment, requests },
        d.users.find((u) => u.id === meId),
        'Service record added', record.equipmentId, `${record.type} · ${record.result}`
      )
    })
  }, [meId])

  const addRequest = useCallback((equipmentId, note) => {
    setDb((d) => {
      const user = d.users.find((u) => u.id === meId)
      const request = {
        id: nextRequestId(d.requests),
        equipmentId, by: user?.name || '—', date: todayISO(), note, status: 'Open'
      }
      return withAudit({ ...d, requests: [request, ...d.requests] },
        user, 'Service request raised', equipmentId, note.slice(0, 70))
    })
  }, [meId])

  /* ---------------- customers and sites ---------------- */

  const createCustomer = useCallback((data) => {
    const id = nextCustomerId(db.customers)
    setDb((d) => withAudit({ ...d, customers: [...d.customers, { ...data, id }] },
      me, 'Customer added', id, data.name))
    return id
  }, [db, me])

  const updateCustomer = useCallback((id, patch) => {
    setDb((d) => withAudit(
      { ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
      me, 'Customer updated', id, patch.name || Object.keys(patch).join(', ')
    ))
  }, [me])

  const deleteCustomer = useCallback((id) => {
    const sites = db.sites.filter((s) => s.customerId === id).length
    const items = db.equipment.filter((e) => e.customerId === id).length
    if (items) return { ok: false, error: `That customer still has ${items} piece${items === 1 ? '' : 's'} of equipment. Move or delete them first.` }
    if (sites) return { ok: false, error: `That customer still has ${sites} site${sites === 1 ? '' : 's'}. Delete them first.` }
    setDb((d) => withAudit({ ...d, customers: d.customers.filter((c) => c.id !== id) },
      me, 'Customer deleted', id, ''))
    return { ok: true }
  }, [db, me])

  const createSite = useCallback((data) => {
    const id = nextSiteId(db.sites)
    setDb((d) => withAudit({ ...d, sites: [...d.sites, { ...data, id }] },
      me, 'Site added', id, `${data.name} · ${data.city}`))
    return id
  }, [db, me])

  const updateSite = useCallback((id, patch) => {
    setDb((d) => withAudit(
      { ...d, sites: d.sites.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
      me, 'Site updated', id, patch.name || Object.keys(patch).join(', ')
    ))
  }, [me])

  const deleteSite = useCallback((id) => {
    const items = db.equipment.filter((e) => e.siteId === id).length
    if (items) return { ok: false, error: `That site still holds ${items} piece${items === 1 ? '' : 's'} of equipment. Move or delete them first.` }
    setDb((d) => withAudit({ ...d, sites: d.sites.filter((s) => s.id !== id) }, me, 'Site deleted', id, ''))
    return { ok: true }
  }, [db, me])

  /* ---------------- users ---------------- */

  const createUser = useCallback(async (data, password) => {
    const login = data.login.trim().toLowerCase()
    if (db.users.some((u) => u.login.toLowerCase() === login)) {
      return { ok: false, error: 'That user ID is already taken.' }
    }
    const problem = passwordProblem(password)
    if (problem) return { ok: false, error: problem }
    const credential = await makeCredential(password)
    const id = nextUserId(db.users)
    const user = { ...data, login, id, active: true, mustChangePassword: true, ...credential }
    setDb((d) => withAudit({ ...d, users: [...d.users, user] },
      me, 'User account created', login, `${data.role} · ${data.name}`))
    return { ok: true, id }
  }, [db, me])

  const updateUser = useCallback((id, patch) => {
    setDb((d) => {
      const target = d.users.find((u) => u.id === id)
      const detail = 'active' in patch
        ? (patch.active ? 'Account enabled' : 'Account disabled')
        : Object.keys(patch).join(', ')
      return withAudit(
        { ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) },
        d.users.find((u) => u.id === meId), 'User account updated', target?.login || id, detail
      )
    })
  }, [meId])

  const setUserPassword = useCallback(async (id, password) => {
    const problem = passwordProblem(password)
    if (problem) return { ok: false, error: problem }
    const credential = await makeCredential(password)
    setDb((d) => {
      const target = d.users.find((u) => u.id === id)
      return withAudit(
        { ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...credential, mustChangePassword: true } : u)) },
        d.users.find((u) => u.id === meId), 'Password reset', target?.login || id, 'Reset by an administrator'
      )
    })
    return { ok: true }
  }, [meId])

  const deleteUser = useCallback((id) => {
    if (id === meId) return { ok: false, error: 'You cannot delete the account you are signed in with.' }
    const target = db.users.find((u) => u.id === id)
    const admins = db.users.filter((u) => u.role === 'Administrator' && u.active !== false)
    if (target?.role === 'Administrator' && admins.length <= 1) {
      return { ok: false, error: 'That is the only active administrator. Promote another account first.' }
    }
    setDb((d) => withAudit({ ...d, users: d.users.filter((u) => u.id !== id) },
      me, 'User account deleted', target?.login || id, target?.role || ''))
    return { ok: true }
  }, [db, me, meId])

  /* ---------------- backup and restore ---------------- */

  const snapshotOf = (d) => {
    const { backups, ...rest } = d
    return rest
  }

  const createBackup = useCallback((kind = 'Manual', label = '') => {
    let created = null
    setDb((d) => {
      const user = d.users.find((u) => u.id === meId)
      const payload = snapshotOf(d)
      const entry = {
        id: `BK-${Date.now().toString(36).toUpperCase()}`,
        ts: stamp(),
        by: user ? `${user.name} (${user.login})` : 'System',
        kind,
        label: label || `${kind} backup`,
        counts: {
          equipment: d.equipment.length,
          records: d.records.length,
          customers: d.customers.length,
          sites: d.sites.length,
          users: d.users.length
        },
        data: payload
      }
      created = entry
      return withAudit({
        ...d,
        backups: [entry, ...d.backups].slice(0, MAX_SNAPSHOTS),
        settings: { ...d.settings, lastBackupAt: new Date().toISOString() }
      }, user, `${kind} backup created`, entry.id, `${d.equipment.length} items · ${d.records.length} records`)
    })
    return created
  }, [meId])

  const restoreBackup = useCallback((payload, source) => {
    if (!payload?.users?.length || !Array.isArray(payload.equipment)) {
      return { ok: false, error: 'That file is not a Serviceline backup.' }
    }
    if (payload.version !== SCHEMA) {
      return { ok: false, error: `That backup is schema version ${payload.version ?? 'unknown'}; this build reads version ${SCHEMA}.` }
    }
    setDb((d) => withAudit(
      { ...payload, backups: d.backups, settings: { ...d.settings, ...payload.settings } },
      d.users.find((u) => u.id === meId), 'Database restored', source || 'backup',
      `${payload.equipment.length} items · ${payload.records?.length ?? 0} records`
    ))
    return { ok: true }
  }, [meId])

  const deleteBackup = useCallback((id) => {
    setDb((d) => withAudit({ ...d, backups: d.backups.filter((b) => b.id !== id) },
      d.users.find((u) => u.id === meId), 'Backup deleted', id, ''))
  }, [meId])

  const setBackupSchedule = useCallback((schedule) => {
    setDb((d) => withAudit({ ...d, settings: { ...d.settings, backupSchedule: schedule } },
      d.users.find((u) => u.id === meId), 'Backup schedule changed', '—', `Set to ${schedule}`))
  }, [meId])

  // Scheduled backups run when the app is opened and one is overdue — the
  // browser equivalent of a nightly cron job on the server.
  const scheduleChecked = useRef(false)
  useEffect(() => {
    if (!ready || !db || !me || scheduleChecked.current) return
    scheduleChecked.current = true
    const { backupSchedule, lastBackupAt } = db.settings || {}
    if (!backupSchedule || backupSchedule === 'off') return
    const intervalHours = backupSchedule === 'daily' ? 24 : 24 * 7
    const last = lastBackupAt ? new Date(lastBackupAt).getTime() : 0
    if (Date.now() - last < intervalHours * 3600000) return
    createBackup('Scheduled')
    toast(`Scheduled ${backupSchedule} backup created`)
  }, [ready, db, me, createBackup, toast])

  const resetDemo = useCallback(async () => {
    setDb(await buildSeed())
    setMeId(null)
    try { localStorage.removeItem(SESSION_KEY) } catch { /* non-fatal */ }
    toast('Demo data reset — sign in again')
  }, [toast])

  const value = useMemo(() => ({
    ready, db, me, notice, toast, log,
    signIn, signOut, changePassword,
    createEquipment, updateEquipment, deleteEquipment, addRecord, addRequest,
    createCustomer, updateCustomer, deleteCustomer,
    createSite, updateSite, deleteSite,
    createUser, updateUser, setUserPassword, deleteUser,
    createBackup, restoreBackup, deleteBackup, setBackupSchedule,
    resetDemo
  }), [
    ready, db, me, notice, toast, log, signIn, signOut, changePassword,
    createEquipment, updateEquipment, deleteEquipment, addRecord, addRequest,
    createCustomer, updateCustomer, deleteCustomer, createSite, updateSite, deleteSite,
    createUser, updateUser, setUserPassword, deleteUser,
    createBackup, restoreBackup, deleteBackup, setBackupSchedule, resetDemo
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/* ---------------- selectors, permissions and scope ---------------- */

export function useData() {
  const { db, me } = useStore()

  return useMemo(() => {
    const customer = (id) => db.customers.find((c) => c.id === id)
    const site = (id) => db.sites.find((s) => s.id === id)
    const equipment = (id) => db.equipment.find((e) => e.id === id)

    const inScope = (e) => {
      if (!e || !me) return false
      if (me.scopeCustomer) return e.customerId === me.scopeCustomer
      if (me.scopeSites?.length) return me.scopeSites.includes(e.siteId)
      return true
    }

    const can = (key) => hasPermission(me, key)
    const hasFullScope = !me?.scopeCustomer && !me?.scopeSites?.length
    const scopeLabel = () => describeScope(me, customer(me?.scopeCustomer)?.name)

    const myEquipment = db.equipment.filter(inScope)
    const recordsFor = (id) => db.records
      .filter((r) => r.equipmentId === id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    const requestsFor = (id) => db.requests.filter((r) => r.equipmentId === id)
    const myRequests = db.requests.filter((r) => inScope(equipment(r.equipmentId)))
    const myRecords = db.records.filter((r) => inScope(equipment(r.equipmentId)))

    // Sites the signed-in user may file equipment against.
    const assignableSites = db.sites.filter((s) => {
      if (!me) return false
      if (me.scopeCustomer) return s.customerId === me.scopeCustomer
      if (me.scopeSites?.length) return me.scopeSites.includes(s.id)
      return true
    })

    const where = (e) => [customer(e.customerId)?.name, site(e.siteId)?.name]
      .filter(Boolean).join(' — ')

    return {
      db, me, customer, site, equipment, inScope, can, hasFullScope, scopeLabel,
      permissions: effectivePermissions(me),
      myEquipment, myRecords, myRequests, assignableSites,
      recordsFor, requestsFor, where
    }
  }, [db, me])
}
