import React, { useEffect, useState, useRef } from 'react'
import getFruitIcon from './icons'
import useStore from './store'
import { getProfile, saveProfile } from './storage'
import { callOpenAI } from './openai'
import Settings from './Settings'

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`badge ${color}`}>{children}</span>
}

export default function App() {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)

  const TRUNC_HINT = 'Response truncated by model (finish_reason=length)'
  const autoContinueRef = useRef<string | null>(null)
  const [heroInfo, setHeroInfo] = useState<any>(null)
  const [dailyTip, setDailyTip] = useState<string | null>(null)
  const [chipActive, setChipActive] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  function lastAssistantMessage() {
    for (let i = messages.length - 1; i >= 0; --i) {
      if (messages[i].from === 'assistant') return messages[i]
    }
    return null
  }

  function assistantIsTruncated() {
    const last = lastAssistantMessage()
    return !!(last && typeof last.text === 'string' && last.text.includes(TRUNC_HINT))
  }

  function parseClassification(text: string | undefined | null) {
    if (!text) return null
    const s = String(text)

    // 1) If the assistant included an explicit label like "Beneficial" / "Avoid" / "Neutral", use that.
    const explicit = s.match(/\b(Beneficial|Avoid|Neutral)\b/i)
    if (explicit && explicit[1]) {
      const tag = explicit[1].toLowerCase()
      if (tag === 'beneficial') return 'beneficial'
      if (tag === 'avoid') return 'avoid'
      if (tag === 'neutral') return 'neutral'
    }

    // 2) Prefer the signal in the first one or two sentences (avoid contradictory later clauses)
    const sentences = s.split(/(?<=[.!?])\s+/).slice(0, 2)
    for (const sent of sentences) {
      const t = sent.toLowerCase()
      if (/\b(avoid|do not|don't|not recommended|should not)\b/.test(t)) return 'avoid'
      if (/\b(beneficial|benefit|good for|recommended|healthy|suggests it is good)\b/.test(t)) return 'beneficial'
      if (/\bneutral\b/.test(t)) return 'neutral'
    }

    // 3) Fall back to scanning the whole reply
    const t = s.toLowerCase()
    if (/\b(avoid|do not|don't|not recommended|should not)\b/.test(t)) return 'avoid'
    if (/\b(beneficial|benefit|good for|recommended|healthy)\b/.test(t)) return 'beneficial'
    if (t.includes('neutral')) return 'neutral'
    return null
  }

  // Continuation loop helper: request up to maxAttempts continuations and return concatenated text
  async function continueLoop(maxAttempts: number) {
    const last = lastAssistantMessage()
    if (!last) return ''
    let cleaned = (last.text || '').replace(TRUNC_HINT, '').trim()
    let accumulated = ''
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const continuationPrompt = cleaned
        ? `Continue the following assistant response without repeating the truncation hint. Previous assistant text:\n\n${cleaned}\n\nContinue:`
        : 'Please continue the previous answer.'
      try {
        const res = await callOpenAI(continuationPrompt, profile, `You are a nutrition assistant. Continue the previous response.`)
        if (!res) break
        accumulated += (accumulated ? '\n\n' : '') + res
        // stop if continuation no longer contains truncation hint
        if (!res.includes(TRUNC_HINT)) break
        // append the continuation to cleaned so subsequent calls have more context
        cleaned = cleaned + '\n\n' + res
      } catch (err) {
        console.error('Continuation error', err)
        break
      }
    }
    return accumulated
  }

  useEffect(() => {
    const p = getProfile()
    if (p) setProfile(p)
  }, [setProfile])

  async function handleGetStarted() {
    try {
      const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/Healthy_diet'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Wikipedia fetch failed')
      const data = await res.json()
      setHeroInfo(data)
    } catch (err) {
      console.warn('Failed to load wiki summary', err)
      setHeroInfo({ title: 'Healthy diet', extract: 'Learn about balanced nutrition on Wikipedia.', content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Healthy_diet' } } })
    }
  }

  // Load a daily tip from a simple API (placeholder) or curated list
  async function loadDailyTip(){
    try{
      // Try server-side daily-tip endpoint first (avoids CORS). If unavailable, fall back to curated rotation.
      try{
        const base = localStorage.getItem('server_base') || ''
        const url = (base ? base.replace(/\/$/, '') : '') + '/daily-tip'
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (data && data.tip) { setDailyTip(data.tip); return }
        }
      }catch(e){ /* ignore and fallback */ }

      const tips = [
        'Include a variety of colorful vegetables to ensure diverse micronutrients.',
        'Choose whole grains over refined grains for better fiber and satiety.',
        'Aim for a palm-sized portion of protein at each meal to support muscle maintenance.'
      ]
      const idx = new Date().getDate() % tips.length
      setDailyTip(tips[idx])
    }catch(err){console.warn(err)}
  }

  // Listen for Settings 'Back to home' event
  useEffect(()=>{
    const handler = ()=> setShowSettings(false)
    window.addEventListener('nutri:closeSettings' as any, handler as any)
    return ()=> window.removeEventListener('nutri:closeSettings' as any, handler as any)
  }, [])

  // Load hero info immediately on startup
  useEffect(()=>{
    void handleGetStarted()
    void loadDailyTip()
  }, [])

  useEffect(() => {
    saveProfile(profile)
  }, [profile])

  // Auto-scroll chat to bottom when messages change or while assistant is replying
  useEffect(() => {
    try {
      const el = chatRef.current
      if (!el) return
      // use requestAnimationFrame for smoothness
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    } catch (err) {
      console.error('Auto-scroll failed', err)
    }
  }, [messages, isLoading])

  // Re-run classification for existing assistant messages when messages change
  useEffect(() => {
    try {
      setMessages((prev) => {
        let changed = false
        const next = prev.map((m) => {
          if (m.from !== 'assistant') return m
          const cls = parseClassification(m.text)
          if (m.classification !== cls) {
            changed = true
            return { ...m, classification: cls }
          }
          return m
        })
        return changed ? next : prev
      })
    } catch (err) {
      console.error('Reclassify messages failed', err)
    }
  }, [messages.length])

  async function handleAnalyze(prompt: string) {
    setIsLoading(true)
    const userMessage = { from: 'user', text: prompt }
    setMessages((m) => [...m, userMessage])
    const system = `You are a nutrition assistant. Use this user's health profile: ${JSON.stringify(profile)}. Classify the item as Beneficial, Neutral, or Avoid and give a short explanation.`
    setMessages((m) => [...m, { from: 'assistant', text: 'Analyzing...' }])
    try {
      const res = await callOpenAI(prompt, profile, system)
      const cls = parseClassification(res)
      setMessages((m) => [...m.slice(0, -1), { from: 'assistant', text: res, classification: cls }])
    } catch (err) {
      setMessages((m) => [...m.slice(0, -1), { from: 'assistant', text: 'Error: ' + String(err) }])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleContinue() {
    if (isLoading) return
    const autoEnabled = localStorage.getItem('auto_continue') === 'true'
    const maxAttempts = Number(localStorage.getItem('auto_continue_count') || (autoEnabled ? '2' : '1'))
    setIsLoading(true)
    // show user intent and temporary assistant placeholder
    const userMessage = { from: 'user', text: 'Please continue the previous answer.' }
    setMessages((m) => [...m, userMessage])
    setMessages((m) => [...m, { from: 'assistant', text: 'Analyzing...' }])
    try {
      const accumulated = await continueLoop(maxAttempts)
      if (accumulated) {
        const cls = parseClassification(accumulated)
        setMessages((m) => [...m.slice(0, -1), { from: 'assistant', text: accumulated, classification: cls }])
      } else {
        setMessages((m) => [...m.slice(0, -1), { from: 'assistant', text: 'No additional content returned.' }])
      }
    } catch (err) {
      setMessages((m) => [...m.slice(0, -1), { from: 'assistant', text: 'Error: ' + String(err) }])
    } finally {
      setIsLoading(false)
      // clear the auto-continue lock so future truncations can trigger again
      autoContinueRef.current = null
    }
  }

  // Try to fetch recipes from the curated article and return at least `count` items.
  async function fetchRecipesFromSource(count = 3, profileArg?: any) {
    const sourceUrl = 'https://www.thegoodtrade.com/features/clean-eating-recipes/'
    try {
      const res = await fetch(sourceUrl, { method: 'GET', mode: 'cors' })
      const text = await res.text()
      // parse HTML and extract links
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')
      // prefer article links, fallback to any anchor with the site host
      const anchors = Array.from(doc.querySelectorAll('article a[href], a[href]'))
        .map(a => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim() }))
        .filter(a => a.href && a.href.includes('thegoodtrade.com'))
      // dedupe and normalize
      const seen = new Set()
      const items: { title: string; href: string }[] = []
      for (const a of anchors) {
        let href = a.href
        if (href.startsWith('/')) href = 'https://www.thegoodtrade.com' + href
        if (!seen.has(href)) {
          seen.add(href)
          items.push({ title: a.text || href, href })
          if (items.length >= count) break
        }
      }
  if (items.length >= count) return items
      // fallback: try to find links that look like recipe posts
      const more = anchors
        .filter(a => /recipe|recipes|dish|food|meal/i.test(a.href) || /recipe/i.test(a.text))
        .map(a => ({ title: a.text || a.href, href: a.href.startsWith('/') ? 'https://www.thegoodtrade.com' + a.href : a.href }))
      for (const m of more) {
        if (items.length >= count) break
        if (!seen.has(m.href)) { seen.add(m.href); items.push(m) }
      }
      // basic filtering based on user profile: remove recipes whose title mentions allergies
      try {
        const allergies: string[] = (profileArg?.allergies || []).map((s: string) => s.toLowerCase())
        const prefers = ((profileArg?.custom || []) as string[]).map(s=>s.toLowerCase()).concat(((profileArg?.conditions || []) as string[]).map(s=>s.toLowerCase()))
        let filtered = items.filter(it => {
          const t = (it.title || '').toLowerCase()
          for (const a of allergies) if (a && t.includes(a)) return false
          return true
        })
        // rank items that match preference keywords higher
        filtered.sort((a,b)=>{
          const ta = (a.title||'').toLowerCase(); const tb = (b.title||'').toLowerCase()
          const sa = prefers.reduce((acc,k)=> acc + (k && ta.includes(k) ? 1:0), 0)
          const sb = prefers.reduce((acc,k)=> acc + (k && tb.includes(k) ? 1:0), 0)
          return sb - sa
        })
        return filtered.slice(0, Math.max(count, filtered.length))
      } catch (err) {
        return items.slice(0, Math.max(count, items.length))
      }
    } catch (err) {
      console.warn('Recipe fetch failed (likely CORS):', err)
      throw err
    }
  }

  // Public handler for the Recipe button: tries to fetch recipes and insert into chat.
  async function handleRecipeClick() {
    const desired = 3
    setIsLoading(true)
    // Add a user intent message
    setMessages(m => [...m, { from: 'user', text: 'Show me recipes' }])
    // placeholder assistant message while fetching
    setMessages(m => [...m, { from: 'assistant', text: 'Fetching recipe suggestions...' }])
    try {
      let items: { title: string; href: string }[] = []
      try {
        items = await fetchRecipesFromSource(desired, profile)
      } catch (err) {
        // CORS or network error: fall back to curated list (do NOT open a new tab)
        console.warn('Recipe fetch failed; using curated fallback', err)
        items = [
          { title: 'Healthy Weeknight Dinners (Allrecipes collection)', href: 'https://www.allrecipes.com/recipes/84/healthy-recipes/' },
          { title: 'BBC Good Food - Healthy recipes', href: 'https://www.bbcgoodfood.com/recipes/collection/healthy' },
          { title: 'Cookie and Kate - Healthy recipes', href: 'https://cookieandkate.com/best-healthy-recipes/' }
        ]
      }
      // insert a structured assistant message with recipes
      setMessages(m => [...m.slice(0, -1), { from: 'assistant', recipes: items } as any])
    } catch (err) {
      setMessages(m => [...m.slice(0, -1), { from: 'assistant', text: 'Unable to fetch recipes right now. Try opening the Recipes page.' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-trigger continuation when a truncated assistant message appears and auto-continue is enabled.
  useEffect(() => {
    try {
      if (!assistantIsTruncated()) return
      const last = lastAssistantMessage()
      const cleaned = last?.text.replace(TRUNC_HINT, '').trim() || ''
      const autoEnabled = localStorage.getItem('auto_continue') === 'true'
      if (!autoEnabled) return
      if (isLoading) return
      if (autoContinueRef.current === cleaned) return // already handled this truncated message
      // mark as handled and start continuation
      autoContinueRef.current = cleaned
      void handleContinue()
    } catch (err) {
      console.error('Auto-continue side effect error', err)
    }
  }, [messages])

  return (
    <div className="app">
      <header>
        <h1>NutriCoach AI</h1>
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>setShowSettings(s=>!s)} aria-pressed={showSettings}>Settings</button>
        </div>
      </header>

      <div className="hero-split">
        <div className="hero-left">
          <div className="logo">NutriCoach</div>
          <h2 className="hero-title">Eat fresh<br/>stay healthy</h2>
          <p className="hero-sub muted">Personalized nutrition guidance — quick, evidence-minded</p>
          <div style={{marginTop:18}}>
            <button className="hero-cta" onClick={()=>{ void handleGetStarted(); inputRef.current?.focus(); window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'}) }}>Get started</button>
          </div>
          <div className="hero-card" style={{marginTop:22}}>
            <p style={{margin:0,color:'rgba(255,255,255,0.9)'}}>Quick, personalized tips and food classification based on your profile. Find recipes and alternatives tailored to you.</p>
            <div style={{marginTop:12}}>
              <button className="hero-card-btn" onClick={()=>{ void handleRecipeClick() }}>Recipe</button>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-image" aria-hidden="true"></div>
          <div className="hero-info" aria-live="polite">
            {heroInfo ? (
              <div>
                <h3 style={{marginTop:0}}>{heroInfo.title}</h3>
                <p className="muted">{heroInfo.extract}</p>
                <p><a href={heroInfo.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Healthy_diet'} target="_blank" rel="noreferrer">Read more on Wikipedia</a></p>
                <div style={{marginTop:12, display:'flex', gap:10, alignItems:'center'}} aria-hidden>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',borderRadius:12}}>{getFruitIcon('apple',36)}</div>
                    <div style={{width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',borderRadius:12}}>{getFruitIcon('avocado',36)}</div>
                    <div style={{width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',borderRadius:12}}>{getFruitIcon('banana',36)}</div>
                  </div>
                  <div style={{color:'rgba(255,255,255,0.8)'}} className="muted">Healthy living visuals</div>
                </div>
              </div>
            ) : (
              <div className="hero-info-placeholder">
                <h3 style={{marginTop:0}}>Healthy eating tips</h3>
                <p className="muted">Click Get started to load short, useful guidance about healthy diets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <main>
        <section className="profile">
          <h2>Health profile</h2>
          <ProfileEditor profile={profile} setProfile={setProfile} />
        </section>

        <section className="chat">
          <div className="chat-window" role="log" aria-live="polite" ref={chatRef}>
            {messages.length === 0 ? (
              <div className="startup-panel">
                <h3>Welcome to NutriCoach AI</h3>
                <p className="muted">Get started with quick suggestions or view curated healthy recipes.</p>
                {dailyTip ? <div className="daily-tip" style={{marginTop:8}}><strong>Daily tip:</strong> {dailyTip}</div> : null}
                <div className="chips" style={{marginTop:12}}>
                  {((localStorage.getItem('enable_startup_suggestions') !== 'false') ? (JSON.parse(localStorage.getItem('startup_quick_topics') || 'null') || ['almond milk','salmon','banana smoothie','quinoa salad']) : []).map((q: string) => (
                    <button key={q} className={`chip ${chipActive===q?'active':''}`} onClick={() => { setQuery(q); setChipActive(q); setTimeout(()=>setChipActive(null),800); handleAnalyze(q); }}>
                      <span style={{width:20,height:20,marginRight:8,display:'inline-flex',alignItems:'center'}}>{getFruitIcon(q,20)}</span>
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{marginTop:12}}>
                  <button className="hero-card-btn" onClick={()=>{ void handleRecipeClick() }}>Show recipes</button>
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className={`message ${m.from}`} key={i}>
                  <div className="bubble">
                    {/* classification badge */}
                    {m.classification === 'beneficial' ? <span className="classification good">Beneficial</span> : null}
                    {m.classification === 'avoid' ? <span className="classification avoid">Avoid</span> : null}
                      {m.recipes ? (
                      <div>
                        <div style={{fontWeight:700,marginBottom:8}}>Recipe suggestions</div>
                        <ol>
                          {m.recipes.map((r: any, idx: number) => (
                            <li key={idx} style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{width:36,height:36,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#fff8',borderRadius:8}}>{getFruitIcon(r.title || 'fruit', 28)}</span>
                              <a href={r.href} target="_blank" rel="noreferrer">{r.title || r.href}</a>
                            </li>
                          ))}
                        </ol>
                      </div>
                      ) : (
                      <div>
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="disclaimer">Copilot is here to give the best advice, but always consult with a doctor.</div>
          <div className="input-row">
            <input
              aria-label="Ask about a food or type a food item"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  handleAnalyze(query.trim())
                  setQuery('')
                }
              }}
              placeholder="e.g., almond milk"
            />
            <button disabled={isLoading} onClick={() => { if (query.trim()) { handleAnalyze(query.trim()); setQuery('') } }}>{isLoading ? 'Working...' : 'Analyze'}</button>
            {assistantIsTruncated() ? <button onClick={handleContinue} disabled={isLoading} style={{marginLeft:8}}>Continue</button> : null}
           </div>
        </section>
      </main>

      <footer>
        <small>All data stored locally. Enter your OpenAI API key in settings.</small>
      </footer>
      {showSettings ? (
  <div className="modal">
    <div className="modal-content">
      <ErrorBoundary>
        <Settings />
      </ErrorBoundary>
    </div>
  </div>
) : null}
    </div>
  )
}

function ProfileEditor({ profile, setProfile }: any) {
  const [local, setLocal] = useState(profile || { conditions: [], allergies: [], custom: [] })
  const [customText, setCustomText] = useState('')

  useEffect(() => setLocal(profile), [profile])

  function toggleCondition(c: string) {
    const exists = local.conditions.includes(c)
    const next = { ...local, conditions: exists ? local.conditions.filter((x: string) => x !== c) : [...local.conditions, c] }
    setLocal(next)
    setProfile(next)
  }

  function addCustom() {
    if (customText.trim()) {
      const next = { ...local, custom: [...local.custom, customText.trim()] }
      setLocal(next)
      setProfile(next)
      setCustomText('')
    }
  }

  return (
    <div>
      <div className="field">
        <label>Common conditions</label>
        <div className="chips">
          {['diabetes', 'hypertension', 'kidney disease', 'lactose intolerance'].map((c) => (
            <button key={c} className={local.conditions.includes(c) ? 'chip active' : 'chip'} onClick={() => toggleCondition(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Allergies (comma separated)</label>
        <input value={local.allergies.join(', ')} onChange={(e) => { const arr = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); const next={...local, allergies:arr}; setLocal(next); setProfile(next);} } />
      </div>

      <div className="field">
        <label>Custom health issues</label>
        <div className="custom-list">
          {local.custom.map((c: string, i: number) => <div key={i} className="custom-item">{c}</div>)}
        </div>
        <div className="custom-add">
          <input placeholder="Type a custom issue" value={customText} onChange={(e) => setCustomText(e.target.value)} />
          <button onClick={addCustom}>Add</button>
        </div>
      </div>
    </div>
  )
}

// Add a tiny error-catcher to show render errors inside the modal
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>
  } catch (err: any) {
    return (
      <div role="alert" style={{ padding: 12, color: 'red' }}>
        Settings failed to render: {String(err)}
      </div>
    )
  }
}
