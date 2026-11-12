// Fork-only check of the built site in headless Chrome: share tags, favicon, remembered language,
// browser-language detection and the crash screen. Usage: node all-check.mjs <base url>
import { spawn } from 'node:child_process'

const base = process.argv[2]
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9334', '--user-data-dir=/tmp/chrome-all', 'about:blank'], { stdio: 'ignore' })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let failed = false
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failed = true }

async function json(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try { return await (await fetch(`http://127.0.0.1:9334${path}`, { method })).json() } catch { await wait(200) }
  }
  throw new Error('Chrome did not start')
}

// Opens a fresh tab; acceptLanguage sets navigator.languages for that tab.
async function openTab(acceptLanguage) {
  const target = await json('/json/new?about:blank', 'PUT')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let id = 0
  const pending = new Map()
  const errors = []
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text)
  })
  const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value
  const waitFor = async (expression, ms = 10000) => { for (let t = 0; t < ms; t += 100) { if (await evaluate(expression)) return true; await wait(100) } return false }
  await send('Runtime.enable')
  if (acceptLanguage) await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome', acceptLanguage })
  const close = async () => { ws.close(); await fetch(`http://127.0.0.1:9334/json/close/${target.id}`) }
  return { send, evaluate, waitFor, errors, close }
}
const heading = `document.querySelector('h1')?.textContent ?? ''`
const devanagari = `/[\\u0900-\\u097F]/.test(${heading})`

try {
  // 1. Share tags and favicon in the built page, and the files they point to.
  const html = await (await fetch(base)).text()
  const meta = (p) => (html.match(new RegExp(`<meta property="${p}" content="([^"]+)"`)) ?? [])[1]
  check(meta('og:image') === 'https://mrajat31.github.io/durgdrishti/og-image.png', `og:image is the absolute site URL (${meta('og:image')})`)
  check(Boolean(meta('og:title')) && Boolean(meta('og:description')), `og:title and og:description present ("${meta('og:title')}")`)
  check(/name="twitter:card" content="summary_large_image"/.test(html), 'twitter:card set for a large image')
  const icon = (html.match(/<link rel="icon"[^>]*href="([^"]+)"/) ?? [])[1]
  check(icon === '/durgdrishti/favicon.svg', `favicon link uses the site path (${icon})`)
  const favicon = await fetch(new URL(icon, base))
  check(favicon.ok && (await favicon.text()).includes('<svg'), `favicon served (${favicon.status})`)
  const image = await fetch(new URL('og-image.png', base))
  const bytes = Buffer.from(await image.arrayBuffer())
  check(image.ok && bytes.readUInt32BE(16) === 1200 && bytes.readUInt32BE(20) === 630, `share image served, 1200x630, ${Math.round(bytes.length / 1024)} KB`)

  // 2. An English browser starts in English; a chosen language is remembered after a reload.
  const en = await openTab('en-IN,en')
  await en.send('Page.navigate', { url: base })
  await en.waitFor(`!!document.querySelector('.language-select select')`)
  await wait(800)
  check(!(await en.evaluate(devanagari)), `English browser starts in English ("${await en.evaluate(heading)}")`)
  await en.evaluate(`(() => { const s = document.querySelector('.language-select select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'mr'); s.dispatchEvent(new Event('change', { bubbles: true })) })()`)
  check(await en.waitFor(devanagari), 'choosing Marathi switches the page')
  check((await en.evaluate(`localStorage.getItem('durgdrishti-language-v1')`)) === 'mr', 'the choice is saved in this browser')
  await en.send('Page.reload')
  await wait(500)
  check(await en.waitFor(`${devanagari} && document.querySelector('.language-select select')?.value === 'mr'`), `after a reload the page is in Marathi again ("${await en.evaluate(heading)}")`)
  check(en.errors.length === 0, `no script errors${en.errors.length ? ': ' + en.errors.join(' | ').slice(0, 200) : ''}`)
  await en.evaluate(`localStorage.removeItem('durgdrishti-language-v1')`)
  await en.close()

  // 3. A first visit from a Hindi browser starts in Hindi without saving anything.
  const hi = await openTab('hi-IN,hi,en')
  await hi.send('Page.navigate', { url: base })
  check(await hi.waitFor(`${devanagari} && document.querySelector('.language-select select')?.value === 'hi'`), `Hindi browser gets Hindi on the first visit ("${await hi.evaluate(heading)}")`)
  check((await hi.evaluate(`localStorage.getItem('durgdrishti-language-v1')`)) === null, 'an automatic choice is not saved')
  await hi.close()

  // 4. A crash shows the message and a working reload button instead of a blank page.
  const crash = await openTab('en-IN,en')
  await crash.send('Page.navigate', { url: `${base}?crash=1` })
  check(await crash.waitFor(`!!document.querySelector('.app-error[role="alert"]')`), 'a crash shows the error screen')
  const screen = await crash.evaluate(`document.querySelector('.app-error')?.innerText ?? ''`)
  check(/Something went wrong/.test(screen) && /काहीतरी चूक झाली/.test(screen) && /कुछ गलत हो गया/.test(screen), 'message shown in English, Marathi and Hindi')
  check(await crash.evaluate(`!!document.querySelector('.app-error button')`), 'reload button present')
  await crash.close()
} finally {
  chrome.kill()
}
process.exit(failed ? 1 : 0)
