import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Confirm from '../components/Confirm.jsx'
import { Pill } from '../components/Pill.jsx'
import { useStore } from '../lib/store.jsx'
import { download } from '../lib/files.js'
import { todayISO } from '../lib/dates.js'

const SCHEDULES = [
  ['off', 'Off', 'Back up only when you ask'],
  ['daily', 'Daily', 'One backup on the first visit each day'],
  ['weekly', 'Weekly', 'One backup on the first visit each week']
]

const sizeOf = (obj) => {
  const bytes = new Blob([JSON.stringify(obj)]).size
  return bytes > 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function Backup() {
  const { db, createBackup, restoreBackup, deleteBackup, setBackupSchedule, resetDemo, toast } = useStore()
  const fileInput = useRef(null)
  const [restoring, setRestoring] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')

  const backups = db.backups || []
  const schedule = db.settings?.backupSchedule || 'off'

  const backupNow = () => {
    const entry = createBackup('Manual')
    if (entry) toast('Backup snapshot created')
  }

  const downloadSnapshot = (entry) => {
    download(`serviceline-backup-${entry.id}.json`, JSON.stringify(entry.data, null, 2), 'application/json')
    toast('Backup file downloaded')
  }

  const downloadCurrent = () => {
    const { backups: _drop, ...payload } = db
    download(`serviceline-backup-${todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json')
    toast('Backup file downloaded')
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      const payload = JSON.parse(await file.text())
      setRestoring({ payload, source: file.name, label: file.name })
    } catch {
      setError('That file is not valid JSON. Choose a backup file exported from Serviceline.')
    }
  }

  const doRestore = () => {
    const result = restoreBackup(restoring.payload, restoring.source)
    if (!result.ok) { setError(result.error); return }
    toast('Database restored')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Backup and restore</h1>
          <p>{backups.length} snapshot{backups.length === 1 ? '' : 's'} kept here · last backup {db.settings?.lastBackupAt ? new Date(db.settings.lastBackupAt).toLocaleString('en-GB') : 'never'}</p>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <button className="btn danger-ghost" onClick={() => setResetting(true)}>
            <Icon name="refresh" />Reset demo data
          </button>
          <button className="btn" onClick={downloadCurrent}><Icon name="download" />Download file</button>
          <button className="btn primary" onClick={backupNow}><Icon name="database" />Back up now</button>
        </div>
      </div>

      {error && <p className="banner crit"><Icon name="alert" /><span>{error}</span></p>}

      <div className="split">
        <section className="panel">
          <h2>Snapshots<span className="aux">kept in this browser</span></h2>
          <div className="body flush">
            {backups.length === 0 ? (
              <p className="empty">
                <Icon name="database" />
                No snapshots yet. Take one before importing data or making bulk changes.
              </p>
            ) : (
              <div className="rows">
                {backups.map((b) => (
                  <div className="row" key={b.id} style={{ cursor: 'default' }}>
                    <Pill tone={b.kind === 'Scheduled' ? 'maint' : 'flat'}>{b.kind}</Pill>
                    <span className="grow">
                      <span className="t"><span className="eid">{b.id}</span>{b.ts}</span>
                      <span className="sub">
                        {b.by} · {b.counts.equipment} items, {b.counts.records} records,
                        {' '}{b.counts.customers} customers, {b.counts.users} users · {sizeOf(b.data)}
                      </span>
                    </span>
                    <span className="row-actions">
                      <button className="icon-btn" title="Download this snapshot" aria-label={`Download ${b.id}`} onClick={() => downloadSnapshot(b)}>
                        <Icon name="download" />
                      </button>
                      <button className="icon-btn" title="Restore this snapshot" aria-label={`Restore ${b.id}`} onClick={() => setRestoring({ payload: b.data, source: b.id, label: `${b.kind} backup from ${b.ts}` })}>
                        <Icon name="refresh" />
                      </button>
                      <button className="icon-btn danger" title="Delete this snapshot" aria-label={`Delete ${b.id}`} onClick={() => setRemoving(b)}>
                        <Icon name="trash" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel">
            <h2>Scheduled backups</h2>
            <div className="body">
              <div className="radio-stack">
                {SCHEDULES.map(([value, label, blurb]) => (
                  <label key={value} className={`radio-card ${schedule === value ? 'on' : ''}`}>
                    <input
                      type="radio" name="schedule" value={value}
                      checked={schedule === value}
                      onChange={() => { setBackupSchedule(value); toast(`Schedule set to ${label.toLowerCase()}`) }}
                    />
                    <span>
                      <b>{label}</b>
                      <span className="muted">{blurb}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                A scheduled backup runs when the app is next opened and one is overdue —
                the browser stand-in for a nightly job on the server. Only the {' '}
                {backups.length >= 5 ? 'five' : 'five'} most recent snapshots are kept.
              </p>
            </div>
          </section>

          <section className="panel">
            <h2>Restore from a file</h2>
            <div className="body">
              <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={pickFile} />
              <button className="btn block" onClick={() => fileInput.current?.click()}>
                <Icon name="upload" />Choose a backup file
              </button>
              <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                Restoring replaces every equipment, customer, site, user and service record
                with the contents of the backup, including the accounts and passwords it
                held. Take a snapshot first.
              </p>
            </div>
          </section>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        Backup and restore is restricted to accounts holding the “back up and restore”
        permission, and every backup and restore is written to the audit trail with the
        date, time and account that performed it.
      </p>

      {restoring && (
        <Confirm
          title="Restore this backup?"
          body={`Everything currently in the system will be replaced by ${restoring.label}. Any equipment, service records or accounts added since that backup will be lost. This cannot be undone.`}
          confirmLabel="Restore"
          onConfirm={doRestore}
          onClose={() => setRestoring(null)}
        />
      )}

      {resetting && (
        <Confirm
          title="Reset the demo data?"
          body="Everything returns to the original sample dataset, including the demo accounts and their passwords. Snapshots are cleared and you will be signed out."
          confirmLabel="Reset everything"
          onConfirm={resetDemo}
          onClose={() => setResetting(false)}
        />
      )}

      {removing && (
        <Confirm
          title={`Delete snapshot ${removing.id}?`}
          body="The snapshot is removed from this browser. If you downloaded it as a file, that copy is unaffected."
          confirmLabel="Delete snapshot"
          onConfirm={() => { deleteBackup(removing.id); toast('Snapshot deleted') }}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}
