/**
 * Identifier generation. Equipment IDs are what the QR code carries and what
 * gets printed on the label, so they need to be short, readable over a phone
 * camera, and stable for the life of the item.
 *
 * Shape: <two-letter category prefix>-<six digits>, e.g. FE-000128.
 */

export const CATEGORY_PREFIX = {
  'Fire Extinguisher': 'FE',
  'Fire Alarm Equipment': 'FA',
  'Fire Pump': 'FP',
  'Emergency Light': 'EL',
  'Fire Hose / Reel': 'FH',
  Generator: 'GN',
  UPS: 'UP',
  'HVAC / Air Conditioning': 'HV',
  Pump: 'PU',
  Compressor: 'CM',
  'Electrical Equipment': 'EE',
  Machinery: 'MC',
  Vehicle: 'VH',
  'IT Equipment': 'IT'
}

export const prefixFor = (category) => CATEGORY_PREFIX[category] || 'EQ'

/**
 * Next free ID in the category's series. Counts from the highest number
 * already used by that prefix, so deleting an item never recycles its ID onto
 * a different piece of equipment — old labels stay unambiguous.
 */
export function nextEquipmentId(equipment, category) {
  const prefix = prefixFor(category)
  const highest = equipment.reduce((max, e) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(e.id)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(6, '0')}`
}

const nextInSeries = (rows, prefix, width = 3) => {
  const highest = rows.reduce((max, r) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(r.id)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(width, '0')}`
}

export const nextCustomerId = (customers) => nextInSeries(customers, 'CUS')
export const nextSiteId = (sites) => nextInSeries(sites, 'SIT')
export const nextUserId = (users) => nextInSeries(users, 'USR')
export const nextRequestId = (requests) => nextInSeries(requests, 'RQ', 4)
export const nextRecordId = (records) => nextInSeries(records, 'SR', 4)

/** Suggest a login name from a person's name: "Ahmed Al-Otaibi" → "ahmed.a" */
export function suggestLogin(name, users) {
  const parts = name.trim().toLowerCase().split(/\s+/)
  const base = parts.length > 1
    ? `${parts[0]}.${parts[parts.length - 1][0]}`.replace(/[^a-z.]/g, '')
    : parts[0].replace(/[^a-z]/g, '')
  if (!base) return ''
  let candidate = base
  let n = 1
  while (users.some((u) => u.login === candidate)) {
    n += 1
    candidate = `${base}${n}`
  }
  return candidate
}
