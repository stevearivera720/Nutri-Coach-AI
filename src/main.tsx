import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Settings from './Settings'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>
      <App />
    </div>
  </React.StrictMode>
)
