import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages a project site is served from https://<user>.github.io/<repo>/,
// so assets need that prefix. The deploy workflow sets VITE_BASE to "/<repo>/".
// Locally it stays "/" so `npm run dev` works untouched.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: { outDir: 'dist', sourcemap: false }
})
