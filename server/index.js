const express = require('express')
const fetch = require('node-fetch')
const xml2js = require('xml2js')
const cors = require('cors')

const app = express()
app.use(cors())

const RSS_URL = process.env.RSS_URL || 'https://www.theguardian.com/food/rss'

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

const port = process.env.PORT || 4001
app.listen(port, ()=> console.log('NutriCoach server running on', port))
