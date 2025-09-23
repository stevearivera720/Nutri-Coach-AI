import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Settings from './Settings'
import './styles.css'
import AuthGate from './AuthGate'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {
      // short-term: default to USDA provider when no provider is configured to avoid OpenAI quota issues
      (() => { if (!localStorage.getItem('provider')) localStorage.setItem('provider','usda'); return null })()
    }
    <AuthGate>
      <App />
    </AuthGate>
  </React.StrictMode>
)
