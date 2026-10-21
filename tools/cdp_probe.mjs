/**
 * cdp_probe.mjs — drive headless Edge over CDP and print the rendered page text.
 *
 * The GUI-attached msedge.exe never yields stdout through this sandbox's pipes,
 * so `--dump-dom` returns nothing. CDP (WebSocket) works: launch a fresh Edge
 * with a private user-data-dir and a random debug port, navigate, then evaluate
 * `document.body.innerText`. Used to verify preview renders without reading pixels.
 *
 * Usage: node tools/cdp_probe.mjs <url> [waitMs] [evalJs]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2]
if (!url) {
  console.error('usage: node cdp_probe.mjs <url> [waitMs]')
  process.exit(2)
}
const waitMs = Number(process.argv[3] || 3500)
const evalJs = process.argv[4] ?? null
const postEvalWait = Number(process.argv[5] || 400)

const port = 9300 + Math.floor(Math.random() * 200)
const profile = mkdtempSync(join(tmpdir(), 'edge-cdp-'))
const edge = spawn(
  EDGE,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  let target = null
  for (let i = 0; i < 60; i += 1) {
    await sleep(250)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`)
      const list = await res.json()
      target = list.find((entry) => entry.type === 'page')
      if (target) break
    } catch {
      /* not up yet */
    }
  }
  if (target === null) {
    console.error('CDP target never appeared')
    edge.kill()
    process.exit(1)
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('ws connect failed'))
  })

  let nextId = 0
  const call = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++nextId
      const onMessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.id === id) {
          ws.removeEventListener('message', onMessage)
          resolve(msg.result ?? msg.error ?? null)
        }
      }
      ws.addEventListener('message', onMessage)
      ws.send(JSON.stringify({ id, method, params }))
    })

  const errors = []
  const onEvent = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(String(msg.params?.exceptionDetails?.exception?.description ?? msg.params?.exceptionDetails?.text ?? 'exception'))
    }
    if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') {
      errors.push(`log: ${msg.params.entry.text}`)
    }
  }
  ws.addEventListener('message', onEvent)

  await call('Page.enable')
  await call('Runtime.enable')
  await call('Log.enable')
  // Headless tabs do not hold system focus; without focus emulation `blur` /
  // `focusout` never fire, so React onBlur handlers (key-commit inputs) never run.
  await call('Emulation.setFocusEmulationEnabled', { enabled: true })
  const nav = await call('Page.navigate', { url })
  if (nav?.errorText) console.log(`=== NAV ERROR ===\n${nav.errorText}`)
  await sleep(waitMs)
  // Page.navigate can silently no-op (about:blank) in this environment; retry
  // until the document actually leaves about:blank.
  for (let i = 0; i < 6; i += 1) {
    const state = await call('Runtime.evaluate', {
      expression: 'document.URL',
      returnByValue: true,
    })
    if (state?.result?.value !== 'about:blank') break
    await call('Page.navigate', { url })
    await sleep(700)
  }

  if (evalJs !== null) {
    const evaluated = await call('Runtime.evaluate', { expression: evalJs, returnByValue: true, awaitPromise: true })
    await sleep(postEvalWait)
    console.log('=== EVAL ===')
    console.log(evaluated?.result?.value ?? evaluated?.exceptionDetails?.text ?? '(no result)')
  }

  const probe = await call('Runtime.evaluate', {
    expression: 'document.body ? document.body.innerText : "(no body)"',
    returnByValue: true,
  })
  console.log('=== PAGE TEXT ===')
  console.log(probe?.result?.value ?? '(no result)')
  console.log('=== ERRORS ===')
  console.log(errors.length === 0 ? '(none)' : errors.join('\n'))
  ws.close()
  edge.kill()
}

main().catch((error) => {
  console.error('probe failed:', error)
  edge.kill()
  process.exit(1)
})
