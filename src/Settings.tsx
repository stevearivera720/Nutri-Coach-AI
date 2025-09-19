import React, { useState, useEffect } from 'react'

export default function Settings() {
  const [key, setKey] = useState(localStorage.getItem('openai_api_key') || '')
  const [provider, setProvider] = useState(localStorage.getItem('provider') || 'openai')
  const [azureEndpoint, setAzureEndpoint] = useState(localStorage.getItem('azure_endpoint') || '')
  const [azureKey, setAzureKey] = useState(localStorage.getItem('azure_key') || '')
  const [azureDeployment, setAzureDeployment] = useState(localStorage.getItem('azure_deployment') || '')
  const [maxTokens, setMaxTokens] = useState(Number(localStorage.getItem('max_tokens')) || 32768)
  const [autoContinue, setAutoContinue] = useState(localStorage.getItem('auto_continue') === 'true')
  const [autoContinueCount, setAutoContinueCount] = useState(Number(localStorage.getItem('auto_continue_count')) || 2)
  const [openaiModel, setOpenaiModel] = useState(localStorage.getItem('openai_model') || 'gpt-5-mini-3')
  const [enableStartupSuggestions, setEnableStartupSuggestions] = useState(localStorage.getItem('enable_startup_suggestions') !== 'false')
  const [startupTopics, setStartupTopics] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('startup_quick_topics') || 'null') || ['almond milk','salmon','banana smoothie','quinoa salad'] } catch { return ['almond milk','salmon','banana smoothie','quinoa salad'] }
  })
  const [newTopic, setNewTopic] = useState('')

  useEffect(() => {
    console.log('Settings component mounted, current key length:', (key || '').length)
  }, [])

  function save() {
    if (provider === 'openai') {
      localStorage.setItem('openai_api_key', key.trim())
    } else {
      // save Azure config
      localStorage.setItem('azure_endpoint', azureEndpoint.trim())
      localStorage.setItem('azure_key', azureKey.trim())
      localStorage.setItem('azure_deployment', azureDeployment.trim())
    }
    localStorage.setItem('provider', provider)
    localStorage.setItem('max_tokens', String(maxTokens))
    localStorage.setItem('openai_model', openaiModel)
    localStorage.setItem('auto_continue', autoContinue ? 'true' : 'false')
    localStorage.setItem('auto_continue_count', String(autoContinueCount))
    localStorage.setItem('enable_startup_suggestions', enableStartupSuggestions ? 'true' : 'false')
    localStorage.setItem('startup_quick_topics', JSON.stringify(startupTopics))
    alert('Saved API key locally. The app will use it to call OpenAI.')
  }

  function clearKey() {
    localStorage.removeItem('openai_api_key')
    setKey('')
    alert('Cleared API key')
  }

  return (
    <div className="settings" style={{background:'linear-gradient(180deg,#fff,#fffefc)',padding:12,borderRadius:10}}>
      <div className="debug-banner" style={{background:'linear-gradient(90deg,var(--accent-2),var(--accent-4))',padding:8,borderRadius:6,marginBottom:8,color:'#111'}}>Settings</div>
      <div style={{marginBottom:8}}>
        <label style={{display:'block',fontWeight:600}}>Provider</label>
        <select value={provider} onChange={(e)=>setProvider(e.target.value)} aria-label="Select AI provider">
          <option value="openai">OpenAI (api.openai.com)</option>
          <option value="azure">Azure OpenAI</option>
        </select>
      </div>
      <h3>Settings</h3>
      {provider === 'openai' ? (
        <div className="field">
          <label>OpenAI API Key</label>
          <input value={key} onChange={(e)=>setKey(e.target.value)} placeholder="sk-..." />
        </div>
      ) : (
        <div>
          <div className="field">
            <label>Azure OpenAI Endpoint</label>
            <input value={azureEndpoint} onChange={(e)=>setAzureEndpoint(e.target.value)} placeholder="https://your-resource.openai.azure.com/..." />
          </div>
          <div className="field">
            <label>Azure API Key</label>
            <input value={azureKey} onChange={(e)=>setAzureKey(e.target.value)} placeholder="Azure key" />
          </div>
          <div className="field">
            <label>Deployment / Model name</label>
            <input value={azureDeployment} onChange={(e)=>setAzureDeployment(e.target.value)} placeholder="deployment-name or model" />
          </div>
          <div className="muted">If your endpoint is a full Responses API URL (contains <code>/responses</code>), paste the full URL into Endpoint and leave Deployment empty. Otherwise provide Endpoint (e.g. <code>https://&lt;resource-name&gt;.openai.azure.com</code>), Key, and the Deployment name (your model deployment).</div>
        </div>
      )}
      <div className="field">
        <label>Max completion tokens</label>
        <input type="number" value={maxTokens} onChange={(e)=>setMaxTokens(Number(e.target.value))} min={50} max={130000} />
        <div className="muted">Max completion tokens to request (Azure uses max_completion_tokens). Your account supports up to 130,000 tokens/minute; set per-request token limit here.</div>
      </div>
      <div className="field">
        <label>Model (OpenAI / Azure deployment)</label>
        <select value={openaiModel} onChange={(e)=>setOpenaiModel(e.target.value)}>
          <option value="gpt-5-mini-3">gpt-5-mini-3</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
        </select>
        <div className="muted">Select the model or deployment name. For Azure deployments, set the deployment name here and the Azure endpoint/key above.</div>
      </div>
      <div className="field">
        <label><input type="checkbox" checked={enableStartupSuggestions} onChange={(e)=>setEnableStartupSuggestions(e.target.checked)} /> Enable startup suggestions</label>
        <div style={{marginTop:8}}>
          <label>Quick topics (click Add to append)</label>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <input value={newTopic} onChange={(e)=>setNewTopic(e.target.value)} placeholder="e.g., chia pudding" />
            <button onClick={()=>{ if(newTopic.trim()){ setStartupTopics(s=>[...s,newTopic.trim()]); setNewTopic('') } }}>Add</button>
          </div>
          <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:8}}>
            {startupTopics.map((t,i)=> (
              <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,background:'#fffef8',padding:'6px 8px',borderRadius:999}}>
                <span style={{fontSize:12}}>{t}</span>
                <button onClick={()=>setStartupTopics(s=>s.filter(x=>x!==t))} style={{background:'transparent',border:0,cursor:'pointer'}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="field">
        <label><input type="checkbox" checked={autoContinue} onChange={(e)=>setAutoContinue(e.target.checked)} /> Auto-continue when response is truncated</label>
        <div style={{marginTop:8}}>
          <label>Auto-continue max times</label>
          <input type="number" value={autoContinueCount} onChange={(e)=>setAutoContinueCount(Number(e.target.value))} min={1} max={10} />
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={save}>Save key</button>
        <button onClick={clearKey} style={{background:'#eee'}}>Clear</button>
        <button onClick={()=>{ window.dispatchEvent(new CustomEvent('nutri:closeSettings')) }} style={{background:'transparent',border:'1px solid rgba(0,0,0,0.06)'}}>Back to home</button>
      </div>
      <p className="muted">The key is stored locally in your browser only. Do not paste sensitive keys into public machines.</p>
    </div>
  )
}
