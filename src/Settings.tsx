import React, { useState, useEffect } from 'react'

export default function Settings() {
  const [key, setKey] = useState(localStorage.getItem('openai_api_key') || '')
  const [provider, setProvider] = useState(localStorage.getItem('provider') || 'azure')
  const [azureEndpoint, setAzureEndpoint] = useState(localStorage.getItem('azure_endpoint') || '')
  const [azureKey, setAzureKey] = useState(localStorage.getItem('azure_key') || '')
  const [azureDeployment, setAzureDeployment] = useState(localStorage.getItem('azure_deployment') || '')
  const [azureChatApiVersion, setAzureChatApiVersion] = useState(localStorage.getItem('azure_chat_api_version') || '2023-10-01-preview')
  const [azureResponsesApiVersion, setAzureResponsesApiVersion] = useState(localStorage.getItem('azure_responses_api_version') || '2025-04-01-preview')
  const [maxTokens, setMaxTokens] = useState(Number(localStorage.getItem('max_tokens')) || 32768)
  const [autoContinue, setAutoContinue] = useState(localStorage.getItem('auto_continue') === 'true')
  const [autoContinueCount, setAutoContinueCount] = useState(Number(localStorage.getItem('auto_continue_count')) || 2)
  const [openaiModel, setOpenaiModel] = useState(localStorage.getItem('openai_model') || 'gpt-5-mini')
  const [usdaKey, setUsdaKey] = useState(localStorage.getItem('usda_api_key') || '')
  const [usdaValid, setUsdaValid] = useState<boolean | null>(null)
  const [hfKey, setHfKey] = useState(localStorage.getItem('hf_api_key') || '')
  const [hfModel, setHfModel] = useState(localStorage.getItem('hf_model') || '')
  const [hfValid, setHfValid] = useState<boolean | null>(null)
  const [enableStartupSuggestions, setEnableStartupSuggestions] = useState(localStorage.getItem('enable_startup_suggestions') !== 'false')
  const [startupTopics, setStartupTopics] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('startup_quick_topics') || 'null') || ['almond milk','salmon','banana smoothie','quinoa salad'] } catch { return ['almond milk','salmon','banana smoothie','quinoa salad'] }
  })
  const [newTopic, setNewTopic] = useState('')

  useEffect(() => {
    console.log('Settings component mounted, current key length:', (key || '').length)
  }, [])

  // Auto-save on changes to avoid losing values on refresh
  useEffect(() => {
    try {
      localStorage.setItem('provider', provider)
      localStorage.setItem('max_tokens', String(maxTokens))
      localStorage.setItem('openai_model', openaiModel)
      localStorage.setItem('auto_continue', autoContinue ? 'true' : 'false')
      localStorage.setItem('auto_continue_count', String(autoContinueCount))
      localStorage.setItem('enable_startup_suggestions', enableStartupSuggestions ? 'true' : 'false')
      localStorage.setItem('startup_quick_topics', JSON.stringify(startupTopics))
      if (provider === 'openai') {
        if (key.trim()) localStorage.setItem('openai_api_key', key.trim())
      } else if (provider === 'azure') {
        if (azureEndpoint.trim()) localStorage.setItem('azure_endpoint', azureEndpoint.trim())
        if (azureKey.trim()) localStorage.setItem('azure_key', azureKey.trim())
        if (azureDeployment.trim()) localStorage.setItem('azure_deployment', azureDeployment.trim())
        if (azureChatApiVersion.trim()) localStorage.setItem('azure_chat_api_version', azureChatApiVersion.trim())
        if (azureResponsesApiVersion.trim()) localStorage.setItem('azure_responses_api_version', azureResponsesApiVersion.trim())
        // If deployment empty but model set, mirror it
        if (!azureDeployment.trim() && openaiModel.trim()) localStorage.setItem('azure_deployment', openaiModel.trim())
      }
      if (usdaKey.trim()) localStorage.setItem('usda_api_key', usdaKey.trim())
      if (hfKey.trim()) localStorage.setItem('hf_api_key', hfKey.trim())
      if (hfModel.trim()) localStorage.setItem('hf_model', hfModel.trim())
    } catch (e) {
      // ignore storage failures (e.g., quota)
    }
  }, [provider, maxTokens, openaiModel, autoContinue, autoContinueCount, enableStartupSuggestions, startupTopics, key, azureEndpoint, azureKey, azureDeployment, azureChatApiVersion, azureResponsesApiVersion, usdaKey, hfKey, hfModel])

  function save() {
    if (provider === 'openai') {
      localStorage.setItem('openai_api_key', key.trim())
    } else if (provider === 'azure') {
      // save Azure config
      localStorage.setItem('azure_endpoint', azureEndpoint.trim())
      localStorage.setItem('azure_key', azureKey.trim())
      localStorage.setItem('azure_deployment', azureDeployment.trim())
      localStorage.setItem('azure_chat_api_version', azureChatApiVersion.trim())
      localStorage.setItem('azure_responses_api_version', azureResponsesApiVersion.trim())
      // If user didn't fill the deployment field, fall back to Model as deployment
      if (!azureDeployment.trim() && openaiModel.trim()) {
        localStorage.setItem('azure_deployment', openaiModel.trim())
      }
    }
    if (usdaKey.trim()) {
      localStorage.setItem('usda_api_key', usdaKey.trim())
    }
    if (hfKey.trim()) {
      localStorage.setItem('hf_api_key', hfKey.trim())
    }
    if (hfModel.trim()) {
      localStorage.setItem('hf_model', hfModel.trim())
    }
    localStorage.setItem('provider', provider)
    localStorage.setItem('max_tokens', String(maxTokens))
    localStorage.setItem('openai_model', openaiModel)
    localStorage.setItem('auto_continue', autoContinue ? 'true' : 'false')
    localStorage.setItem('auto_continue_count', String(autoContinueCount))
    localStorage.setItem('enable_startup_suggestions', enableStartupSuggestions ? 'true' : 'false')
    localStorage.setItem('startup_quick_topics', JSON.stringify(startupTopics))
    alert('Saved settings locally.')
  }

  async function validateUSDA() {
    setUsdaValid(null)
    try {
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(usdaKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generalSearchInput: 'apple', pageSize: 1 }) })
      if (!res.ok) { setUsdaValid(false); return }
      const j = await res.json()
      if (j && j.foods && j.foods.length > 0) setUsdaValid(true)
      else setUsdaValid(false)
    } catch (err) {
      setUsdaValid(false)
    }
  }

  async function validateHF() {
    setHfValid(null)
    try {
      if (!hfKey || !hfModel) { setHfValid(false); return }
      const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(hfModel)}`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hfKey}` }, body: JSON.stringify({ inputs: 'Hello', parameters: { max_new_tokens: 1 } }) })
      if (!res.ok) { setHfValid(false); return }
      setHfValid(true)
    } catch (err) {
      setHfValid(false)
    }
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
            <label>Azure Chat API Version</label>
            <input value={azureChatApiVersion} onChange={(e)=>setAzureChatApiVersion(e.target.value)} placeholder="2023-10-01-preview" />
          </div>
          <div className="field">
            <label>Azure Responses API Version</label>
            <input value={azureResponsesApiVersion} onChange={(e)=>setAzureResponsesApiVersion(e.target.value)} placeholder="2025-04-01-preview" />
          </div>
          <div className="field">
            <label>Azure API Key</label>
            <input value={azureKey} onChange={(e)=>setAzureKey(e.target.value)} placeholder="Azure key" />
          </div>
          <div className="field">
            <label>Deployment / Model name</label>
            <input value={azureDeployment} onChange={(e)=>setAzureDeployment(e.target.value)} placeholder="deployment-name or model" />
          </div>
          <div className="muted">If your endpoint is a Responses API URL (contains <code>/responses</code>), paste the base URL (with or without <code>?api-version=...</code>) and still set <b>Deployment / Model name</b> to your Azure deployment (e.g., <code>gpt-5-mini</code>). For Chat Completions, use the base endpoint (e.g. <code>https://&lt;resource-name&gt;.openai.azure.com</code>) and set the same deployment name.</div>
        </div>
      )}
      <div style={{marginTop:12}}>
        <h4>USDA (FoodData Central) — Optional</h4>
        <div className="field">
          <label>USDA API Key</label>
          <input value={usdaKey} onChange={(e)=>{ setUsdaKey(e.target.value); setUsdaValid(null) }} placeholder="USDA API key" />
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={validateUSDA}>Validate USDA key</button>
          {usdaValid === true ? <span style={{color:'green'}}>Valid</span> : usdaValid === false ? <span style={{color:'crimson'}}>Invalid</span> : null}
        </div>
        <div className="muted">This is not required for the AI assistant. Only fill this if you want to use USDA data lookups for nutrition details.</div>
      </div>
      <div style={{marginTop:12}}>
        <h4>Hugging Face Inference</h4>
        <div className="field">
          <label>HF API Key</label>
          <input value={hfKey} onChange={(e)=>{ setHfKey(e.target.value); setHfValid(null) }} placeholder="HF API key (starts with hf_...)" />
        </div>
        <div className="field">
          <label>HF Model</label>
          <input value={hfModel} onChange={(e)=>{ setHfModel(e.target.value); setHfValid(null) }} placeholder="model name (e.g. google/flan-t5-large)" />
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={validateHF}>Validate HF key & model</button>
          {hfValid === true ? <span style={{color:'green'}}>Valid</span> : hfValid === false ? <span style={{color:'crimson'}}>Invalid</span> : null}
        </div>
      </div>
      <div className="field">
        <label>Max completion tokens</label>
        <input type="number" value={maxTokens} onChange={(e)=>setMaxTokens(Number(e.target.value))} min={50} max={130000} />
        <div className="muted">Max completion tokens to request (Azure uses max_completion_tokens). Your account supports up to 130,000 tokens/minute; set per-request token limit here.</div>
      </div>
      <div className="field">
        <label>Model (OpenAI / Azure deployment)</label>
        <input list="model-suggestions" value={openaiModel} onChange={(e)=>setOpenaiModel(e.target.value)} placeholder="e.g., gpt-5-mini" />
        <datalist id="model-suggestions">
          <option value="gpt-5-mini" />
          <option value="gpt-5-mini-3" />
          <option value="gpt-4o-mini" />
          <option value="gpt-4o" />
        </datalist>
        <div className="muted">Type the exact model or Azure <b>deployment</b> name. For Azure, this value can double as the deployment name if the dedicated field is left blank.</div>
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
  <button onClick={save}>Save settings</button>
        <button onClick={clearKey} style={{background:'#eee'}}>Clear</button>
        <button onClick={()=>{ window.dispatchEvent(new CustomEvent('nutri:closeSettings')) }} style={{background:'transparent',border:'1px solid rgba(0,0,0,0.06)'}}>Back to home</button>
      </div>
      <p className="muted">The key is stored locally in your browser only. Do not paste sensitive keys into public machines.</p>
    </div>
  )
}
