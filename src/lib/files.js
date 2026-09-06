/** Shrink a camera photo so a visit's evidence fits in browser storage. */
export function downscale(file, max = 720, quality = 0.62) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a readable image'))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve({ name: file.name, dataUrl: canvas.toDataURL('image/jpeg', quality) })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function toCSV(cols, rows) {
  const cell = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(','), ...rows.map((r) => r.map(cell).join(','))].join('\r\n')
}

export function download(filename, data, type = 'text/csv;charset=utf-8') {
  const blob = data instanceof Blob ? data : new Blob(['﻿', data], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Compose a print-ready PNG label around an already-rendered QR canvas. */
export function labelPNG(qrCanvas, { id, name, customer, url }) {
  const W = 520
  const H = 700
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')

  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, H)
  g.strokeStyle = '#D5DEE0'
  g.lineWidth = 3
  g.strokeRect(14, 14, W - 28, H - 28)

  if (qrCanvas) g.drawImage(qrCanvas, (W - 340) / 2, 66, 340, 340)

  g.textAlign = 'center'
  g.fillStyle = '#141B1E'
  g.font = '600 40px "IBM Plex Mono", monospace'
  g.fillText(id, W / 2, 474)

  g.fillStyle = '#4B595E'
  g.font = '500 21px "IBM Plex Sans", sans-serif'
  g.fillText(clip(name, 36), W / 2, 510)

  g.fillStyle = '#7E8D92'
  g.font = '400 18px "IBM Plex Sans", sans-serif'
  g.fillText(clip(customer, 40), W / 2, 540)

  g.font = '400 14px "IBM Plex Mono", monospace'
  g.fillText(clip(url, 52), W / 2, 604)

  g.fillStyle = '#D5551A'
  g.font = '600 14px "IBM Plex Sans", sans-serif'
  g.fillText('SCAN TO VIEW SERVICE HISTORY', W / 2, 646)

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'))
}

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || '')
