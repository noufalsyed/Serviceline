import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seed } from '../data/seed.js'
import { rebase, stamp, todayISO } from './dates.js'

const DB_KEY = 'serviceline.db.v1'
const USER_KEY = 'serviceline.user.v1'

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.equipment?.length) return parsed
    }
  } catch { /* corrupt or unavailable — fall through to a fresh seed */ }
  return rebase(seed())
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadDB)
  const [me, setMe] = useState(null)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  // Restore the signed-in user once the dataset is in hand.
  useEffect(() => {
    try {
      const id = localStorage.getItem(USER_KEY)
      if (id) setMe(db.users.find((u) => u.id === id) || null)
    } catch { /* storage blocked — start signed out */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch {
      setNotice({ tone: 'warn', text: 'Browser storage is full — photos from this record were not kept.' })
    }
  }, [db])

  const toast = useCallback((text, tone = 'ok') => {
    setNotice({ text, tone })
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3200)
  }, [])

  const signIn = useCallback((user) => {
    setMe(user)
    try { localStorage.setItem(USER_KEY, user.id) } catch { /* non-fatal */ }
    setDb((d) => withAudit(d, user, 'Signed in', '—', user.role))
  }, [])

  const signOut = useCallback(() => {
    setDb((d) => (me ? withAudit(d, me, 'Signed out', '—', '') : d))
    setMe(null)
    try { localStorage.removeItem(USER_KEY) } catch { /* non-fatal */ }
  }, [me])

  const log = useCallback((action, entity, detail) => {
    setDb((d) => withAudit(d, me, action, entity, detail))
  }, [me])

  const addRecord = useCallback((record, nextDates) => {
    setDb((d) => {
      const records = [record, ...d.records]
      const equipment = d.equipment.map((e) => {
        if (e.id !== record.equipmentId) return e
        const patch = {
          ...e,
          lastServiceDate: record.date,
          nextServiceDate: nextDates.nextService || e.nextServiceDate
        }
        if (record.type === 'Inspection') {
          patch.lastInspectionDate = record.date
          patch.nextInspectionDate = nextDates.nextService || e.nextInspectionDate
        }
        if (record.result === 'Failed') patch.status = 'Failed'
        else if (record.result === 'In Progress') patch.status = 'Under Maintenance'
        else patch.status = 'Operational'
        return patch
      })
      // A completed visit closes any open request against that equipment.
      const requests = record.result === 'Failed' || record.result === 'In Progress'
        ? d.requests
        : d.requests.map((r) => (r.equipmentId === record.equipmentId && r.status === 'Open'
          ? { ...r, status: 'Closed' } : r))
      return withAudit(
        { ...d, records, equipment, requests },
        me, 'Service record added', record.equipmentId,
        `${record.type} · ${record.result}`
      )
    })
  }, [me])

  const addRequest = useCallback((equipmentId, note) => {
    setDb((d) => {
      const request = {
        id: `RQ-${String(d.requests.length + 1).padStart(4, '0')}`,
        equipmentId, by: me?.name || '—', date: todayISO(), note, status: 'Open'
      }
      return withAudit({ ...d, requests: [request, ...d.requests] },
        me, 'Service request raised', equipmentId, note.slice(0, 70))
    })
  }, [me])

  const resetDemo = useCallback(() => {
    const fresh = rebase(seed())
    setDb(fresh)
    toast('Demo data reset')
  }, [toast])

  const value = useMemo(() => ({
    db, me, notice, toast, signIn, signOut, log, addRecord, addRequest, resetDemo
  }), [db, me, notice, toast, signIn, signOut, log, addRecord, addRequest, resetDemo])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function withAudit(d, user, action, entity, detail) {
  const entry = {
    id: `A-${Date.now().toString(36)}`,
    ts: stamp(), user: user?.name || '—', action, entity: entity || '—', detail: detail || ''
  }
  return { ...d, audit: [entry, ...d.audit].slice(0, 200) }
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/* ---------------- selectors + access control ---------------- */

export function useData() {
  const { db, me } = useStore()

  return useMemo(() => {
    const customer = (id) => db.customers.find((c) => c.id === id)
    const site = (id) => db.sites.find((s) => s.id === id)
    const equipment = (id) => db.equipment.find((e) => e.id === id)

    const inScope = (e) => {
      if (!e || !me) return false
      if (me.scopeCustomer) return e.customerId === me.scopeCustomer
      if (me.scopeSites) return me.scopeSites.includes(e.siteId)
      return true
    }

    const can = (action) => {
      switch (me?.role) {
        case 'Administrator': return true
        case 'Manager': return ['service', 'request', 'export', 'viewAll', 'labels'].includes(action)
        case 'Service Engineer': return ['service', 'export', 'labels'].includes(action)
        case 'Client User': return ['request', 'export'].includes(action)
        case 'Viewer': return action === 'export'
        default: return false
      }
    }

    const scopeLabel = () => {
      if (!me) return ''
      if (me.scopeCustomer) return `Scoped to ${customer(me.scopeCustomer)?.name ?? '—'}`
      if (me.scopeSites) return `Scoped to ${me.scopeSites.length} assigned sites`
      return 'Full access — all customers and sites'
    }

    const myEquipment = db.equipment.filter(inScope)
    const recordsFor = (id) => db.records
      .filter((r) => r.equipmentId === id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    const requestsFor = (id) => db.requests.filter((r) => r.equipmentId === id)
    const myRequests = db.requests.filter((r) => inScope(equipment(r.equipmentId)))
    const myRecords = db.records.filter((r) => inScope(equipment(r.equipmentId)))

    const where = (e) => {
      const s = site(e.siteId)
      return [customer(e.customerId)?.name, s?.name].filter(Boolean).join(' — ')
    }

    return {
      db, me, customer, site, equipment, inScope, can, scopeLabel,
      myEquipment, myRecords, myRequests, recordsFor, requestsFor, where
    }
  }, [db, me])
}
