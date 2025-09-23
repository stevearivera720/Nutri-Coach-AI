export async function callOpenAI(prompt: string, profile: any, system?: string) {
  const provider = localStorage.getItem('provider') || 'openai'

  if (provider === 'usda') {
    // Use USDA FoodData Central to fetch nutrient data and classify
    const { classifyWithUSDA } = await import('./usda')
    return classifyWithUSDA(prompt)
  }

  const messages = [
    { role: 'system', content: system || 'You are a nutrition assistant.' },
    { role: 'user', content: `Profile: ${JSON.stringify(profile)}\nQuestion: ${prompt}` }
  ]

  if (provider === 'azure') {
    const configured = Number(localStorage.getItem('max_tokens')) || 300
    const endpoint = localStorage.getItem('azure_endpoint')
    const key = localStorage.getItem('azure_key')
    const deployment = localStorage.getItem('azure_deployment')
    if (!endpoint || !key) throw new Error('Azure OpenAI endpoint or key not set. Please set them in Settings.')

    // If user pasted a full Responses API URL (contains /responses), use it directly
    if (endpoint.includes('/responses')) {
      const url = endpoint + (endpoint.includes('?') ? '&' : '?') + 'api-version=2025-04-01-preview'
      console.log('[openai] Azure Responses request ->', url)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': key
        },
  // Use Responses API format and set max_completion_tokens for Azure models that expect it
  body: JSON.stringify({ input: `${JSON.stringify(profile)}\nQuestion: ${prompt}`, parameters: { max_completion_tokens: configured } })
      })
      const text = await res.text()
      if (!res.ok) {
        console.error('[openai] Azure Responses error', res.status, text)
        throw new Error(JSON.stringify({ status: res.status, body: text, hint: 'Check that your Responses endpoint is correct, the api-version is supported, and the resource exists in the specified region.' }))
      }
      let data
      try { data = JSON.parse(text) } catch { data = text }
      // Try to extract a text output
      return data?.output?.[0]?.content || JSON.stringify(data)
    }

    // Otherwise call chat completions on deployments
    if (!deployment) throw new Error('Azure deployment not set. Please set it in Settings.')
    const url = endpoint.replace(/\/$/, '') + `/openai/deployments/${deployment}/chat/completions?api-version=2023-10-01-preview`
    console.log('[openai] Azure chat request ->', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key
      },
  // Some Azure-deployed models expect 'max_completion_tokens' instead of 'max_tokens'
  body: JSON.stringify({ messages, max_completion_tokens: configured })
    })
    const text = await res.text()
    if (!res.ok) {
      console.error('[openai] Azure chat error', res.status, text)
      throw new Error(JSON.stringify({ status: res.status, body: text, hint: 'Check deployment name, endpoint host, api-key, and api-version. 404 usually means the deployment or path is incorrect.' }))
    }
    let data
    try { data = JSON.parse(text) } catch { data = text }
    const choice = data?.choices?.[0]
    let content = choice?.message?.content || ''
    const finish = choice?.finish_reason
    if ((!content || content === '') && finish === 'length') {
      const hint = '\n\n[Response truncated by model (finish_reason=length). Consider increasing max tokens or shortening prompt. You can also click "Continue" to ask the assistant to finish the response.]'
      content = (content || '') + hint
    }
    return content || JSON.stringify(data)
  }

  // Hugging Face Inference (user-provided key + model)
  if (provider === 'hf') {
    const hfKey = localStorage.getItem('hf_api_key')
    const hfModel = localStorage.getItem('hf_model')
    if (!hfKey || !hfModel) throw new Error('Hugging Face API key or model not set. Please set them in Settings.')
    // Try to call the HF Inference API for text generation
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(hfModel)}`
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hfKey}` }, body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: Number(localStorage.getItem('max_tokens') || 150) } }) })
      const txt = await res.text()
      if (!res.ok) {
        // try parse json error
        try { const j = JSON.parse(txt); throw new Error(JSON.stringify(j)) } catch { throw new Error(txt) }
      }
      // HF often returns JSON or plain text; attempt to parse
      try {
        const j = JSON.parse(txt)
        // For text-generation models, HF may return [{generated_text: '...'}]
        if (Array.isArray(j) && j[0]?.generated_text) return j[0].generated_text
        if (j?.generated_text) return j.generated_text
        if (j?.text) return j.text
        return JSON.stringify(j)
      } catch (e) {
        return txt
      }
    } catch (e) {
      throw e
    }
  }

  // Default: OpenAI API
  const apiKey = localStorage.getItem('openai_api_key')
  if (!apiKey) {
    // Graceful fallback: if USDA key exists, use USDA provider as a fallback
    const usdaKey = localStorage.getItem('usda_api_key')
    if (usdaKey) {
      const { classifyWithUSDA } = await import('./usda')
      return classifyWithUSDA(prompt)
    }
    // Optional demo fallback
    if (localStorage.getItem('demo_mode') === 'true') {
      return 'Demo mode: OpenAI API key not set. This is a demo response. Paste your OpenAI key in Settings for live results.'
    }
    throw new Error('OpenAI API key not set. Please set it in Settings (openai_api_key) or paste a USDA API key in Settings to use the USDA provider.')
  }
  const configured = Number(localStorage.getItem('max_tokens')) || 300
  const model = localStorage.getItem('openai_model') || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, max_tokens: configured })
  })
  if (!res.ok) {
    const text = await res.text()
    // Try to parse JSON error to check for quota/billing issues
    try {
      const json = JSON.parse(text)
      const err = json?.error
      if (err && err.code === 'insufficient_quota') {
        // Try server-side HF proxy if available (requires server running with HF_API_KEY)
        try {
          const hfRes = await fetch('/api/hf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
          if (hfRes.ok) {
            const j = await hfRes.json()
            return j.text || JSON.stringify(j)
          }
        } catch (hfErr) {
          // ignore and fallback
        }
        // Optional demo fallback if developer enabled it in localStorage
        if (localStorage.getItem('demo_mode') === 'true') {
          // Return a short canned demo response so the UI remains usable
          return 'Demo mode: the configured OpenAI account has exceeded its quota. This is a demo response. To use the live assistant, check your OpenAI billing or paste your own API key in Settings.'
        }
        throw new Error('OpenAI quota exceeded (insufficient_quota). Please check your OpenAI plan/billing or paste a personal API key in Settings to continue.');
      }
    } catch (e) {
      // fall through and throw raw text if it wasn't JSON or parsing failed
    }
    throw new Error(text)
  }
  const data = await res.json()
  const choice = data?.choices?.[0]
  let content = choice?.message?.content || ''
  const finish = choice?.finish_reason
  if ((!content || content === '') && finish === 'length') {
    const hint = '\n\n[Response truncated by model (finish_reason=length). Consider increasing max tokens or shortening prompt. You can also click "Continue" to ask the assistant to finish the response.]'
    content = (content || '') + hint
  }
  return content || JSON.stringify(data)
}

