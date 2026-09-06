import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// On GitHub Pages a project site is served from https://<user>.github.io/<repo>/,
// so assets need that prefix. The deploy workflow sets VITE_BASE to "/<repo>/".
// Locally it stays "/" so `npm run dev` works untouched.
const base = process.env.VITE_BASE || '/'

// Browsers only hand out the camera on a secure origin, and a phone reaching
// this machine over Wi-Fi is not "localhost" — so `npm run dev:phone` serves
// HTTPS with a self-signed certificate. Plain `npm run dev` stays on HTTP,
// which is fine for desktop work and avoids the certificate warning.
const useHttps = process.env.VITE_HTTPS === '1'

export default defineConfig({
  plugins: [react(), useHttps && basicSsl()].filter(Boolean),
  base,
  server: {
    host: true, // bind to the LAN address as well as localhost
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  },
  build: { outDir: 'dist', sourcemap: false }
})
