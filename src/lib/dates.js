// The seed dataset was written against this date. On first load we shift every
// date in it by (today − ANCHOR) so the demo always opens with a realistic
// spread of overdue / due-this-week / upcoming items, whenever it is viewed.
export const ANCHOR = '2026-09-06'

const DAY = 86400000

export function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function parse(iso) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toISO(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const todayISO = () => toISO(today())

/** Whole days from today to `iso`. Negative = in the past. */
export function daysUntil(iso) {
  const d = parse(iso)
  if (!d) return null
  return Math.round((d - today()) / DAY)
}

export function shiftISO(iso, days) {
  const d = parse(iso)
  if (!d) return iso
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function addMonths(iso, months) {
  const d = parse(iso) || today()
  d.setMonth(d.getMonth() + months)
  return toISO(d)
}

export function fmt(iso) {
  const d = parse(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtShort(iso) {
  const d = parse(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function stamp(d = new Date()) {
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

/** "3 days overdue" / "due today" / "in 12 days" */
export function relative(iso) {
  const n = daysUntil(iso)
  if (n === null) return '—'
  if (n < 0) return `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} overdue`
  if (n === 0) return 'due today'
  if (n === 1) return 'due tomorrow'
  return `in ${n} days`
}

const DATE_FIELDS = [
  'installDate', 'warrantyEnd', 'expiryDate',
  'lastServiceDate', 'nextServiceDate',
  'lastInspectionDate', 'nextInspectionDate'
]

/** Shift the whole seed dataset so it stays current no matter when it is opened. */
export function rebase(db) {
  const offset = Math.round((today() - parse(ANCHOR)) / DAY)
  if (!offset) return db
  db.equipment.forEach((e) => {
    DATE_FIELDS.forEach((f) => { if (e[f]) e[f] = shiftISO(e[f], offset) })
  })
  db.records.forEach((r) => { if (r.date) r.date = shiftISO(r.date, offset) })
  db.requests.forEach((r) => { if (r.date) r.date = shiftISO(r.date, offset) })
  const now = new Date()
  db.audit.forEach((a, i) => {
    const d = new Date(now.getTime() - (i + 1) * 26 * 3600000)
    a.ts = stamp(d)
  })
  return db
}
