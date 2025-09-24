import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Settings from './Settings'
import './styles.css'
import AuthGate from './AuthGate'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {
      // default to Azure provider when no provider is configured
      (() => { if (!localStorage.getItem('provider')) localStorage.setItem('provider','azure'); return null })()
    }
    {
      // Allow skipping the GitHub/Supabase auth gate in environments where
      // the auth redirect is inconvenient (for example GitHub Pages). The
      // skip can be enabled manually by setting localStorage.setItem('skip_auth','true')
      // or will be automatically enabled when the app is hosted on github.io.
      (() => {
        const skipFlag = localStorage.getItem('skip_auth') === 'true'
        const runningOnGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
        if (skipFlag || runningOnGitHubPages) {
          return <App />
        }
        return (
          <AuthGate>
            <App />
          </AuthGate>
        )
      })()
    }
  </React.StrictMode>
)
