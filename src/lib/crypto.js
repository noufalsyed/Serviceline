/**
 * Password hashing with PBKDF2-SHA256 over the Web Crypto API.
 *
 * Passwords are never stored — only a per-user random salt and the derived
 * hash, which is the same shape a real backend would keep. In this demo the
 * check runs in the browser, so it demonstrates the mechanism rather than
 * enforcing it; production moves this behind the FastAPI login endpoint.
 *
 * crypto.subtle only exists in a secure context (https or localhost), which is
 * why the dev server binds to localhost over plain HTTP and switches to HTTPS
 * when it needs to be reachable from a phone.
 */

const ITERATIONS = 60000
const encoder = new TextEncoder()

export const cryptoAvailable = () =>
  typeof crypto !== 'undefined' && !!crypto.subtle

const toHex = (bytes) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

const fromHex = (hex) =>
  new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)))

export function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  )
  return toHex(bits)
}

export async function makeCredential(password) {
  const salt = randomSalt()
  return { salt, passwordHash: await hashPassword(password, salt) }
}

/** Constant-time-ish comparison so a wrong password leaks no timing signal. */
export async function verifyPassword(password, salt, expected) {
  if (!salt || !expected) return false
  const actual = await hashPassword(password, salt)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i += 1) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

/** Minimum bar for a new password. Returns an error string, or null if fine. */
export function passwordProblem(password) {
  if (!password || password.length < 8) return 'Use at least 8 characters.'
  if (!/[a-z]/i.test(password)) return 'Include at least one letter.'
  if (!/\d/.test(password)) return 'Include at least one number.'
  return null
}
