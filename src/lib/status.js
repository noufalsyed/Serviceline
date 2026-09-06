import { daysUntil } from './dates.js'

/**
 * Equipment status is mostly derived from dates, so it can never go stale.
 * Two states are set by hand and win over the dates: an item tagged
 * "Under Maintenance", and one that failed its last inspection.
 */
export function statusOf(e) {
  if (e.status === 'Under Maintenance') return { key: 'maint', label: 'Under maintenance' }
  if (e.status === 'Failed') return { key: 'fail', label: 'Failed inspection' }

  const expiry = daysUntil(e.expiryDate)
  if (expiry !== null && expiry < 0) return { key: 'over', label: 'Expired' }

  const due = daysUntil(e.nextServiceDate)
  if (due !== null && due < 0) return { key: 'over', label: 'Service overdue' }
  if (expiry !== null && expiry <= 30) return { key: 'exp', label: 'Expiring soon' }
  if (due !== null && due <= 7) return { key: 'due', label: 'Service due' }
  if (due !== null && due <= 30) return { key: 'due', label: 'Due in 30 days' }

  return { key: 'ok', label: 'Operational' }
}

export const STATUS_FILTERS = [
  'Operational', 'Service due', 'Overdue', 'Expiring', 'Under maintenance', 'Failed'
]

export function matchesStatusFilter(e, filter) {
  if (!filter) return true
  const { key } = statusOf(e)
  switch (filter) {
    case 'Operational': return key === 'ok'
    case 'Service due': return key === 'due'
    case 'Overdue': return key === 'over'
    case 'Expiring': return key === 'exp'
    case 'Under maintenance': return key === 'maint'
    case 'Failed': return key === 'fail'
    default: return true
  }
}

/** Sort into the buckets the reminder engine notifies on. */
export function buckets(list) {
  const out = { overdue: [], today: [], week: [], month: [], quarter: [], expiring: [] }
  list.forEach((e) => {
    const exp = daysUntil(e.expiryDate)
    if (exp !== null && exp >= 0 && exp <= 30) out.expiring.push(e)
    const d = daysUntil(e.nextServiceDate)
    if (d === null) return
    if (d < 0) out.overdue.push(e)
    else if (d === 0) out.today.push(e)
    else if (d <= 7) out.week.push(e)
    else if (d <= 30) out.month.push(e)
    else if (d <= 90) out.quarter.push(e)
  })
  const byDue = (a, b) => daysUntil(a.nextServiceDate) - daysUntil(b.nextServiceDate)
  const byExp = (a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)
  out.overdue.sort(byDue); out.week.sort(byDue); out.month.sort(byDue); out.quarter.sort(byDue)
  out.expiring.sort(byExp)
  out.attention = out.overdue.length + out.today.length + out.week.length + out.expiring.length
  return out
}
