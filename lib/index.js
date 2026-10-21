/**
 * dsh-prts-boot — host half.
 *
 * Owns three things, and nothing else:
 *
 *   1. The boot cover. Before the client module has painted anything, the shell
 *      would flash its own UI. `webserver/index-inject` appends a stylesheet that
 *      hides `#root` and paints the PRTS base colour, plus a head script that
 *      removes that stylesheet again after 10 s so a broken client can never
 *      leave a permanently blank window.
 *   2. The voice clips (`assets/voice/*.mp3`) served from a Range-capable route,
 *      so the gate can speak the way PRTS does.
 *   3. The settings document (`api/state`), stored in
 *      `$DSH_HOME/dsh-prts-boot/config.json`.
 *
 * The configuration is deliberately tiny and every key has a working default:
 * the plugin must stay useful with an empty state file.
 *
 * @module dsh-prts-boot
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Absolute directory of this package (the code lives in `lib/`, the assets at the root). */
// NOTE: `fileURLToPath(new URL('./', import.meta.url))` yields a trailing
// separator on Windows, and `dirname()` of that strips one extra level —
// this was the root cause of every voice clip 404ing (PACKAGE_DIR resolved
// one directory too high). Resolve from the module FILE instead.
const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Route prefix of the host endpoints. */
const ROUTE_BASE = '/dsh-prts-boot'
const STATE_URL = `${ROUTE_BASE}/api/state`
const VOICE_PREFIX = `${ROUTE_BASE}/voice`
const ASSET_PREFIX = `${ROUTE_BASE}/asset`
const BEACON_URL = `${ROUTE_BASE}/api/beacon`

/** Whitelisted image assets served from `assets/`. */
const ASSET_MAP = Object.freeze({
  'prts-silhouette.png': 'image/png',
  'prts-wall-dark.jpg': 'image/jpeg',
  'prts-wall-light.jpg': 'image/jpeg',
})

/** Directory under `$DSH_HOME` that holds the persisted settings. */
const STATE_DIRNAME = 'dsh-prts-boot'

/** Base colours used before the client paints; kept in sync with `client.js`. */
const BASE_COLOUR = {
  A: '#efede7',
  B: '#0a0a0b',
}

const VARIANTS = Object.freeze(['A', 'B'])
const DEFAULT_VOICE = 'boot'

/** Defaults. Anything missing in the state file falls back to these. */
export const DEFAULTS = Object.freeze({
  variant: 'A',
  voice: true,
  sfx: true,
  volume: 0.55,
  boot: true,
  remember: true,
  skin: true,
  hero: true,
  parallax: 2,
  anomaly: 2,
  keys: Object.freeze({ doctor: '', amiya: '', kaltsit: '' }),
  customUsers: Object.freeze([]),
  uiSkin: true,
  uiBg: true,
  uiChat: true,
  uiPanels: true,
  uiFloat: true,
  ext: Object.freeze({}),
})

/** A custom key is a short optional override; empty string means "use the default". */
function cleanKey(raw) {
  if (typeof raw !== 'string') return ''
  const clean = raw.trim()
  if (clean === '') return ''
  if (clean.length > 12) return ''
  return /^[\x21-\x7e]*$/.test(clean) ? clean : ''
}

/**
 * One user-defined login profile. Requires a display name (cn/en) and a
 * 2-12 char alphanumeric serial; the key is optional (empty = keyless,
 * like the terminal itself).
 */
function cleanCustomUser(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const cn = String(raw.cn ?? '').trim().slice(0, 12)
  const en = String(raw.en ?? '').trim().slice(0, 16)
  const serial = String(raw.serial ?? '').trim().toUpperCase()
  const key = cleanKey(raw.key)
  if ((cn === '' && en === '') || !/^[A-Z0-9]{2,12}$/.test(serial)) return null
  return { cn, en, serial, key }
}

/**
 * Free-form extension config: a plain JSON object of at most 4KiB that the
 * plugin persists untouched. Future features (and third-party integrations)
 * read and write it through `globalThis.__PRTS_BOOT_API__` on the client.
 */
