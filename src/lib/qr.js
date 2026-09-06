/**
 * The QR code carries an identifier and nothing else — no service data.
 * Whoever scans it still has to sign in and pass the customer/site check
 * before any record is served.
 *
 * import.meta.env.BASE_URL is "/" in dev and "/<repo>/" on GitHub Pages, so
 * labels printed from a deployed build point back at that deployment.
 */
export function equipmentURL(id) {
  const { origin } = window.location
  return `${origin}${import.meta.env.BASE_URL}#/e/${id}`
}

/** A Serviceline identifier: two or three letters, a hyphen, then digits. */
const ID = /^[A-Za-z]{2,3}-\d{3,}$/

/** Pull an equipment id out of whatever the camera decoded. */
export function parseScan(text) {
  if (!text) return null
  const raw = String(text).trim()

  // A label printed by this app: .../#/e/FE-000125
  const fromUrl = raw.match(/[#/]e\/([A-Za-z]{2,3}-\d{3,})(?:[/?#]|$)/)
  if (fromUrl) return fromUrl[1].toUpperCase()

  // A bare identifier — typed by hand, or a plain-text QR someone printed.
  // Whole tokens only: a customer's own asset tag such as NFM-PU-009 must not
  // be mistaken for the equipment PU-009.
  const token = raw.split(/[\s,;|]+/).find((t) => ID.test(t))
  return token ? token.toUpperCase() : null
}
