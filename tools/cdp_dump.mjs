// Dump a page's rendered HTML (after JS runs) via CDP headless Edge.
// usage: node cdp_dump.mjs <url> <outFile> [waitMs]
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2]
const outFile = process.argv[3]
const waitMs = Number(process.argv[4] || 6000)
if (!url || !outFile) {
  console.error('usage: node cdp_dump.mjs <url> <outFile> [waitMs]')
  process.exit(2)
}

const port = 9800 + Math.floor(Math.random() * 1000)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForTarget() {
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const list = await res.json()
      const page = list.find((t) => t.type === 'page')
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch { /* not up yet */ }
    await sleep(150)
  }
  throw new Error('edge debug endpoint never appeared')
}

function makeClient(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let seq = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    }
  }
  const open = new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('ws error'))
  })
  const send = (method, params = {}) => {
    const id = ++seq
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  }
  return { ws, open, send }
}

async function main() {
  const userData = join(tmpdir(), `edge-prts-dump-${port}`)
  const child = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-sandbox',
    '--disable-blink-features=AutomationControlled',
    `--user-data-dir=${userData}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ], { stdio: 'ignore' })

  let cdp = null
  try {
    const wsUrl = await waitForTarget()
    cdp = makeClient(wsUrl)
    await cdp.open
    await cdp.send('Page.enable')
    await cdp.send('Page.navigate', { url })
    await sleep(waitMs)
    const r = await cdp.send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    })
    writeFileSync(outFile, String(r.result && r.result.value !== undefined ? r.result.value : JSON.stringify(r)), 'utf8')
    console.log(`dumped ${(r.result && r.result.value ? r.result.value.length : 0)} chars -> ${outFile}`)
  } finally {
    if (cdp !== null) cdp.ws.close()
    child.kill()
  }
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
