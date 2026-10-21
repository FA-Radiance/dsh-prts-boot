/**
 * static_server.mjs — tiny static file server for the preview harness.
 *
 * Edge's file:// loads of the preview pages turned flaky (random empty
 * documents, likely HDD read contention). Serving over http://127.0.0.1
 * matches the real DSH app (which serves plugin assets over http) and is
 * stable. Root = the plugin directory, so /preview/..., /lib/... and
 * /assets/... all resolve naturally.
 *
 * Usage: node tools/static_server.mjs [port]   (default 8866)
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.argv[2] || 8866)
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)))

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.json': 'application/json; charset=utf-8',
}

createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0])
  const rel = pathname === '/' ? '/preview/index.html' : pathname
  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, '')
  const file = resolve(ROOT, '.' + safe)
  if (!file.startsWith(ROOT)) {
    res.writeHead(403)
    res.end()
    return
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(readFileSync(file))
}).listen(PORT, '127.0.0.1', () => {
  console.log(`static server: http://127.0.0.1:${PORT}/  root=${ROOT}`)
})