function cleanExt(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  try {
    const json = JSON.stringify(raw)
    if (json === undefined || json.length > 4096) return {}
    const parsed = JSON.parse(json)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Merge an unknown state document into a complete settings object.
 *
 * Written as a whitelist on purpose: an old state file (or a hand-edited one)
 * must never be able to inject arbitrary values into the gate.
 *
 * @param {unknown} raw - parsed state file, or anything else.
 * @returns the normalised settings.
 */
export function normaliseSettings(raw) {
  const input = raw !== null && typeof raw === 'object' ? raw : {}
  const variant = VARIANTS.includes(input.variant) ? input.variant : DEFAULTS.variant
  const volume = Number(input.volume)
  const parallax = Number(input.parallax)
  const anomaly = Number(input.anomaly)
  const rawKeys = input.keys !== null && typeof input.keys === 'object' ? input.keys : {}
  return {
    variant,
    voice: typeof input.voice === 'boolean' ? input.voice : DEFAULTS.voice,
    sfx: typeof input.sfx === 'boolean' ? input.sfx : DEFAULTS.sfx,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULTS.volume,
    boot: typeof input.boot === 'boolean' ? input.boot : DEFAULTS.boot,
    remember: typeof input.remember === 'boolean' ? input.remember : DEFAULTS.remember,
    skin: typeof input.skin === 'boolean' ? input.skin : DEFAULTS.skin,
    hero: typeof input.hero === 'boolean' ? input.hero : DEFAULTS.hero,
    parallax: Number.isFinite(parallax) ? Math.min(3, Math.max(0, Math.round(parallax))) : DEFAULTS.parallax,
    anomaly: Number.isFinite(anomaly) ? Math.min(2, Math.max(0, Math.round(anomaly))) : DEFAULTS.anomaly,
    keys: {
      doctor: cleanKey(rawKeys.doctor),
      amiya: cleanKey(rawKeys.amiya),
      kaltsit: cleanKey(rawKeys.kaltsit),
    },
    customUsers: (() => {
      if (!Array.isArray(input.customUsers)) return DEFAULTS.customUsers
      const seen = new Set()
      const out = []
      for (const entry of input.customUsers.slice(0, 4)) {
        const clean = cleanCustomUser(entry)
        if (clean === null || seen.has(clean.serial)) continue
        seen.add(clean.serial)
        out.push(clean)
      }
      return out
    })(),
    uiSkin: typeof input.uiSkin === 'boolean' ? input.uiSkin : DEFAULTS.uiSkin,
    uiBg: typeof input.uiBg === 'boolean' ? input.uiBg : DEFAULTS.uiBg,
    uiChat: typeof input.uiChat === 'boolean' ? input.uiChat : DEFAULTS.uiChat,
    uiPanels: typeof input.uiPanels === 'boolean' ? input.uiPanels : DEFAULTS.uiPanels,
    uiFloat: typeof input.uiFloat === 'boolean' ? input.uiFloat : DEFAULTS.uiFloat,
    ext: cleanExt(input.ext),
  }
}

/** `$DSH_HOME`, matching the rest of DSH. */
function dshHome() {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

function stateFile() {
  return join(dshHome(), STATE_DIRNAME, 'config.json')
}

/**
 * Read the persisted settings. A missing or corrupt file is not an error: the
 * defaults are a fully working configuration.
 *
 * @returns the normalised settings.
 */
export function readSettings() {
  try {
    return normaliseSettings(JSON.parse(readFileSync(stateFile(), 'utf8')))
  } catch {
    return normaliseSettings(undefined)
  }
}

/**
 * Persist the settings atomically (temp file + rename), so a crash mid-write
 * cannot leave a half-written document behind.
 *
 * @param {unknown} raw - the incoming settings.
 * @returns the normalised settings that were written.
 */
export function writeSettings(raw) {
  const next = normaliseSettings(raw)
  const file = stateFile()
  mkdirSync(dirname(file), { recursive: true })
  const temp = `${file}.${process.pid}.tmp`
  writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  renameSync(temp, file)
  return next
}

/**
 * Resolve a voice clip id to a file inside the package.
 *
 * Only ids that exist as `<id>.mp3` in `assets/voice` are accepted, so the route
 * can never be used to read an arbitrary path.
 *
 * @param {string} id - clip id from the URL.
 * @returns absolute path, or `null` when unknown.
 */
function voiceFile(id) {
  if (!/^[a-z0-9-]{1,40}$/.test(id)) return null
  const file = join(PACKAGE_DIR, 'assets', 'voice', `${id}.mp3`)
  return existsSync(file) ? file : null
}

/**
 * Read a JSON body with a hard size limit.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {number} limit - maximum accepted bytes.
 * @returns the parsed JSON, or `null` when the body is unusable.
 */
function readJsonBody(req, limit) {
  return new Promise((resolvePromise) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        resolvePromise(null)
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        resolvePromise(null)
      }
    })
    req.on('error', () => resolvePromise(null))
  })
}

/**
 * Send one voice clip, honouring `Range` so `HTMLAudioElement` can seek.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {string} file
 * @param {import('node:http').IncomingMessage} req
 */
