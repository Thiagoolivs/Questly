import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { setupPwaUpdates } from './pwa-update.js'
import './design-system/tokens/index.css'
import './styles.css'

setupPwaUpdates()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
