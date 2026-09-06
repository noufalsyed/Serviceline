import { statusOf } from '../lib/status.js'

export function StatusPill({ equipment, dotOnly = false }) {
  const s = statusOf(equipment)
  if (dotOnly) return <span className={`pill dot ${s.key}`} title={s.label} aria-label={s.label} />
  return <span className={`pill ${s.key}`}>{s.label}</span>
}

export function Pill({ tone = 'flat', children }) {
  return <span className={`pill ${tone}`}>{children}</span>
}
