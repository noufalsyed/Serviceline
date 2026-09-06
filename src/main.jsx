import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { StoreProvider } from './lib/store.jsx'
import './styles.css'

// HashRouter, not BrowserRouter: GitHub Pages serves static files only and
// cannot rewrite /e/FE-000125 back to index.html, so a scanned deep link has
// to live after the hash.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>
)
