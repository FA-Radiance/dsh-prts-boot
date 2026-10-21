// Capture a burst of frames from a headless-Edge page via CDP and save them
// as numbered PNGs, ready for ffmpeg GIF/WebM assembly.
//
// usage: node cdp_frames.mjs <url> <outDir> [fps] [seconds]
//
// Why CDP: the sandbox blocks capturing msedge stdout through pipes, so we
// spawn with stdio:'ignore' and drive everything over the DevTools protocol
// (Node >= 22 has a built-in WebSocket client and fetch).
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2]
const outDir = process.argv[3]
const fps = Number(process.argv[4] || 8)
const secs = Number(process.argv[5] || 7)
const scale = Number(process.argv[6] || 1)

if (!url || !outDir) {
  console.error('usage: node cdp_frames.mjs <url> <outDir> [fps] [seconds]')
  process.exit(2)
}

const port = 9300 + Math.floor(Math.random() * 4000)
const frameMs = 1000 / fps

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForTarget() {
  const deadline = Date.now() + 20000
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
  const waiters = []
  const events = new Map()

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
      return
    }
    if (msg.method) {
      const list = events.get(msg.method)
      if (list) for (const w of list) w(msg.params)
    }
  }
  const open = new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = (e) => reject(new Error('ws error'))
  })

  function send(method, params = {}) {
    const id = ++seq
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })
  }
  function once(method, timeout = 30000) {
    return new Promise((resolve) => {
      const list = events.get(method) || []
      const waiter = (params) => resolve(params)
      list.push(waiter)
      events.set(method, list)
      setTimeout(() => resolve(null), timeout)
    })
  }
  return { ws, open, send, once }
}

async function main() {
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  const userData = join(tmpdir(), `edge-prts-frames-${port}`)

  const child = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-sandbox',
    `--user-data-dir=${userData}`,
    '--force-device-scale-factor=1',
    '--window-size=1712,972',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ], { stdio: 'ignore' })

  let cdp = null
  try {
    const wsUrl = await waitForTarget()
    cdp = makeClient(wsUrl)
    await cdp.open
    await cdp.send('Page.enable')
    if (scale !== 1) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1712,
        height: 972,
        deviceScaleFactor: scale,
        mobile: false,
      })
    }
    const loaded = cdp.once('Page.loadEventFired', 30000)
    await cdp.send('Page.navigate', { url })
    await loaded
    await sleep(600) // let fonts/images settle and the loop be mid-flight

    const frames = Math.round(secs * fps)
    for (let i = 0; i < frames; i++) {
      const t0 = Date.now()
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(join(outDir, `f_${String(i).padStart(3, '0')}.png`), Buffer.from(shot.data, 'base64'))
      const elapsed = Date.now() - t0
      const rest = frameMs - elapsed
      if (rest > 0) await sleep(rest)
    }
    console.log(`captured ${frames} frames @ ${fps} fps into ${outDir}`)
  } finally {
    if (cdp !== null) cdp.ws.close()
    child.kill()
  }
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exit(1)
})
