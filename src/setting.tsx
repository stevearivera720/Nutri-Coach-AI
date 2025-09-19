import React, { useState } from 'react'

export default function Settings() {
  const [key, setKey] = useState(localStorage.getItem('openai_api_key') || '')

  function save() {
    localStorage.setItem('openai_api_key', key.trim())
    alert('Saved API key locally. The app will use it to call OpenAI.')
  }

  function clearKey() {
    localStorage.removeItem('openai_api_key')
    setKey('')
    alert('Cleared API key')
  }

  return (
    <div className="settings">
      <h3>Settings</h3>
      <div className="field">
        <label>OpenAI API Key</label>
        <input value={key} onChange={(e)=>setKey(e.target.value)} placeholder="sk-..." />
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={save}>Save key</button>
        <button onClick={clearKey} style={{background:'#eee'}}>Clear</button>
      </div>
      <p className="muted">The key is stored locally in your browser only. Do not paste sensitive keys into public machines.</p>
    </div>
  )
}
