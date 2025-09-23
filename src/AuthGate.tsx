import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data?.session ?? null)
      } catch (err) {
        console.warn('Supabase session load failed', err)
      } finally {
        setLoading(false)
      }
    }
    init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      mounted = false
      try { data.subscription?.unsubscribe() } catch (e) { /* ignore */ }
    }
  }, [])

  async function signInWithGitHub() {
    // Redirect flow - make sure redirect URI is configured in Supabase
    try {
      setError(null)
      const res = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } })
      if ((res as any)?.error) {
        setError((res as any).error.message || 'Sign in failed')
      }
    } catch (err: any) {
      setError(String(err?.message || err))
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) return <div>Loading...</div>

  if (!session) {
    return (
      <div style={{padding:20}}>
        <h3>Sign in with GitHub to continue</h3>
        <p>If you use GitHub Copilot, sign in with the same GitHub account.</p>
        <button onClick={signInWithGitHub} style={{padding:'10px 14px',borderRadius:8}}>Sign in with GitHub</button>
        {error ? (
          <div style={{marginTop:12,color:'crimson'}}>
            <strong>Sign-in error:</strong> {error}
            <div style={{marginTop:8,fontSize:13}}>If you see "Unsupported provider: provider is not enabled", open your Supabase dashboard → Authentication → Providers and enable GitHub (ensure client ID/secret are set and redirect URL is configured).</div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,alignItems:'center'}}>
        <div style={{fontSize:12,opacity:0.8}}>Signed in as {session.user?.email}</div>
        <button onClick={signOut} style={{padding:'6px 10px',borderRadius:8}}>Sign out</button>
      </div>
      {children}
    </div>
  )
}
