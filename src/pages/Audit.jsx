import { useStore } from '../lib/store.jsx'

export default function Audit() {
  const { db, resetDemo } = useStore()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p>{db.audit.length} recorded actions · newest first</p>
        </div>
        <button className="btn" onClick={resetDemo}>Reset demo data</button>
      </div>

      <section className="panel">
        <div className="body flush">
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>When</th><th>User</th><th>Action</th><th>Equipment</th><th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {db.audit.map((a) => (
                  <tr key={a.id}>
                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{a.ts}</td>
                    <td>{a.user}</td>
                    <td><b style={{ fontWeight: 600 }}>{a.action}</b></td>
                    <td className="eid">{a.entity}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        Sign-in, sign-out, equipment access, service records, requests, QR generation and
        report exports are all recorded against the individual account that performed them.
        This is why individual logins matter more than a shared engineer account.
      </p>
    </>
  )
}
