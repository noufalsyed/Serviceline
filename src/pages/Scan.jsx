import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { parseScan } from '../lib/qr.js'
import { useData, useStore } from '../lib/store.jsx'

const READER_ID = 'qr-reader'

export default function Scan() {
  const navigate = useNavigate()
  const { log } = useStore()
  const { myEquipment } = useData()

  const [phase, setPhase] = useState('starting') // starting | scanning | denied | unavailable
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState('')
  const handled = useRef(false)

  useEffect(() => {
    let scanner
    let disposed = false

    const open = (id, how) => {
      if (handled.current) return
      handled.current = true
      log('QR scanned', id, how)
      navigate(`/e/${id}`, { replace: true })
    }

    const onDecode = (text) => {
      const id = parseScan(text)
      if (!id) {
        setMessage('That code is not a Serviceline equipment tag.')
        return
      }
      const stop = scanner?.getState?.() === 2 ? scanner.stop() : Promise.resolve()
      stop.catch(() => {}).finally(() => open(id, 'Camera scan'))
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase('unavailable')
        return
      }
      scanner = new Html5Qrcode(READER_ID, { verbose: false })
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            aspectRatio: 1,
            qrbox: (w, h) => {
              const side = Math.round(Math.min(w, h) * 0.68)
              return { width: side, height: side }
            }
          },
          onDecode,
          () => {} // per-frame misses are normal; nothing to report
        )
        if (disposed) { await scanner.stop() } else { setPhase('scanning') }
      } catch (err) {
        if (disposed) return
        const text = String(err?.message || err)
        setPhase(/permission|denied|notallowed/i.test(text) ? 'denied' : 'unavailable')
      }
    }

    start()

    return () => {
      disposed = true
      if (!scanner) return
      const state = scanner.getState?.()
      if (state === 2 || state === 3) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      } else {
        try { scanner.clear() } catch { /* nothing rendered yet */ }
      }
    }
  }, [log, navigate])

  const openManual = (value) => {
    const id = parseScan(value)
    if (!id) {
      setMessage('Enter an equipment ID such as FE-000125.')
      return
    }
    handled.current = true
    log('QR scanned', id, 'Manual entry')
    navigate(`/e/${id}`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Scan equipment</h1>
          <p>Point the camera at the QR label fixed to the equipment.</p>
        </div>
        <button className="btn ghost" onClick={() => navigate(-1)}>
          <Icon name="back" />Back
        </button>
      </div>

      <div className="panel">
        <div className="body">
          <div className="scan-stage">
            <div id={READER_ID} style={{ width: '100%' }} />
            {phase === 'scanning' && (
              <div className="reticle"><span /><span /><span /><span /></div>
            )}
            {phase === 'starting' && <p className="muted" style={{ position: 'absolute' }}>Starting camera…</p>}
            {phase === 'denied' && (
              <p className="muted" style={{ position: 'absolute', padding: '0 24px', textAlign: 'center' }}>
                Camera access was blocked. Allow it in your browser's site settings, or enter the ID below.
              </p>
            )}
            {phase === 'unavailable' && (
              <p className="muted" style={{ position: 'absolute', padding: '0 24px', textAlign: 'center' }}>
                No camera available here. Cameras also need an HTTPS address — enter the ID below instead.
              </p>
            )}
          </div>

          {phase === 'scanning' && (
            <p className="scan-hint">Hold the phone about 15 cm from the label. It reads automatically.</p>
          )}
          {message && <p className="field-error" style={{ textAlign: 'center', marginTop: 10 }}>{message}</p>}

          <div className="scan-fallback">
            <div className="grid-2">
              <label className="field">
                <span>Enter equipment ID</span>
                <input
                  type="text"
                  value={manual}
                  placeholder="FE-000125"
                  onChange={(e) => { setManual(e.target.value); setMessage('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') openManual(manual) }}
                />
              </label>
              <label className="field">
                <span>Or pick a tag from this demo</span>
                <select defaultValue="" onChange={(e) => e.target.value && openManual(e.target.value)}>
                  <option value="">Select equipment…</option>
                  {myEquipment.map((e) => (
                    <option key={e.id} value={e.id}>{e.id} — {e.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="btn primary block"
              style={{ marginTop: 12 }}
              onClick={() => openManual(manual)}
            >
              <Icon name="chevron" />Open equipment
            </button>
          </div>

          <p className="muted" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
            The label carries an identifier and nothing more. Service history is served from
            the database only after sign-in and a customer/site permission check.
          </p>
        </div>
      </div>
    </>
  )
}