function sendVoice(res, file, req) {
  const size = statSync(file).size
  const range = req.headers.range
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  if (typeof range === 'string') {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
    if (match !== null) {
      const start = match[1] === '' ? Math.max(0, size - Number(match[2])) : Number(match[1])
      const end = match[1] !== '' && match[2] !== '' ? Number(match[2]) : size - 1
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < size) {
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': end - start + 1,
        })
        createReadStream(file, { start, end }).pipe(res)
        return
      }
    }
    res.writeHead(416, { 'Content-Range': `bytes */${size}` })
    res.end()
    return
  }
  res.writeHead(200, { 'Content-Length': size })
  createReadStream(file).pipe(res)
}

/**
 * Host plugin entry.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {Record<string, unknown>} [config] - optional defaults from the patch.
 */
export function apply(ctx, config) {
  const patchDefaults = normaliseSettings({ ...DEFAULTS, ...(config ?? {}) })
  /** The last settings this process knows about; the cover colour has to be decided before a request arrives. */
  let lastSettings = readSettings()

  /**
   * Guard a request with the host's own authorisation rules.
   *
   * @returns `true` when the request was rejected and already answered.
   */
  function reject(req, res, scoped) {
    try {
      const rejection = scoped.get('connection')?.requestRejection?.(req)
      if (rejection === undefined || rejection === null) return false
      res.writeHead(rejection)
      res.end()
      return true
    } catch {
      return false
    }
  }

  ctx.inject(['webServer'], (scoped) => {
    /** GET /dsh-prts-boot/api/state — effective settings. */
    scoped.effect(() =>
      scoped.webServer.register({
        kind: 'exact',
        path: STATE_URL,
        handler: async (req, res) => {
          if (reject(req, res, scoped)) return
          if (req.method === 'POST') {
            const body = await readJsonBody(req, 8 * 1024)
            if (body === null) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end('{"error":"invalid-body"}')
              return
            }
            lastSettings = writeSettings({ ...readSettings(), ...body })
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
            res.end(JSON.stringify(lastSettings))
            return
          }
          lastSettings = readSettings()
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify({ ...patchDefaults, ...lastSettings }))
        },
      }),
    )

    /** GET /dsh-prts-boot/voice/<id>.mp3 */
    scoped.effect(() =>
      scoped.webServer.register({
        kind: 'prefix',
        path: VOICE_PREFIX,
        handler: (req, res) => {
          // Diagnostics first, even for guarded-off requests: tells us exactly
          // what the running process sees (url, resolved id, package dir).
          const rawId = decodeURIComponent(String(req.url ?? '').slice(VOICE_PREFIX.length).replace(/^\/+/, '').replace(/\.mp3$/, ''))
          const diagFile = voiceFile(rawId || DEFAULT_VOICE)
          globalThis.__PRTS_VOICE_DIAG__ = {
            url: String(req.url ?? ''),
            prefix: VOICE_PREFIX,
            rawId,
            id: rawId || DEFAULT_VOICE,
            packageDir: PACKAGE_DIR,
            importUrl: import.meta.url,
            file: diagFile,
            exists: diagFile === null ? false : true,
            at: new Date().toISOString(),
          }
          if (reject(req, res, scoped)) return
          const id = rawId
          const file = diagFile
          if (file === null) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('unknown voice clip')
            return
          }
          // Diagnostics: count every clip actually served, so audio issues can
          // be told apart from "the page never asked".
          const hits = (globalThis.__PRTS_VOICE_HITS__ ??= {})
          hits[id] = (hits[id] ?? 0) + 1
          hits.__last = { id, at: new Date().toISOString() }
          sendVoice(res, file, req)
        },
      }),
    )

    /** GET /dsh-prts-boot/asset/<name> — whitelisted image assets. */
    scoped.effect(() =>
      scoped.webServer.register({
        kind: 'prefix',
        path: ASSET_PREFIX,
        handler: (req, res) => {
          const name = decodeURIComponent(String(req.url ?? '').slice(ASSET_PREFIX.length).replace(/^\/+/, '').split('?')[0])
          const type = ASSET_MAP[name]
          const file = type === undefined ? null : join(PACKAGE_DIR, 'assets', name)
          if (file === null || !existsSync(file)) {
            if (reject(req, res, scoped)) return
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('unknown asset')
            return
          }
          if (reject(req, res, scoped)) return
          const size = statSync(file).size
          res.setHeader('Content-Type', type)
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.writeHead(200, { 'Content-Length': size })
          createReadStream(file).pipe(res)
        },
      }),
    )

    /** POST /dsh-prts-boot/api/beacon — the browser half reports its phase. */
    scoped.effect(() =>
      scoped.webServer.register({
        kind: 'exact',
        path: BEACON_URL,
        handler: async (req, res) => {
          globalThis.__PRTS_BEACON_HITS__ = (globalThis.__PRTS_BEACON_HITS__ ?? 0) + 1
          if (reject(req, res, scoped)) return
          if (req.method === 'POST') {
            const body = await readJsonBody(req, 4 * 1024)
            if (body !== null) {
              if (typeof body.phase === 'string') {
                globalThis.__PRTS_BOOT_BEACON__ = {
                  phase: body.phase,
                  user: typeof body.user === 'string' ? body.user : null,
                  at: new Date().toISOString(),
                  event: typeof body.event === 'string' ? body.event : null,
                  ui: typeof body.ui === 'string' ? body.ui : null,
                  uiAttr: typeof body.uiAttr === 'string' ? body.uiAttr : null,
                  bg: body.bg === true ? true : body.bg === false ? false : null,
                  wallSrc: typeof body.wallSrc === 'string' ? body.wallSrc : null,
                  wallOk: body.wallOk === true ? true : body.wallOk === false ? false : null,
                  wallErr: typeof body.wallErr === 'string' ? body.wallErr : null,
                  bgColor: typeof body.bgColor === 'string' ? body.bgColor : null,
                  bgRect: Array.isArray(body.bgRect) ? body.bgRect.slice(0, 2) : null,
                  scene: typeof body.scene === 'string' ? body.scene : null,
                  skinAttr: typeof body.skinAttr === 'string' ? body.skinAttr : null,
                  bodyBg: typeof body.bodyBg === 'string' ? body.bodyBg : null,
                  bundleRev: typeof body.bundleRev === 'string' ? body.bundleRev : null,
                  theme: body.theme !== null && typeof body.theme === 'object' ? body.theme : null,
                  themeHook: body.themeHook === true ? true : body.themeHook === false ? false : null,
                  themeSvc: body.themeSvc === true ? true : body.themeSvc === false ? false : null,
                  tokenBg: typeof body.tokenBg === 'string' ? body.tokenBg : null,
                  sidebarBg: typeof body.sidebarBg === 'string' ? body.sidebarBg : null,
                  convBg: typeof body.convBg === 'string' ? body.convBg : null,
                  bubbleBg: typeof body.bubbleBg === 'string' ? body.bubbleBg : null,
                  convChain: Array.isArray(body.convChain) ? body.convChain.slice(0,8) : null,
                  brand: body.brand === true ? true : body.brand === false ? false : null,
                  floatSvc: body.floatSvc !== null && typeof body.floatSvc === 'object' ? body.floatSvc : null,
                  cuLayout: body.cuLayout !== null && typeof body.cuLayout === 'object' ? body.cuLayout : null,
                }
              }
              if (typeof body.audio === 'string') {
                const errors = (globalThis.__PRTS_AUDIO_ERRS__ ??= [])
                errors.push({ msg: body.audio, at: new Date().toISOString() })
                if (errors.length > 20) errors.splice(0, errors.length - 20)
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end('{"ok":true}')
            return
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(globalThis.__PRTS_BOOT_BEACON__ ?? null))
        },
      }),
    )
  })

  // The boot cover must be registered synchronously during plugin load: the
  // index-inject table is collected once, while the web server starts.
  try {
    ctx.on('webserver/index-inject', (table) => {
      const colour = BASE_COLOUR[lastSettings.variant] ?? BASE_COLOUR.A
      table.push({
        kind: 'style',
        text: [
          '/* dsh-prts-boot:boot */',
          'html.dsh-prts-booting, html.dsh-prts-booting body { background: ' + colour + ' !important; }',
          'html.dsh-prts-booting #root { visibility: hidden !important; }',
        ].join('\n'),
      })
      table.push({
        kind: 'script',
        placement: 'head',
        text: [
          '(function(){',
          '  var html = document.documentElement;',
          '  html.classList.add("dsh-prts-booting");',
          '  var guard = {',
          '    release: function () {',
          '      html.classList.remove("dsh-prts-booting");',
          '      try { document.getElementById("dsh-prts-boot-cover-fallback")?.remove(); } catch (e) {}',
          '    },',
          '    clear: function () {}',
          '  };',
          '  globalThis.__PRTS_BOOT_COVER__ = guard;',
          '  setTimeout(function () {',
          '    // Ten seconds without a gate means something is wrong; never stay dark.',
          '    html.classList.remove("dsh-prts-booting");',
          '  }, 10000);',
          '})();',
        ].join('\n'),
      })
    })
  } catch {
    // An older host without the index-inject event simply skips the cover.
  }
}
