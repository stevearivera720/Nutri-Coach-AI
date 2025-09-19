export async function callOpenAI(prompt: string, profile: any, system?: string) {
  const provider = localStorage.getItem('provider') || 'openai'

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

  // Default: OpenAI API
  const apiKey = localStorage.getItem('openai_api_key')
  if (!apiKey) throw new Error('OpenAI API key not set. Please set it in settings.')
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

