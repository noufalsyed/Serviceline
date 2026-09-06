import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import Confirm from '../components/Confirm.jsx'
import { CustomerForm, SiteForm } from '../components/CustomerForm.jsx'
import { Pill } from '../components/Pill.jsx'
import { useData, useStore } from '../lib/store.jsx'
import { statusOf } from '../lib/status.js'

export default function Customers() {
  const navigate = useNavigate()
  const { db, can } = useData()
  const { deleteCustomer, deleteSite, toast } = useStore()

  const [customerSheet, setCustomerSheet] = useState(null) // 'new' | customer
  const [siteSheet, setSiteSheet] = useState(null)         // { customerId } | { existing }
  const [removing, setRemoving] = useState(null)           // { kind, row }

  const manage = can('customers.manage')

  const confirmRemove = () => {
    const { kind, row } = removing
    const result = kind === 'customer' ? deleteCustomer(row.id) : deleteSite(row.id)
    if (!result.ok) toast(result.error, 'warn')
    else toast(kind === 'customer' ? 'Customer deleted' : 'Site deleted')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers and sites</h1>
          <p>{db.customers.length} customers · {db.sites.length} sites · {db.equipment.length} items</p>
        </div>
        {manage && (
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setSiteSheet({ customerId: '' })}>
              <Icon name="pin" />Add site
            </button>
            <button className="btn primary" onClick={() => setCustomerSheet('new')}>
              <Icon name="plus" />Add customer
            </button>
          </div>
        )}
      </div>

      {db.customers.length === 0 && (
        <section className="panel">
          <p className="empty">
            <Icon name="building" />
            No customers yet. Add a customer, then its sites, then file equipment against them.
          </p>
        </section>
      )}

      {db.customers.map((c) => {
        const sites = db.sites.filter((s) => s.customerId === c.id)
        const items = db.equipment.filter((e) => e.customerId === c.id)
        const overdue = items.filter((e) => statusOf(e).key === 'over').length

        return (
          <section className="panel" key={c.id} style={{ marginBottom: 14 }}>
            <h2>
              <span className="bucket-title">
                {c.name}
                <span className="aux">{items.length} items · {sites.length} sites</span>
              </span>
              {manage && (
                <span className="row-actions">
                  <button className="icon-btn" title="Add a site" aria-label={`Add a site to ${c.name}`} onClick={() => setSiteSheet({ customerId: c.id })}>
                    <Icon name="plus" />
                  </button>
                  <button className="icon-btn" title="Edit customer" aria-label={`Edit ${c.name}`} onClick={() => setCustomerSheet(c)}>
                    <Icon name="edit" />
                  </button>
                  <button className="icon-btn danger" title="Delete customer" aria-label={`Delete ${c.name}`} onClick={() => setRemoving({ kind: 'customer', row: c })}>
                    <Icon name="trash" />
                  </button>
                </span>
              )}
            </h2>
            <div className="body">
              <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
                {[c.contact, c.phone].filter(Boolean).join(' · ') || 'No contact recorded'}
                {overdue > 0 && <span style={{ color: 'var(--crit)', fontWeight: 600 }}> · {overdue} overdue</span>}
              </p>

              {sites.length === 0 ? (
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  No sites yet for this customer.
                </p>
              ) : (
                <div className="table-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Site</th><th>City</th><th>Equipment</th><th>Attention</th>
                        {manage && <th aria-label="Actions" />}
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s) => {
                        const own = items.filter((e) => e.siteId === s.id)
                        const flagged = own.filter((e) => ['over', 'due', 'fail'].includes(statusOf(e).key)).length
                        return (
                          <tr key={s.id}>
                            <td
                              className="clickable-cell"
                              onClick={() => navigate(`/equipment?q=${encodeURIComponent(s.name)}`)}
                            >
                              <b style={{ fontWeight: 600 }}>{s.name}</b>
                            </td>
                            <td className="muted">{s.city || '—'}</td>
                            <td className="num">{own.length}</td>
                            <td>
                              {flagged
                                ? <Pill tone="due">{flagged} need attention</Pill>
                                : <Pill tone="ok">Clear</Pill>}
                            </td>
                            {manage && (
                              <td>
                                <div className="row-actions">
                                  <button className="icon-btn" title="Edit site" aria-label={`Edit ${s.name}`} onClick={() => setSiteSheet({ existing: s })}>
                                    <Icon name="edit" />
                                  </button>
                                  <button className="icon-btn danger" title="Delete site" aria-label={`Delete ${s.name}`} onClick={() => setRemoving({ kind: 'site', row: s })}>
                                    <Icon name="trash" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )
      })}

      {customerSheet && (
        <CustomerForm
          existing={customerSheet === 'new' ? null : customerSheet}
          onClose={() => setCustomerSheet(null)}
        />
      )}

      {siteSheet && (
        <SiteForm
          customerId={siteSheet.customerId || ''}
          existing={siteSheet.existing}
          onClose={() => setSiteSheet(null)}
        />
      )}

      {removing && (
        <Confirm
          title={removing.kind === 'customer' ? `Delete ${removing.row.name}?` : `Delete site ${removing.row.name}?`}
          body={
            removing.kind === 'customer'
              ? 'The customer record is removed. This is only possible once all of its sites and equipment have been removed or moved elsewhere.'
              : 'The site record is removed. This is only possible once no equipment is filed against it.'
          }
          confirmLabel="Delete"
          onConfirm={confirmRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}
