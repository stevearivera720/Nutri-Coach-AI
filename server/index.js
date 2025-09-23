const path = require('path')
const express = require('express')
const fetch = require('node-fetch')
const xml2js = require('xml2js')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()
app.use(cors())
app.use(cookieParser())

const RSS_URL = process.env.RSS_URL || 'https://www.theguardian.com/food/rss'

// Simple access-token gate: set ACCESS_TOKEN in env. Users with the token in query ?access=TOKEN or cookie can access the site.
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || null

function checkAccess(req) {
  if (!ACCESS_TOKEN) return true // no gate configured
  const q = String(req.query.access || '')
  const cookie = String(req.cookies?.access_token || '')
  const header = String(req.get('x-access-token') || '')
  return q === ACCESS_TOKEN || cookie === ACCESS_TOKEN || header === ACCESS_TOKEN
}

// Serve the built frontend if present
const distPath = path.resolve(__dirname, '..', 'dist')
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath))
}

app.get('/daily-tip', async (req, res) => {
  try {
    const r = await fetch(RSS_URL)
    const text = await r.text()
    const parsed = await xml2js.parseStringPromise(text)
    const items = (parsed.rss && parsed.rss.channel && parsed.rss.channel[0].item) || []
    if (!items.length) return res.json({ tip: null })
    // pick an item by day index
    const idx = new Date().getDate() % items.length
    const chosen = items[idx]
    const title = chosen.title && chosen.title[0]
    const desc = chosen.description && chosen.description[0]
    res.json({ tip: title || (desc && desc.slice(0,160)) || null })
  } catch (err) {
    console.error(err)
    res.json({ tip: null })
  }
})

// Fallback route for SPA and access gating
app.get('*', (req, res, next) => {
  // Allow API endpoints
  if (req.path.startsWith('/api') || req.path === '/daily-tip') return next()
  if (!checkAccess(req)) {
    // If ?access=TOKEN provided, set cookie and redirect to clean URL
    if (req.query.access && String(req.query.access) === ACCESS_TOKEN) {
      res.cookie('access_token', ACCESS_TOKEN, { httpOnly: false, maxAge: 1000 * 60 * 60 * 24 })
      const cleanUrl = req.originalUrl.replace(/\?access=[^&]+/, '')
      return res.redirect(cleanUrl)
    }
    // Serve a minimal form to accept the token
    return res.send(`<!doctype html><html><body><h3>Private site</h3><p>Enter access token:</p><form method="GET"><input name="access"/><button>Enter</button></form></body></html>`)
  }

  if (require('fs').existsSync(path.join(distPath, 'index.html'))) {
    return res.sendFile(path.join(distPath, 'index.html'))
  }
  return res.status(404).send('Not found')
})

const port = process.env.PORT || 4001
app.listen(port, ()=> console.log('NutriCoach server running on', port))
