// Fork-only check: opens the built site in headless Chrome and verifies what loads when.
// Usage: node browser-check.mjs <url>
import { spawn } from 'node:child_process'

const url = process.argv[2]
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9333', '--user-data-dir=/tmp/chrome-check', 'about:blank'], { stdio: 'ignore' })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let failed = false
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed = true }

async function json(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try { return await (await fetch(`http://127.0.0.1:9333${path}`, { method })).json() } catch { await wait(200) }
  }
  throw new Error('Chrome did not start')
}

try {
  const target = await json('/json/new?about:blank', 'PUT')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let id = 0
  const pending = new Map()
  const scripts = []
  const errors = []
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
    if (msg.method === 'Network.requestWillBeSent' && /\.js(\?|$)/.test(msg.params.request.url)) scripts.push(msg.params.request.url.split('/').pop())
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text)
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
  })
  const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value
  const waitFor = async (expression, ms = 10000) => { for (let t = 0; t < ms; t += 100) { if (await evaluate(expression)) return true; await wait(100) } return false }
  const loaded = (pattern) => scripts.filter((s) => pattern.test(s))

  await send('Network.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url })
  await waitFor(`!!document.querySelector('.language-select select')`)
  await wait(1500)
  console.log('scripts after first load:', scripts.join(', '))
  check(loaded(/^index-/).length === 1, 'main bundle loaded')
  check(loaded(/^FortAtlas-/).length === 0, 'map page code not loaded on the home page')
  check(loaded(/^(mr|hi)-/).length === 0, 'Marathi and Hindi not loaded on first visit')
  const englishTitle = await evaluate(`document.querySelector('h1')?.textContent`)
  check(/[A-Za-z]/.test(englishTitle ?? ''), `English heading shown: "${englishTitle}"`)

  const choose = (lang) => evaluate(`(() => { const s = document.querySelector('.language-select select'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, '${lang}'); s.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  for (const [lang, script] of [['mr', /^mr-/], ['hi', /^hi-/]]) {
    await choose(lang)
    const switched = await waitFor(`/[\u0900-\u097F]/.test(document.querySelector('h1')?.textContent ?? '') && document.querySelector('.language-select select').value === '${lang}'`)
    check(switched, `${lang}: page switched to Devanagari text ("${await evaluate(`document.querySelector('h1')?.textContent`)}")`)
    check(loaded(script).length === 1, `${lang}: its language file was downloaded once (${loaded(script).join(', ')})`)
  }
  const before = scripts.length
  await choose('en')
  check(await waitFor(`document.querySelector('h1')?.textContent === ${JSON.stringify(englishTitle)}`), 'back to English')
  await choose('mr')
  await waitFor(`document.querySelector('.language-select select').value === 'mr'`)
  check(scripts.length === before, 'switching back to an already loaded language downloads nothing new')
  await choose('en')

  await evaluate(`document.querySelectorAll('button.tab')[1].click()`)
  check(await waitFor(`!!document.querySelector('.leaflet-container')`, 15000), 'map page opens and the map renders')
  check(loaded(/^FortAtlas-/).length === 1, `map page code downloaded when opened (${loaded(/^FortAtlas-/).join(', ')})`)
  check(await waitFor(`document.querySelectorAll('.leaflet-marker-icon, .leaflet-interactive').length > 0`), 'map shows fort markers')
  const appErrors = errors.filter((e) => !/tile|openstreetmap|Failed to load resource/i.test(e))
  check(appErrors.length === 0, `no script errors${appErrors.length ? ': ' + appErrors.join(' | ').slice(0, 300) : ''}`)
} finally {
  chrome.kill()
}
process.exit(failed ? 1 : 0)
