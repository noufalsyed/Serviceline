import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import EquipmentForm from '../components/EquipmentForm.jsx'
import { StatusPill } from '../components/Pill.jsx'
import { useData } from '../lib/store.jsx'
import { STATUS_FILTERS, matchesStatusFilter } from '../lib/status.js'
import { daysUntil, fmt, relative } from '../lib/dates.js'

export default function EquipmentList() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { db, myEquipment, customer, site, where, scopeLabel, can, assignableSites } = useData()

  const q = params.get('q') || ''
  const [filters, setFilters] = useState({ customer: '', site: '', category: '', status: '' })
  const [adding, setAdding] = useState(false)

  const customerIds = useMemo(
    () => [...new Set(myEquipment.map((e) => e.customerId))],
    [myEquipment]
  )
  const categories = useMemo(
    () => [...new Set(myEquipment.map((e) => e.category))].sort(),
    [myEquipment]
  )
  const siteOptions = db.sites.filter(
    (s) => (!filters.customer || s.customerId === filters.customer) &&
      myEquipment.some((e) => e.siteId === s.id)
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return myEquipment
      .filter((e) => {
        if (filters.customer && e.customerId !== filters.customer) return false
        if (filters.site && e.siteId !== filters.site) return false
        if (filters.category && e.category !== filters.category) return false
        if (!matchesStatusFilter(e, filters.status)) return false
        if (!needle) return true
        const hay = [
          e.id, e.name, e.serial, e.assetTag, e.category, e.type,
          e.building, e.area, e.model, e.manufacturer,
          customer(e.customerId)?.name, site(e.siteId)?.name
        ].join(' ').toLowerCase()
        return hay.includes(needle)
      })
      .sort((a, b) => {
        const x = daysUntil(a.nextServiceDate)
        const y = daysUntil(b.nextServiceDate)
        if (x === null) return 1
        if (y === null) return -1
        return x - y
      })
  }, [myEquipment, filters, q, customer, site])

  const dirty = q || Object.values(filters).some(Boolean)

  const set = (key) => (e) => {
    const value = e.target.value
    setFilters((f) => (key === 'customer' ? { ...f, customer: value, site: '' } : { ...f, [key]: value }))
  }

  return (
    <>
      <p className="scope-chip"><Icon name="shield" />{scopeLabel()}</p>

      <div className="page-head">
        <div>
          <h1>Equipment register</h1>
          <p>
            {rows.length} of {myEquipment.length} items
            {q && <> matching “{q}”</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {dirty && (
            <button
              className="btn ghost"
              onClick={() => { setFilters({ customer: '', site: '', category: '', status: '' }); setParams({}) }}
            >
              <Icon name="close" />Clear
            </button>
          )}
          {can('equipment.create') && (
            <button
              className="btn primary"
              onClick={() => setAdding(true)}
              disabled={assignableSites.length === 0}
              title={assignableSites.length === 0 ? 'Add a customer and site first' : undefined}
            >
              <Icon name="plus" />Add equipment
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <select value={filters.customer} onChange={set('customer')} aria-label="Filter by customer">
          <option value="">All customers</option>
          {customerIds.map((id) => <option key={id} value={id}>{customer(id)?.name}</option>)}
        </select>
        <select value={filters.site} onChange={set('site')} aria-label="Filter by site">
          <option value="">All sites</option>
          {siteOptions.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.city}</option>)}
        </select>
        <select value={filters.category} onChange={set('category')} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.status} onChange={set('status')} aria-label="Filter by status">
          <option value="">Any status</option>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <section className="panel">
        <div className="body flush">
          {rows.length === 0 ? (
            <p className="empty"><Icon name="search" />No equipment matches these filters.</p>
          ) : (
            <div className="rows">
              {rows.map((e) => {
                const late = daysUntil(e.nextServiceDate) < 0
                return (
                  <button key={e.id} className="row" onClick={() => navigate(`/e/${e.id}`)}>
                    <StatusPill equipment={e} dotOnly />
                    <span className="grow">
                      <span className="t">
                        <span className="eid">{e.id}</span>
                        {e.name}
                      </span>
                      <span className="sub">
                        {e.category} · {e.type} — {where(e)}
                        {e.area ? ` · ${e.area}` : ''}
                      </span>
                    </span>
                    <span className={`when ${late ? 'late' : ''}`}>
                      {fmt(e.nextServiceDate)}
                      <br />
                      <span style={{ opacity: .8 }}>{relative(e.nextServiceDate)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {adding && <EquipmentForm onClose={() => setAdding(false)} />}
    </>
  )
}
