/**
 * dsh-prts-boot — browser half.
 *
 * Hand-written client bundle in the DSH client-module form: executing this file
 * only REGISTERS a lazy factory (`window.__ModuleLoader__.load`); every module
 * body side effect lives inside the factory closure and runs at materialization.
 *
 * Four registrations:
 *   - `shell.overlay` — the boot sequence + identity gate. Portalled to <body>,
 *     because a slot ancestor that creates a stacking context would trap it.
 *   - `conversation.hero.brand.mark` — the small PRTS lockup on the blank-session
 *     hero, so the interface carries the mark after the gate opens.
 *   - `sidebar.brand.mark` — the PRTS lockup in the sidebar brand row.
 *   - `settings.plugins.tab` — variant / voice / skin settings.
 *
 * Host endpoints:
 *   GET  /dsh-prts-boot/api/state       effective settings
 *   POST /dsh-prts-boot/api/state       patch settings
 *   GET  /dsh-prts-boot/voice/<id>.mp3  voice clip (Range-capable)
 *   GET  /dsh-prts-boot/asset/<name>    whitelisted image assets
 *   GET  /dsh-prts-boot/api/beacon      client heartbeat diagnostics
 *
 * @module dsh-prts-boot/client
 */

window.__ModuleLoader__.load({
  id: 'dsh-prts-boot',
  factory(require) {
    const React = require('react')
    const { createPortal } = require('react-dom')

    const h = React.createElement

    /** Build an element, flattening children arrays and dropping empty slots. */
    function el(tag, props, ...children) {
      const flat = []
      for (const child of children) {
        if (Array.isArray(child)) flat.push(...child)
        else if (child !== null && child !== undefined && child !== false) flat.push(child)
      }
      const next = props === null || props === undefined ? {} : { ...props }
      if (flat.length === 1) next.children = flat[0]
      else if (flat.length > 1) next.children = flat
      return h(tag, next)
    }

    /** Join class names, skipping falsy ones. */
    function cx(...names) {
      return names.filter(Boolean).join(' ')
    }

    // ---------------------------------------------------------------------
    // Host contract
    // ---------------------------------------------------------------------

    const BASE = '/dsh-prts-boot'
    const STATE_URL = `${BASE}/api/state`
    const VOICE_URL = `${BASE}/voice`
    const ASSET_URL = `${BASE}/asset`
    const OVERLAY_SLOT = 'shell.overlay'
    const HERO_SLOT = 'conversation.hero.brand.mark'
    const SIDEBAR_BRAND_SLOT = 'sidebar.brand.mark'
    const TAB_SLOT = 'settings.plugins.tab'
    const ROW_ID = 'dsh-prts-boot'
    const TOP_Z = 2147483100
    const SESSION_KEY = 'dsh-prts-boot:session'
    const STYLE_ID = 'dsh-prts-boot-style'

    // ---------------------------------------------------------------------
    // DSH theme integration
    // ---------------------------------------------------------------------

    /** Token palettes registered as DSH themes: one theme per boot skin
     *  (prts-paper = A · light, prts-core = B · dark). The theme service
     *  projects them onto the app's alias token layer, so every surface
     *  that consumes --dsw-alias-* (background, sidebar, panels, chat)
     *  reskins from one place. */
    const PRTS_THEMES = Object.freeze({
      'prts-paper': {
        colorScheme: 'light',
        tokens: Object.freeze({
          '--dsw-alias-bg-base': '#f4f3ef',
          '--dsw-alias-bg-layer-1': '#eceae4',
          '--dsw-alias-bg-layer-2': '#faf9f6',
          '--dsw-alias-bg-layer-3': '#ffffff',
          '--dsw-alias-bg-overlay': '#fcfbf8',
          '--dsw-alias-bg-module-platform': '#f0efe9',
          '--dsw-alias-bg-multi-select': '#e8e6df',
          '--dsw-alias-border-l1': 'rgba(22,24,28,.09)',
          '--dsw-alias-border-l2': 'rgba(22,24,28,.15)',
          '--dsw-alias-border-l3': 'rgba(22,24,28,.22)',
          '--dsw-alias-border-l4': 'rgba(22,24,28,.34)',
          '--dsw-alias-border-l2-darkmode-thin': 'rgba(22,24,28,.12)',
          '--dsw-alias-brand-primary': '#5a4a8a',
          '--dsw-alias-brand-text': '#463a6e',
          '--dsw-alias-label-primary': '#1b1c1f',
          '--dsw-alias-label-secondary': '#4c5057',
          '--dsw-alias-label-tertiary': '#737881',
          '--dsw-alias-label-caption': '#949aa1',
          '--dsw-alias-label-dimmed': '#b3b7bd',
          '--dsw-alias-label-primary-dimmed': '#878c94',
          '--dsw-alias-label-primary-foreground': '#ffffff',
          '--dsw-alias-label-primary-inverted': '#f4f3ef',
          '--dsw-alias-interactive-bg-hover': 'rgba(22,24,28,.055)',
          '--dsw-alias-interactive-hover-accent': 'rgba(90,74,138,.08)',
          '--dsw-alias-interactive-hover-solid': 'rgba(90,74,138,.14)',
          '--dsw-alias-interactive-active': 'rgba(22,24,28,.09)',
          '--dsw-alias-button-primary-fill': '#1b1c1f',
          '--dsw-alias-button-primary-hover': '#31333a',
          '--dsw-alias-button-primary-dimmed': 'rgba(27,28,31,.42)',
          '--dsw-alias-button-elevated-fill': '#ffffff',
          '--dsw-alias-button-floating-fill': '#f7f6f2',
          '--dsw-alias-button-floating-hover': '#eceae4',
          '--dsw-alias-button-ghost-active-fill': 'rgba(90,74,138,.12)',
          '--dsw-alias-button-ghost-hover': 'rgba(22,24,28,.05)',
          '--dsw-alias-button-info-fill': '#eef1f5',
          '--dsw-alias-button-info-hover': '#e2e8f0',
          '--dsw-alias-state-error-primary': '#c14b3f',
          '--dsw-alias-state-success-primary': '#2a7d6a',
          '--dsw-alias-state-warn-primary': '#b07a2f',
          '--dsw-alias-state-idle-primary': '#8f939a',
          '--dsw-alias-state-business-primary': '#5a4a8a',
          '--dsw-alias-state-business-tertiary': 'rgba(90,74,138,.14)',
          '--dsw-alias-scrollbar-bg-l1': '#e6e4dd',
          '--dsw-alias-scrollbar-bg-l2': '#d8d6ce',
          '--dsw-alias-scrollbar-hover-l1': '#cfcdc4',
          '--dsw-alias-scrollbar-hover-l2': '#bebcb2',
          '--dsw-alias-markdown-code-block': '#f0efe9',
          '--dsw-alias-markdown-code-banner': '#e8e6df',
          '--dsw-alias-markdown-inline-code': '#eceae4',
          '--dsw-alias-markdown-citation': 'rgba(90,74,138,.1)',
          '--dsw-specific-sidebar-fill': '#f4f3ef',
          '--dsw-specific-sidebar-nav-item-active': 'rgba(90,74,138,.12)',
          '--dsw-specific-sidebar-nav-item-hover': 'rgba(22,24,28,.05)',
          '--dsw-specific-bubble': 'transparent',
          '--dsw-specific-bubble-highlight': 'rgba(90,74,138,.08)',
          '--dsw-specific-input-major': '#ffffff',
          '--dsw-specific-menu': '#fcfbf8',
          '--dsw-specific-selector': '#f7f6f2',
          '--dsw-specific-tip': '#fff7e0',
        }),
      },
      'prts-core': {
        colorScheme: 'dark',
        tokens: Object.freeze({
          '--dsw-alias-bg-base': '#0f1013',
          '--dsw-alias-bg-layer-1': '#16181d',
          '--dsw-alias-bg-layer-2': '#1a1d22',
          '--dsw-alias-bg-layer-3': '#21252c',
          '--dsw-alias-bg-overlay': '#1c1f26',
          '--dsw-alias-bg-module-platform': '#131519',
          '--dsw-alias-bg-multi-select': '#23262d',
          '--dsw-alias-border-l1': 'rgba(255,255,255,.09)',
          '--dsw-alias-border-l2': 'rgba(255,255,255,.16)',
          '--dsw-alias-border-l3': 'rgba(255,255,255,.24)',
          '--dsw-alias-border-l4': 'rgba(255,255,255,.36)',
          '--dsw-alias-border-l2-darkmode-thin': 'rgba(255,255,255,.12)',
          '--dsw-alias-brand-primary': '#e0a94f',
          '--dsw-alias-brand-text': '#eab95f',
          '--dsw-alias-label-primary': '#f2f3f1',
          '--dsw-alias-label-secondary': '#c9cdce',
          '--dsw-alias-label-tertiary': '#9da3a8',
          '--dsw-alias-label-caption': '#7a8087',
          '--dsw-alias-label-dimmed': '#5d626a',
          '--dsw-alias-label-primary-dimmed': '#6a7078',
          '--dsw-alias-label-primary-foreground': '#16181d',
          '--dsw-alias-label-primary-inverted': '#0f1013',
          '--dsw-alias-interactive-bg-hover': 'rgba(255,255,255,.07)',
          '--dsw-alias-interactive-hover-accent': 'rgba(224,169,79,.12)',
          '--dsw-alias-interactive-hover-solid': 'rgba(224,169,79,.2)',
          '--dsw-alias-interactive-active': 'rgba(255,255,255,.11)',
          '--dsw-alias-button-primary-fill': '#e0a94f',
          '--dsw-alias-button-primary-hover': '#eab95f',
          '--dsw-alias-button-primary-dimmed': 'rgba(224,169,79,.4)',
          '--dsw-alias-button-elevated-fill': '#1e2229',
          '--dsw-alias-button-floating-fill': '#16181d',
          '--dsw-alias-button-floating-hover': '#262b34',
          '--dsw-alias-button-ghost-active-fill': 'rgba(224,169,79,.16)',
          '--dsw-alias-button-ghost-hover': 'rgba(255,255,255,.06)',
          '--dsw-alias-button-info-fill': '#1a2230',
          '--dsw-alias-button-info-hover': '#212c3d',
          '--dsw-alias-state-error-primary': '#e06a5e',
          '--dsw-alias-state-success-primary': '#4fae92',
          '--dsw-alias-state-warn-primary': '#d9a45c',
          '--dsw-alias-state-idle-primary': '#7b7d84',
          '--dsw-alias-state-business-primary': '#e0a94f',
          '--dsw-alias-state-business-tertiary': 'rgba(224,169,79,.16)',
          '--dsw-alias-scrollbar-bg-l1': '#1c1f25',
          '--dsw-alias-scrollbar-bg-l2': '#23262d',
          '--dsw-alias-scrollbar-hover-l1': '#2a2e36',
          '--dsw-alias-scrollbar-hover-l2': '#333845',
          '--dsw-alias-markdown-code-block': '#191c21',
          '--dsw-alias-markdown-code-banner': '#16181d',
          '--dsw-alias-markdown-inline-code': '#1c1f25',
          '--dsw-alias-markdown-citation': 'rgba(224,169,79,.12)',
          '--dsw-specific-sidebar-fill': '#121419',
          '--dsw-specific-sidebar-nav-item-active': 'rgba(224,169,79,.14)',
          '--dsw-specific-sidebar-nav-item-hover': 'rgba(255,255,255,.06)',
          '--dsw-specific-bubble': 'transparent',
          '--dsw-specific-bubble-highlight': 'rgba(224,169,79,.1)',
          '--dsw-specific-input-major': '#14161b',
          '--dsw-specific-menu': '#1c1f26',
          '--dsw-specific-selector': '#16181d',
          '--dsw-specific-tip': '#2b2415',
        }),
      },
    })
    const PRTS_THEME_FOR_VARIANT = Object.freeze({ A: 'prts-paper', B: 'prts-core' })

    /** Theme service + previous preference, captured at apply() time. */
    let themeServiceRef = null
    let prevThemePrefRef = 'system'
    let overrideDisposeRef = null
    let themeCtxRef = null
    let themeHookRef = null
    let themeRetryTimer = null
    let themeRetryCount = 0

    /**
     * setTheme() only persists BUILT-IN ids ('light'/'dark'/'system') to the
     * durable Host settings; third-party ids live in memory. On an app restart
     * the durable preference is re-adopted, which resets the in-memory
     * preference and reverts the surfaces. To make the skin survive restarts
     * we stack a scheme-identical override layer (the mechanism built for
     * dynamic packages) — it composes over whatever theme is active, so a
     * preference reset cannot wash it out. setTheme() still runs so the
     * colorScheme (light/dark chrome) follows the skin.
     */
    function themeApply(themeId) {
      if (themeServiceRef === null) return
      try {
        if (typeof themeServiceRef.setTheme === 'function') themeServiceRef.setTheme(themeId)
      } catch {
        /* ignore */
      }
      const def = PRTS_THEMES[themeId]
      if (def === undefined || typeof themeServiceRef.overrideTokens !== 'function') return
      try {
        const pairs = {}
        for (const [name, value] of Object.entries(def.tokens)) pairs[name] = { light: value, dark: value }
        if (typeof overrideDisposeRef === 'function') {
          try {
            overrideDisposeRef()
          } catch {
            /* ignore */
          }
        }
        overrideDisposeRef = themeServiceRef.overrideTokens('dsh-prts-boot', pairs)
      } catch {
        overrideDisposeRef = null
      }
    }

    /** Disable the skin: drop the override layer and restore the previous theme. */
    function themeRelease() {
      if (typeof overrideDisposeRef === 'function') {
        try {
          overrideDisposeRef()
        } catch {
          /* ignore */
        }
      }
      overrideDisposeRef = null
      if (themeServiceRef !== null && typeof themeServiceRef.setTheme === 'function') {
        try {
          themeServiceRef.setTheme(prevThemePrefRef ?? 'system')
        } catch {
          /* ignore */
        }
      }
    }

    /**
     * Acquire the theme service. On a COLD app boot the service can register
     * after our client bundle applies, so this is retried: apply() polls for
     * up to ~30s while the service stays missing. On success the two PRTS
     * themes are registered, the re-assert hook is attached (guarded against
     * double-hooking), and if the ui flag is already on the active skin is
     * applied immediately (late acquisition after phase=open).
     */
    function acquireTheme(ctx) {
      if (themeServiceRef !== null) return true
      if (ctx === null || ctx === undefined) return false
      try {
        const theme = (typeof ctx.get === 'function' ? ctx.get('theme') : undefined) ?? ctx.theme ?? null
        if (theme === null || typeof theme.register !== 'function') return false
        themeServiceRef = theme
        try {
          prevThemePrefRef = typeof theme.getTheme === 'function' ? theme.getTheme().preference : 'system'
        } catch {
          prevThemePrefRef = 'system'
        }
        for (const [id, def] of Object.entries(PRTS_THEMES)) {
          try {
            theme.register({ id, colorScheme: def.colorScheme, tokens: def.tokens })
          } catch {
            /* Duplicate registration (module re-applied) — keep the first. */
          }
        }
        if (themeHookRef === null && typeof ctx.on === 'function') {
          try {
            themeHookRef = ctx.on('theme/change', () => {
              if (themeServiceRef === null) return
              const flag = document.documentElement.dataset.prtsUi
              if (flag !== 'A' && flag !== 'B') return
              const themeId = PRTS_THEME_FOR_VARIANT[flag] ?? 'prts-paper'
              try {
                const snap = themeServiceRef.getTheme()
                let lost = true
                try {
                  lost = !(Array.isArray(snap.themes) && snap.themes.some((t) => t !== null && t !== undefined && t.id === themeId))
                } catch {
                  lost = true
                }
                if (lost) {
                  // The store was reset (settings adoption on restart wipes
                  // third-party definitions). Re-register + re-stack, then
                  // snap the preference back.
                  for (const [id, def] of Object.entries(PRTS_THEMES)) {
                    try {
                      themeServiceRef.register({ id, colorScheme: def.colorScheme, tokens: def.tokens })
                    } catch {
                      /* duplicate */
                    }
                  }
                  overrideDisposeRef = null
                  themeApply(themeId)
                  return
                }
                if (snap.preference !== themeId) themeServiceRef.setTheme(themeId)
              } catch {
                /* ignore */
              }
            })
          } catch {
            themeHookRef = null
          }
        }
        // Late acquisition: the gate has already reached open and the skin
        // effect ran without a service — apply the pending skin now.
        const flag = document.documentElement.dataset.prtsUi
        if (flag === 'A' || flag === 'B') themeApply(PRTS_THEME_FOR_VARIANT[flag] ?? 'prts-paper')
        return true
      } catch {
        return false
      }
    }

    const DEFAULTS = Object.freeze({
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
      keys: { doctor: '', amiya: '', kaltsit: '' },
      customUsers: [],
      uiSkin: true,
      uiBg: true,
      uiChat: true,
      uiPanels: true,
      uiFloat: true,
      ext: {},
    })

    // A custom key is a short optional override for an operator's access key.
    // Anything not matching this pattern (or an empty string) means "default".
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
     * like the terminal itself). Mirrors the Host whitelist.
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

    /** A custom row is saveable once it has a valid serial and any name. */
    function cuValid(entry) {
      return /^[A-Z0-9]{2,12}$/.test(String(entry.serial ?? '').trim().toUpperCase()) && (String(entry.cn ?? '').trim() !== '' || String(entry.en ?? '').trim() !== '')
    }

    /** Turn a settings-level custom profile into a login-user object. */
    function customProfile(entry, index) {
      const cn = entry.cn.trim() !== '' ? entry.cn : entry.en
      const en = entry.en.trim() !== '' ? entry.en : entry.cn
      return {
        id: 'custom-' + entry.serial.toLowerCase(),
        en,
        cn,
        role: 'CUSTOM',
        clearance: 1,
        serial: entry.serial,
        key: entry.key,
        tag: 'C-' + String(index + 1).padStart(2, '0'),
        note: '自定义档案 · 设置中添加',
      }
    }

    /**
     * Free-form extension config: a plain JSON object of at most 4KiB that is
     * persisted by the Host untouched. Future features read and write it via
     * `globalThis.__PRTS_BOOT_API__` (see `publishApi` below) — this is the
     * reserved extension point, so nothing else in the plugin may touch it.
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

    function normaliseSettings(raw) {
      const input = raw !== null && typeof raw === 'object' ? raw : {}
      const variant = 'AB'.includes(input.variant) && input.variant.length === 1 ? input.variant : DEFAULTS.variant
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

    /** Preview override used by the local harness; absent in a real host. */
    function preview() {
      try {
        const raw = globalThis.__PRTS_BOOT_PREVIEW__
        return raw !== null && typeof raw === 'object' ? raw : null
      } catch {
        return null
      }
    }

    // ---------------------------------------------------------------------
    // Cast & palette
    // ---------------------------------------------------------------------

    /**
     * Crew records. The access key is the last three digits of the 情报编号 —
     * the same rule Arknights uses for its own terminals, and the reason the
     * number is printed on every row. Numbers verified against prts.wiki:
     * Doctor B101 · Amiya R001 · Kal'tsit B003.
     */
    const USERS = Object.freeze([
      {
        id: 'doctor',
        en: 'DOCTOR',
        cn: '博士',
        role: 'COMMANDER',
        clearance: 5,
        serial: 'B101',
        key: '101',
        tag: 'A-01',
        note: '最高权限 · 全面指挥',
      },
      {
        id: 'amiya',
        en: 'AMIYA',
        cn: '阿米娅',
        role: 'CEO',
        clearance: 4,
        serial: 'R001',
        key: '001',
        tag: 'A-02',
        note: '公开档案 · 特别通道',
      },
      {
        id: 'kaltsit',
        en: "KAL'TSIT",
        cn: '凯尔希',
        role: 'MEDICAL DIRECTOR',
        clearance: 5,
        serial: 'B003',
        key: '003',
        tag: 'A-03',
        note: '受限档案 · 医疗体系',
      },
    ])

    /**
     * The hidden fourth record. It never appears in lists, hints or docs: the
     * identify plate's ◇ watermark must be tapped five times to wake it, and
     * even then it only shows as an unlabelled ghost row. It is Priestess —
     * the pre-civilisation scientist of Arknights lore (not the boss
     * "PRTS，"源代码"" and not the terminal AI): co-creator of Originium,
     * creator of Kal'tsit (Ama-10), who "exists as information within the
     * first Originium". She is no operator, so she holds no index and no key.
     * Identity per the moegirl page https://mzh.moegirl.org.cn/普瑞赛斯
     * (本名 普瑞赛斯 Priestess, 别号 牢普, 棕发紫瞳, 声优 浅川悠/许潇文,
     * 角色EP《Eclipse》); her 差分立绘 is the game's NPC avg 083 art.
     */
    const PRTS_USER = Object.freeze({
      id: 'prts',
      en: 'PRIESTESS',
      cn: '普瑞赛斯',
      role: 'LINGUIST',
      clearance: '∞',
      serial: '∞',
      key: '',
      tag: 'S-00',
      note: '隐藏档案 · 前文明',
    })

    const VARIANTS = Object.freeze({
      A: {
        id: 'A',
        code: 'ANALYSIS',
        label: '白 · 档案',
        desc: '纸本、坐标网格、蓝紫细线 —— 官方启动动画的直译',
        bg: '#efede7',
        panel: '#f7f5f0',
        ink: '#111110',
        dim: 'rgba(17,17,16,.52)',
        faint: 'rgba(17,17,16,.12)',
        line: 'rgba(17,17,16,.20)',
        acc: '#3f45c9',
        acc2: '#7a5cf0',
        grid: 'rgba(17,17,16,.055)',
        grid2: 'rgba(17,17,16,.085)',
        grain: 0.16,
        blend: 'multiply',
        vignette: 'rgba(58,56,48,.20)',
        danger: '#a8322a',
        boot: 'logo',
      },
      B: {
        id: 'B',
        code: 'CORE',
        label: '黑 · 核心',
        desc: '粒子云汇聚成菱形，白色字标 —— PRTS 核心的开机画面',
        bg: '#0a0a0b',
        panel: '#121214',
        ink: '#ece9e1',
        dim: 'rgba(236,233,225,.46)',
        faint: 'rgba(236,233,225,.10)',
        line: 'rgba(236,233,225,.20)',
        acc: '#e0a94f',
        acc2: '#ffcf7a',
        grid: 'rgba(236,233,225,.05)',
        grid2: 'rgba(236,233,225,.075)',
        grain: 0.22,
        blend: 'screen',
        vignette: 'rgba(0,0,0,.70)',
        danger: '#e2685c',
        boot: 'core',
      },
    })

    function variantOf(settings) {
      return VARIANTS[settings.variant] ?? VARIANTS.A
    }

    /** CSS custom properties for one variant, applied to the gate root. */
    function palette(paletteVariant) {
      return {
        '--p-bg': paletteVariant.bg,
        '--p-panel': paletteVariant.panel,
        '--p-ink': paletteVariant.ink,
        '--p-dim': paletteVariant.dim,
        '--p-faint': paletteVariant.faint,
        '--p-line': paletteVariant.line,
        '--p-acc': paletteVariant.acc,
        '--p-acc2': paletteVariant.acc2,
        '--p-danger': paletteVariant.danger,
        '--p-grid': paletteVariant.grid,
        '--p-grid2': paletteVariant.grid2,
        '--p-grain': paletteVariant.grain,
        '--p-blend': paletteVariant.blend,
        '--p-vig': paletteVariant.vignette,
      }
    }

    const STATUS_LINES = [
      'LINK ESTABLISHED',
      'LOADING CORE IMAGE',
      'VERIFYING SUBSYSTEMS',
      'IDENTITY SERVICE ONLINE',
      'VOICE MODULE LINKED',
      'READY',
    ]

    // ---------------------------------------------------------------------
    // Small utilities
    // ---------------------------------------------------------------------

    function pad(value) {
      return String(value).padStart(2, '0')
    }

    function clockText(date) {
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    function useClock() {
      const [now, setNow] = React.useState(() => new Date())
      React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
      }, [])
      return now
    }

    function hashCode(text) {
      let value = 2166136261
      for (let index = 0; index < text.length; index += 1) {
        value ^= text.charCodeAt(index)
        value = Math.imul(value, 16777619)
      }
      return value >>> 0
    }

    function seeded(seed) {
      let state = seed || 1
      return () => {
        state = (Math.imul(state, 1103515245) + 12345) >>> 0
        return state / 4294967296
      }
    }

    function readSession() {
      try {
        const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
        if (raw !== null && typeof raw === 'object' && typeof raw.user === 'string') return raw
      } catch {
        /* storage may be unavailable; a fresh gate is the correct fallback */
      }
      return null
    }

    function writeSession(user) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: user.id, at: Date.now() }))
      } catch {
        /* ignore */
      }
    }

    function clearSession() {
      try {
        sessionStorage.removeItem(SESSION_KEY)
      } catch {
        /* ignore */
      }
    }

    function userById(id) {
      const found = USERS.find((entry) => entry.id === id)
      if (found) return found
      return PRTS_USER.id === id ? PRTS_USER : null
    }

    // ---------------------------------------------------------------------
    // Atoms
    // ---------------------------------------------------------------------

    /** The PRTS mark: a thin diamond with a solid core. */
    function Mark({ size = 12, className = '' }) {
      return el(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          className: cx('prts-mark', className),
          'aria-hidden': 'true',
          focusable: 'false',
        },
        el('path', { d: 'M12 1.6 22.4 12 12 22.4 1.6 12Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }),
        el('path', { d: 'M12 8.2 15.8 12 12 15.8 8.2 12Z', fill: 'currentColor' }),
      )
    }

    /**
     * The wordmark, built the way the reference animation builds it: a hairline
     * rule, the compressed PRTS line, "SYNTHESIZE INFORMATION" set tight beneath
     * it, then "ANALYSIS OS" opened up with the OS pushed to the far edge.
     */
    function Wordmark({ font = 96, bars = true, className = '', stacked = true }) {
      return el(
        'div',
        {
          className: cx('prts-wm', className),
          style: { '--wm-font': typeof font === 'number' ? `${font}px` : font },
          role: 'img',
          'aria-label': 'PRTS — synthesize information — analysis OS',
        },
        bars ? el('span', { className: 'bar top' }) : null,
        el('span', { className: 'prts' }, 'PRTS'),
        el(
          'span',
          { className: 'syn' },
          'SYNTHESIZE INFORMATION'.split('').map((letter, index) =>
            letter === ' '
              ? el('span', { key: index, className: 'syn-space' })
              : el('span', { key: index, className: 'syn-char' }, letter),
          ),
        ),
        stacked
          ? el(
              'span',
              { className: 'os' },
              el('span', { className: 'os-word' }, 'ANALYSIS'),
              el('span', { className: 'os-word last' }, 'OS'),
            )
          : null,
        bars ? el('span', { className: 'bar bottom' }) : null,
      )
    }

    function Rule({ label, className = '' }) {
      return el('div', { className: cx('prts-rule', className) }, label ? el('span', { className: 'prts-rule-label' }, label) : null)
    }

    /** Decorative barcode; deterministic for a given seed so it never flickers. */
    function Barcode({ seed = 'B101', width = 108, height = 20, className = '' }) {
      const bars = React.useMemo(() => {
        const random = seeded(hashCode(seed))
        const list = []
        let x = 0
        while (x < width) {
          const barWidth = 1 + Math.floor(random() * 3)
          list.push({ x, width: Math.min(barWidth, width - x) })
          x += barWidth + 1 + Math.floor(random() * 2)
        }
        return list
      }, [seed, width])
      return el(
        'svg',
        {
          className: cx('prts-barcode', className),
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          shapeRendering: 'crispEdges',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        bars.map((bar, index) => el('rect', { key: index, x: bar.x, y: 0, width: bar.width, height, fill: 'currentColor' })),
      )
    }

    /** A rotating diamond reticle, used by the boot and grant scenes. */
    function Reticle({ size = 168, speed = 9, className = '' }) {
      return el(
        'div',
        { className: cx('prts-reticle', className), style: { width: size, height: size } },
        el('span', { className: 'ring slow' }),
        el('span', { className: 'ring mid' }),
        el('span', { className: 'core' }),
        el('span', { className: 'tick' }, '◇'),
        el('span', { className: 'orbit', style: { animationDuration: `${speed}s` } }, el('i', null)),
      )
    }

    function Eyebrow({ children, className = '' }) {
      return el('div', { className: cx('prts-eyebrow', className) }, children)
    }

    // ---------------------------------------------------------------------
    // Boot visuals
    // ---------------------------------------------------------------------

    /** Particle cloud converging into the diamond outline (variant B). */
    function CoreField({ progress, ink, acc }) {
      const canvasRef = React.useRef(null)
      const pointsRef = React.useRef(null)
      const progressRef = React.useRef(progress)
      progressRef.current = progress

      React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext('2d')
        if (!context) return

        let frame = 0
        let width = 0
        let height = 0
        const dpr = Math.min(2, globalThis.devicePixelRatio || 1)

        const resize = () => {
          const box = canvas.getBoundingClientRect()
          width = Math.max(1, Math.floor(box.width))
          height = Math.max(1, Math.floor(box.height))
          canvas.width = Math.floor(width * dpr)
          canvas.height = Math.floor(height * dpr)
          context.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const ensurePoints = () => {
          if (pointsRef.current !== null) return
          const random = seeded(20260401)
          const list = []
          const radius = Math.min(width, height) * 0.33
          const corners = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ]
          for (let index = 0; index < 1300; index += 1) {
            // A point on the diamond outline, pushed outward by a random radius.
            const t = random() * 4
            const side = Math.floor(t) % 4
            const offset = t - Math.floor(t)
            const from = corners[side]
            const to = corners[(side + 1) % 4]
            let tx = from[0] + (to[0] - from[0]) * offset
            let ty = from[1] + (to[1] - from[1]) * offset
            tx *= radius
            ty *= radius
            const angle = random() * Math.PI * 2
            const distance = radius * (1.5 + random() * 2.2)
            list.push({
              sx: Math.cos(angle) * distance,
              sy: Math.sin(angle) * distance * 0.62,
              tx,
              ty,
              delay: random() * 0.42,
              alpha: 0.3 + random() * 0.7,
              size: random() > 0.84 ? 2 : 1,
            })
          }
          pointsRef.current = list
        }

        const draw = () => {
          context.clearRect(0, 0, width, height)
          const cx0 = width / 2
          const cy0 = height / 2
          const reveal = Math.max(0, Math.min(1, progressRef.current))
          context.globalCompositeOperation = 'lighter'
          for (const point of pointsRef.current) {
            const local = Math.max(0, Math.min(1, (reveal - point.delay) / (1 - point.delay)))
            const eased = 1 - (1 - local) * (1 - local) * (1 - local)
            const x = cx0 + point.sx + (point.tx - point.sx) * eased
            const y = cy0 + point.sy + (point.ty - point.sy) * eased
            const drift = Math.sin(reveal * 6.2 + point.delay * 9) * (1 - eased) * 8
            context.globalAlpha = point.alpha * (0.28 + eased * 0.72)
            context.fillStyle = eased > 0.94 ? acc : ink
            context.fillRect(x + drift, y, point.size, point.size)
          }
          context.globalAlpha = 1
          context.globalCompositeOperation = 'source-over'

          // The diamond outline draws itself in once the cloud has settled.
          const outline = Math.max(0, Math.min(1, (reveal - 0.62) / 0.3))
          if (outline > 0) {
            const radius = Math.min(width, height) * 0.33
            context.strokeStyle = ink
            context.globalAlpha = outline * 0.26
            context.lineWidth = 1
            context.beginPath()
            context.moveTo(cx0, cy0 - radius)
            context.lineTo(cx0 + radius, cy0)
            context.lineTo(cx0, cy0 + radius)
            context.lineTo(cx0 - radius, cy0)
            context.closePath()
            context.stroke()
            context.globalAlpha = 1
          }
        }

        const loop = () => {
          draw()
          frame = requestAnimationFrame(loop)
        }

        resize()
        ensurePoints()
        loop()
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        return () => {
          cancelAnimationFrame(frame)
          observer.disconnect()
        }
      }, [ink, acc])

      return el('canvas', { ref: canvasRef, className: 'prts-canvas' })
    }

    /** Sweeping scan bar + barcode columns (variant C). */
    function ScanField({ progress, ink }) {
      const columns = React.useMemo(() => {
        const random = seeded(7717)
        return Array.from({ length: 54 }, () => ({
          width: 1 + Math.floor(random() * 3),
          height: 14 + Math.floor(random() * 74),
          opacity: 0.06 + random() * 0.26,
          delay: random() * 0.8,
        }))
      }, [])
      return el(
        'div',
        { className: 'prts-scanfield' },
        el(
          'div',
          { className: 'prts-scanbars' },
          columns.map((column, index) =>
            el('span', {
              key: index,
              style: {
                width: column.width,
                height: `${column.height}%`,
                opacity: column.opacity * (0.3 + progress * 0.9),
                transitionDelay: `${column.delay * 900}ms`,
                background: index % 9 === 0 ? ink : 'currentColor',
              },
            }),
          ),
        ),
        el('div', { className: 'prts-sweep', style: { transform: `translateY(${progress * 100}%)` } }),
        el('div', { className: 'prts-scanline-static' }),
      )
    }

    /** Horizontal glitch streaks that punctuate the white boot (variant A). */
    function LogoGlitch({ progress }) {
      const streaks = React.useMemo(() => {
        const random = seeded(4242)
        return Array.from({ length: 16 }, () => ({
          top: 8 + random() * 82,
          left: random() * 74,
          width: 2 + random() * 9,
          opacity: 0.1 + random() * 0.32,
          delay: random() * 1.6,
          accent: random() > 0.74,
        }))
      }, [])
      return el(
        'div',
        { className: 'prts-streaks', style: { opacity: progress > 0.06 ? 1 : 0 } },
        streaks.map((streak, index) =>
          el('span', {
            key: index,
            style: {
              top: `${streak.top}%`,
              left: `${streak.left}%`,
              width: `${streak.width}%`,
              opacity: streak.opacity,
              animationDelay: `${streak.delay}s`,
              background: streak.accent ? 'var(--p-acc)' : 'currentColor',
            },
          }),
        ),
      )
    }

    // ---------------------------------------------------------------------
    // Scenes
    // ---------------------------------------------------------------------

    function SceneTop({ left, right }) {
      const now = useClock()
      return el(
        'div',
        { className: 'prts-top' },
        el(Eyebrow, null, left),
        el('div', { className: 'prts-top-right' }, el(Eyebrow, null, right), el(Eyebrow, { className: 'prts-stamp' }, clockText(now))),
      )
    }

    function BootScene({ paletteVariant, onDone }) {
      const duration = paletteVariant.boot === 'core' ? 4600 : 4000
      const previewState = preview()
      const frozen = previewState !== null && typeof previewState.bootAt === 'number'
        ? Math.max(0, Math.min(1, previewState.bootAt))
        : null
      const [progress, setProgress] = React.useState(frozen ?? 0)
      const doneRef = React.useRef(false)

      React.useEffect(() => {
        if (frozen !== null) return undefined
        let frame = 0
        const start = performance.now()
        const tick = (now) => {
          const ratio = Math.min(1, (now - start) / duration)
          setProgress(ratio)
          if (ratio < 1) frame = requestAnimationFrame(tick)
          else if (!doneRef.current) {
            doneRef.current = true
            onDone()
          }
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
      }, [duration, onDone, frozen])

      const finish = React.useCallback(() => {
        if (doneRef.current) return
        doneRef.current = true
        onDone()
      }, [onDone])

      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault()
            finish()
          }
        }
        window.addEventListener('keydown', onKey, true)
        return () => window.removeEventListener('keydown', onKey, true)
      }, [finish])

      const eased = 1 - Math.pow(1 - progress, 3)
      const percent = Math.round(eased * 100)
      const status = STATUS_LINES[Math.min(STATUS_LINES.length - 1, Math.floor(progress * STATUS_LINES.length))]
      const reveal = Math.max(0, Math.min(1, (progress - 0.08) / 0.34))

      return el(
        'div',
        { className: cx('prts-scene', 'prts-boot', `boot-${paletteVariant.boot}`) },
        el(SceneTop, { left: 'PRTS // BOOT SEQUENCE', right: 'RHODES ISLAND INTRANET' }),
        paletteVariant.boot === 'core'
          ? el(CoreField, { progress: eased, ink: paletteVariant.ink, acc: paletteVariant.acc })
          : paletteVariant.boot === 'scan'
            ? el(ScanField, { progress: eased, ink: paletteVariant.ink })
            : el(LogoGlitch, { progress }),
        el(
          'div',
          { className: cx('prts-boot-center prts-pm', progress > 0.34 && progress < 0.62 ? 'glitching' : '') },
          el(
            'div',
            {
              className: 'prts-boot-mark',
              style: { opacity: reveal, transform: `translateY(${(1 - reveal) * 12}px)` },
            },
            el(Wordmark, { font: 'clamp(58px, 8.4vw, 120px)' }),
          ),
          el(
            'div',
            { className: 'prts-boot-caption', style: { opacity: Math.max(0, (progress - 0.3) * 3) } },
            el('span', null, 'OPERATING SYSTEM'),
            el('span', { className: 'dot' }),
            el('span', null, 'VERSION 4.2.1'),
            el('span', { className: 'dot' }),
            el('span', null, 'CLEARANCE OMEGA'),
          ),
        ),
      el(
        'div',
        { className: 'prts-boot-foot' },
        el(
          'div',
          { className: 'prts-boot-foot-top' },
          el(
            'div',
            { className: 'prts-log' },
            [
              ['00:00:00.412', 'POST / CLOCK SYNC', 'OK'],
              ['00:00:00.884', 'KERNEL IMAGE LOAD', 'OK'],
              ['00:00:01.206', 'IDENTITY SERVICE', 'READY'],
              ['00:00:01.690', 'VOICE MODULE', 'LINKED'],
              ['00:00:02.038', 'RHODES ISLAND UPLINK', 'SECURE'],
            ]
              .slice(0, 3 + Math.min(2, Math.floor(progress * 5)))
              .map((line, index) =>
                el(
                  'div',
                  {
                    key: line[0],
                    className: 'prts-log-line',
                    style: { opacity: 0.15 + Math.min(1, Math.max(0, progress * 6 - index * 0.7)) * 0.85 },
                  },
                  el('span', { className: 't' }, line[0]),
                  el('span', { className: 'n' }, line[1]),
                  el('span', { className: 'v' }, line[2]),
                ),
              ),
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'prts-skip',
              onClick: finish,
              'data-prts-skip': '1',
            },
            '跳过',
            el('span', { className: 'prts-kbd' }, 'SPACE'),
          ),
        ),
        el(
          'div',
          { className: 'prts-track' },
          el('span', { style: { width: `${eased * 100}%` } }, el('i', { className: 'tip' })),
        ),
        el(
          'div',
          { className: 'prts-boot-meta' },
          el('span', { className: 'meta-left' }, 'PRTS 4.2.1 · ANALYSIS OS'),
          el(
            'span',
            { className: 'meta-right' },
            el('span', { className: 'status' }, status),
            el('span', { className: 'num' }, `${String(percent).padStart(3, '0')}%`),
          ),
        ),
      ),
        el('div', { className: 'prts-corner tl prts-pf' }),
        el('div', { className: 'prts-corner tr prts-pf' }),
        el('div', { className: 'prts-corner bl prts-pf' }),
        el('div', { className: 'prts-corner br prts-pf' }),
      )
    }

    function UserRow({ user, active, ghost, onSelect, onHover }) {
      return el(
        'button',
        {
          type: 'button',
          className: cx('prts-row', ghost && 'is-prts', active && 'is-active'),
          onClick: () => onSelect(user),
          onMouseEnter: () => onHover(user),
          onFocus: () => onHover(user),
          'aria-label': `${user.en} ${user.cn}`,
        },
        el('span', { className: 'tag' }, user.tag),
        el(
          'span',
          { className: 'body' },
          el('span', { className: 'name' }, el('span', { className: 'en' }, user.en), el('span', { className: 'cn' }, user.cn)),
          el('span', { className: 'meta' }, user.role, el('i', { className: 'sep' }), `CLEARANCE ${user.clearance}`, el('i', { className: 'sep' }), user.note),
        ),
        el('span', { className: 'serial' }, el('span', { className: 'label' }, 'NO.'), user.serial),
        el('span', { className: 'go' }, '→'),
      )
    }

    /**
     * Anomaly overlay shown while the hidden record (Priestess) is awake on the
     * identify screen. Design locked in by the user: the silhouette only
     * materialises during three bursts per 7s loop, occupies the left half,
     * bottom-aligned with an 80px top gap, 72% peak opacity, no size animation.
     * `strong` (激进) adds slices, error streams, the COMPROMISED stamp and the
     * corrupted red/cyan avatar split; `subtle` (含蓄) keeps just the dimmed
     * silhouette, halo and soft flicker. The whole layer is pointer-transparent.
     */
    function AnomalyFx({ strong }) {
      const src = preview() !== null ? 'assets/prts_npc083_silhouette.png' : `${ASSET_URL}/prts-silhouette.png`
      return el(
        'div',
        { className: cx('prts-anomaly', strong && 'strong'), 'aria-hidden': 'true' },
        el(
          'div',
          { className: 'prts-anomaly-sil' },
          el('div', { className: 'prts-anomaly-portal' }),
          el('div', { className: 'prts-anomaly-halo' }),
          el(
            'div',
            { className: 'prts-anomaly-fig' },
            el('div', { className: 'layer' }, el('img', { src, alt: '' })),
            strong ? el('div', { className: 'layer corrupted' }, el('img', { src, alt: '' })) : null,
          ),
        ),
        strong ? el('div', { className: 'prts-anomaly-slice s1' }) : null,
        strong ? el('div', { className: 'prts-anomaly-slice s2' }) : null,
        strong ? el('div', { className: 'prts-anomaly-slice s3' }) : null,
        el('div', { className: 'prts-anomaly-flicker' }),
        strong
          ? el(
              'div',
              { className: 'prts-anomaly-errs tl' },
              el('div', { className: 'err' }, 'SIGFAULT 0x1F :: ACCESS OVERRIDE'),
              el('div', { className: 'err' }, 'prts.core: overwrite(9) → ROOT …'),
              el('div', { className: 'err red' }, '0x7A [E] identity.db: record 083 … corrupt'),
              el('div', { className: 'gibberish' }, '▓▒░ ███▒░░ ▓░▒▓'),
            )
          : null,
        strong
          ? el(
              'div',
              { className: 'prts-anomaly-errs br' },
              el('div', { className: 'err' }, 'kernel: EYESOFPRIESTESS …'),
              el('div', { className: 'err' }, 'watchdog: 167 tally / 3711 node'),
              el('div', { className: 'gibberish' }, '░░▒▓█ ░▒▓ ██░▒'),
            )
          : null,
        strong ? el('div', { className: 'prts-anomaly-stamp' }, 'SYSTEM COMPROMISED') : null,
      )
    }

    function PrtsFx() {
      // Priestess flow overlay (passcode / granted): purple diamonds, red
      // whispers, staggered desaturated slice bars and (via .prts-fx-on on the
      // scene) whole-scene jitter. Pure decoration — pointer-events:none.
      const whispers = [
        { c: 'r1', t: 'I have not forgotten you.' },
        { c: 'r2', t: 'Do you still remember the stars?' },
        { c: 'r3', t: 'We will meet again.' },
        { c: 'r4', t: 'The eclipse remembers.' },
        { c: 'r5', t: 'Stay with me, Doctor.' },
        { c: 'r6', t: 'Even if the world ends.' },
      ]
      const slices = [
        'sl1 r', 'sl2 c', 'sl3 rc shift', 'sl4 g', 'sl5 w r', 'sl6 c', 'sl7 g shift',
        'sl8 w rc', 'sl9 r', 'sl10 c shift', 'sl11 g', 'sl12 w g', 'sl13 rc shift', 'sl14 r',
      ]
      return el(
        'div',
        { className: 'prts-pfx', 'aria-hidden': 'true' },
        el('div', { className: 'prts-pfx-d d1' }),
        el('div', { className: 'prts-pfx-d d2' }),
        el('div', { className: 'prts-pfx-d d3' }),
        el('div', { className: 'prts-pfx-d d4' }),
        el('div', { className: 'prts-pfx-d d5' }),
        ...whispers.map((w) => el('span', { className: `prts-pfx-rt ${w.c}` }, w.t)),
        ...slices.map((c) => el('span', { className: `prts-pfx-sl ${c}` })),
      )
    }

    function IdentifyScene({ paletteVariant, onPick, speak, hover, type, anomaly, keys, customUsers }) {
      const previewState = preview()
      const [hovered, setHovered] = React.useState(0)
      const [hiddenOn, setHiddenOn] = React.useState(() => previewState?.reveal === true)
      const [view, setView] = React.useState(() => (previewState?.view === 'list' ? 'list' : 'input')) // 'input' (自主输入) | 'list' (档案选择)
      const [entry, setEntry] = React.useState(() => previewState?.entry ?? '')
      const [entryError, setEntryError] = React.useState(false)
      const listRef = React.useRef(null)
      const entryRef = React.useRef(null)
      const tapsRef = React.useRef([])
      const revealedRef = React.useRef(previewState?.reveal === true)
      const customProfiles = React.useMemo(
        () => (Array.isArray(customUsers) ? customUsers.map((entry, index) => customProfile(entry, index)) : []),
        [customUsers],
      )
      const visible = hiddenOn ? [...USERS, ...customProfiles, PRTS_USER] : [...USERS, ...customProfiles]
      const customKeysCount =
        keys !== null && typeof keys === 'object'
          ? ['doctor', 'amiya', 'kaltsit'].filter((id) => typeof keys[id] === 'string' && keys[id] !== '').length
          : 0

      // Serial auto-match: B101 → 博士, B103 → 凯尔希, R001 → 阿米娅.
      // (B003 is the wiki serial; B103 is kept as an alias per user request.)
      // User-defined profiles from Settings match by serial or by exact name.
      const matchEntry = React.useCallback((raw) => {
        const norm = String(raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '')
        if (norm === '') return null
        const serialMap = { B101: 'doctor', R001: 'amiya', B003: 'kaltsit', B103: 'kaltsit' }
        const id = serialMap[norm]
        if (id !== undefined) return userById(id) ?? null
        if (norm === 'PRTS') return PRTS_USER
        const byName = USERS.find(
          (u) => u.en.toUpperCase() === norm || u.cn.toUpperCase() === norm || u.id.toUpperCase() === norm,
        )
        if (byName) return byName
        return (
          customProfiles.find(
            (u) => u.serial.toUpperCase() === norm || u.en.toUpperCase() === norm || u.cn.toUpperCase() === norm,
          ) ?? null
        )
      }, [customProfiles])

      const entryMatch = React.useMemo(() => matchEntry(entry), [entry, matchEntry])

      const submitEntry = React.useCallback(() => {
        const matched = matchEntry(entry)
        if (matched !== null) onPick(matched)
        else if (entry.trim() !== '') {
          setEntryError(true)
          speak('denied')
        }
      }, [entry, matchEntry, onPick, speak])

      React.useEffect(() => {
        try {
          if (view === 'list') listRef.current?.focus({ preventScroll: true })
          else entryRef.current?.focus({ preventScroll: true })
        } catch {
          /* focus is a nicety */
        }
      }, [view])

      React.useEffect(() => {
        // List navigation keys only apply while the profile list is shown.
        if (view !== 'list') return undefined
        const seqRef = { buf: '', last: 0 }
        const onKey = (event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const delta = event.key === 'ArrowDown' ? 1 : -1
            setHovered((current) => (current + delta + visible.length) % visible.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            if (hovered >= 0 && hovered < visible.length) onPick(visible[hovered])
          } else if (/^[1-9]$/.test(event.key)) {
            const index = Number(event.key) - 1
            if (index < visible.length) {
              event.preventDefault()
              onPick(visible[index])
            }
          } else if (/^[a-zA-Z]$/.test(event.key) && event.key.length === 1) {
            // Silent passphrase: typing P R T S (case-insensitive, within 3s)
            // also wakes the hidden record. Same effect as the ◇ taps.
            const now = Date.now()
            if (now - seqRef.last > 3000) seqRef.buf = ''
            seqRef.last = now
            seqRef.buf = (seqRef.buf + event.key.toLowerCase()).slice(-4)
            if (seqRef.buf === 'prts') setHiddenOn(true)
          }
        }
        window.addEventListener('keydown', onKey, true)
        return () => window.removeEventListener('keydown', onKey, true)
      }, [view, hovered, onPick, visible.length, visible])

      // Five taps on the plate's ◇ watermark wake the hidden record. There is
      // no hint anywhere in the UI; the row just appears, flickering.
      const onDiamond = React.useCallback(() => {
        const now = Date.now()
        tapsRef.current = tapsRef.current.filter((at) => now - at < 4000)
        tapsRef.current.push(now)
        if (tapsRef.current.length >= 5) setHiddenOn(true)
      }, [])

      React.useEffect(() => {
        if (hiddenOn && !revealedRef.current) {
          revealedRef.current = true
          if (previewState === null) speak('prts-reveal')
        }
      }, [hiddenOn, speak, previewState])

      return el(
        'div',
        { className: cx('prts-scene', 'prts-identify', hiddenOn && anomaly > 0 && 'prts-anomaly-on') },
        el(SceneTop, { left: 'PRTS // IDENTITY', right: 'ACCESS CONTROL' }),
        el(
          'div',
          { className: 'prts-identify-main' },
          el(
            'div',
            { className: 'prts-identify-left' },
            view === 'input'
              ? [
                  el(Eyebrow, { className: 'prts-step' }, '01 / 02 — OPERATOR'),
                  el('h1', { className: 'prts-h1' }, '请出示身份凭证'),
                  el('p', { className: 'prts-sub' }, 'ENTER SERIAL OR USERNAME TO CONTINUE'),
                  el(
                    'form',
                    {
                      className: 'prts-entry-form prts-pm',
                      onSubmit: (event) => {
                        event.preventDefault()
                        submitEntry()
                      },
                      noValidate: true,
                    },
                    el(
                      'label',
                      { className: 'prts-field' },
                      el('span', { className: 'prts-label' }, el('span', null, 'ACCESS KEY'), el('span', { className: 'prts-label-sub' }, 'OPERATOR ID')),
                      el(
                        'span',
                        { className: cx('prts-input-wrap', entry.length > 0 && 'has-value') },
                        el('input', {
                          ref: entryRef,
                          className: 'prts-input',
                          type: 'text',
                          value: entry,
                          maxLength: 24,
                          autoFocus: true,
                          placeholder: 'ENTER USERNAME',
                          'aria-label': '档案编号或用户名',
                          spellCheck: false,
                          autoComplete: 'off',
                          onChange: (event) => {
                            setEntry(event.target.value)
                            setEntryError(false)
                            type()
                          },
                        }),
                      ),
                    ),
                    el(
                      'div',
                      { className: cx('prts-match', entryMatch !== null && 'hit') },
                      entryMatch !== null
                        ? `→ ${entryMatch.cn === entryMatch.en ? entryMatch.cn : `${entryMatch.cn} · ${entryMatch.en}`}`
                        : entry.trim() !== ''
                          ? ' '
                          : 'ENTER USERNAME TO CONTINUE',
                    ),
                    el(
                      'div',
                      { className: cx('prts-error', entryError && 'show'), role: entryError ? 'alert' : undefined },
                      entryError ? '用户不存在 · USER NOT FOUND' : ' ',
                    ),
                    el(
                      'div',
                      { className: 'prts-entry-actions' },
                      el('button', { type: 'submit', className: 'prts-submit' }, '进 入'),
                      el('button', { type: 'button', className: 'prts-link', onClick: () => setView('list') }, '档案选择'),
                    ),
                  ),
                ]
              : [
                  el(Eyebrow, { className: 'prts-step' }, '01 / 02 — OPERATOR'),
                  el('h1', { className: 'prts-h1' }, '请选择登录档案'),
                  el('p', { className: 'prts-sub' }, 'SELECT AN OPERATOR PROFILE TO CONTINUE'),
                  el(
                    'div',
                    { className: 'prts-rows prts-pm', ref: listRef, tabIndex: -1 },
                    visible.map((user, index) =>
                      el(UserRow, {
                        key: user.id,
                        user,
                        ghost: user.id === 'prts',
                        active: index === hovered,
                        onSelect: onPick,
                        onHover: () => {
                          setHovered(index)
                          hover()
                        },
                      }),
                    ),
                  ),
                  el(
                    'div',
                    { className: 'prts-hint' },
                    el('span', null, '↑ ↓ 选择'),
                    el('span', null, 'ENTER 确认'),
                    el('span', null, customKeysCount > 0 ? `自定义密码已启用 · ${customKeysCount} / 3` : '访问密钥为档案编号末三位'),
                  ),
                  el(
                    'div',
                    { className: 'prts-list-back' },
                    el('button', { type: 'button', className: 'prts-link', onClick: () => setView('input') }, '← 自主输入'),
                  ),
                ],
          ),
          el(
            'aside',
            { className: 'prts-plate prts-pl' },
            el('div', { className: 'prts-plate-top' }, el(Mark, { size: 11 }), el('span', null, 'PRTS')),
            el(
              'div',
              { className: 'prts-plate-mid' },
              el(Wordmark, { font: 'clamp(30px, 2.9vw, 42px)' }),
              el('div', { className: 'prts-plate-tag' }, 'RHODES ISLAND · ANALYSIS OS'),
            ),
            el(
              'div',
              { className: 'prts-plate-data' },
              [['ACCESS NODES', '03'], ['CHANNEL', 'SECURE'], ['PROTOCOL', 'PRTS / 4.2.1'], ['LAST SYNC', '02:55:04'], ['REGION', 'TERRA · EAST']].map((row) =>
                el('div', { key: row[0], className: 'prts-plate-row' }, el('span', null, row[0]), el('span', { className: 'v' }, row[1])),
              ),
            ),
            el('div', { className: 'prts-plate-watermark', onClick: onDiamond }, '◇'),
            el(Reticle, { size: 176, speed: 34, className: 'prts-plate-reticle' }),
            el('div', { className: 'prts-plate-foot' }, el(Barcode, { seed: 'rhodes-island' }), el('span', { className: 'vt' }, 'RHODES ISLAND — PRTS DIVISION')),
          ),
        ),
        el(
          'div',
          { className: 'prts-footer' },
          el('span', null, 'PRTS 4.2.1 — ANALYSIS OS'),
          el('span', { className: 'mid' }, 'SECURE CHANNEL · 12 MS'),
          el('span', null, 'NO UNAUTHORIZED ACCESS'),
        ),
        hiddenOn && anomaly > 0 ? el(AnomalyFx, { strong: anomaly === 2 }) : null,
      )
    }

    function PasscodeScene({ paletteVariant, user, onBack, onGranted, onDenied, error, type, keys }) {
      const [value, setValue] = React.useState('')
      const [reveal, setReveal] = React.useState(false)
      const [attempt, setAttempt] = React.useState(1)
      const inputRef = React.useRef(null)

      // A custom key from the settings tab overrides the default serial key.
      const customKey = keys !== null && typeof keys === 'object' && typeof keys[user.id] === 'string' ? keys[user.id].trim() : ''
      const effectiveKey = customKey === '' ? user.key : customKey
      const isCustomUser = user.id.startsWith('custom-')

      React.useEffect(() => {
        try {
          inputRef.current?.focus({ preventScroll: true })
        } catch {
          /* ignore */
        }
      }, [])

      const submit = (event) => {
        event?.preventDefault?.()
        // PRTS is the system itself, and a user-defined profile may be saved
        // without a key: confirming is the override / entry for both.
        const keyless = user.id === 'prts' || user.key === ''
        if (keyless || value.trim() === effectiveKey) {
          onGranted(user)
        } else {
          setAttempt((current) => current + 1)
          setValue('')
          onDenied(user)
          try {
            inputRef.current?.focus()
          } catch {
            /* ignore */
          }
        }
      }

      return el(
        'div',
        { className: cx('prts-scene prts-passcode', user.id === 'prts' && 'prts-fx-on') },
        el(SceneTop, { left: 'PRTS // AUTHENTICATION', right: user.en }),
        el('div', { className: 'prts-vlabel left prts-pl' }, 'SECURE TERMINAL 0x2F1A'),
        el('div', { className: 'prts-vlabel right prts-pl' }, 'RHODES ISLAND · INTRANET'),
        el(
          'form',
          { className: 'prts-passcode-form prts-pm', onSubmit: submit, noValidate: true },
          el('div', { className: 'prts-passcode-mark' }, el(Wordmark, { font: 'clamp(38px, 4.4vw, 56px)' })),
          el('div', { className: 'prts-please' }, 'PLEASE LOGIN'),
          el(
            'div',
            { className: 'prts-identity' },
            el(Mark, { size: 13 }),
            el('span', { className: 'en' }, user.en),
            el('span', { className: 'cn' }, user.cn),
            el('button', { type: 'button', className: 'prts-link', onClick: onBack }, '切换档案'),
          ),
          user.id === 'prts' || user.key === ''
            ? null
            : el(
                'label',
                { className: 'prts-field' },
                el(
                  'span',
                  { className: 'prts-label' },
                  el('span', null, 'ACCESS KEY'),
                  el('span', { className: 'prts-label-sub' }, customKey !== '' || isCustomUser ? '自定义密钥' : '档案编号末三位'),
                ),
                el(
                  'span',
                  { className: cx('prts-input-wrap', error && 'has-error', value.length > 0 && 'has-value') },
                  el('input', {
                    ref: inputRef,
                    className: 'prts-input',
                    type: reveal ? 'text' : 'password',
                    inputMode: customKey === '' && !isCustomUser ? 'numeric' : 'text',
                    autoComplete: 'off',
                    spellCheck: false,
                    maxLength: 12,
                    value,
                    'aria-label': 'Access key',
                    onChange: (event) => {
                      setValue(event.target.value.replace(/[^\x21-\x7e]/g, '').slice(0, 12))
                      type()
                    },
                  }),
                  el(
                    'button',
                    {
                      type: 'button',
                      className: 'prts-eye',
                      onClick: () => setReveal((current) => !current),
                      'aria-label': reveal ? '隐藏密钥' : '显示密钥',
                      tabIndex: -1,
                    },
                    reveal ? '◉' : '◎',
                  ),
                ),
              ),
          el(
            'div',
            { className: cx('prts-error', error && 'show'), role: error ? 'alert' : undefined },
            error ? '验证失败 · 访问密钥不正确，请重新确认' : ' ',
          ),
          el('button', { type: 'submit', className: 'prts-submit' }, user.id === 'prts' ? '唤醒档案' : user.key === '' ? '进入系统' : '登 录'),
          el(
            'div',
            { className: 'prts-passcode-foot' },
            el('span', null, `ATTEMPT ${String(attempt).padStart(2, '0')} / 03`),
            el('span', null, user.id === 'prts' || user.key === '' ? 'KEY NOT REQUIRED' : customKey !== '' || isCustomUser ? 'CUSTOM KEY' : 'KEY LENGTH 03'),
            el('span', null, 'ENCRYPTION AES-256'),
          ),
        ),
        el(
          'div',
          { className: 'prts-footer' },
          el('span', null, 'PRTS 4.2.1 — ANALYSIS OS'),
          el('span', { className: 'mid' }, error ? 'ACCESS DENIED' : 'AWAITING CREDENTIALS'),
          el('span', null, '◀ 返回'),
        ),
        user.id === 'prts' ? el(PrtsFx) : null,
      )
    }

    function GrantScene({ paletteVariant, user, onFull }) {
      const previewState = preview()
      const frozen = previewState !== null && typeof previewState.grantAt === 'number'
        ? Math.max(0, Math.min(1, previewState.grantAt))
        : null
      const [progress, setProgress] = React.useState(frozen ?? 0)

      React.useEffect(() => {
        if (frozen !== null) return undefined
        const start = performance.now()
        let frame = 0
        // Long enough to feel like a real handover; the Gate then HOLDS the
        // scene until the granted voice line has fully played out.
        const duration = 4000
        const tick = (now) => {
          const ratio = Math.min(1, (now - start) / duration)
          setProgress(ratio)
          if (ratio < 1) frame = requestAnimationFrame(tick)
          else onFull()
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
      }, [onFull, frozen])

      return el(
        'div',
        { className: cx('prts-scene prts-grant', user.id === 'prts' && 'prts-fx-on') },
        el('div', { className: 'prts-grant-glow prts-pf' }),
        el(
          'div',
          { className: 'prts-grant-center prts-pm' },
          el(Reticle, { size: 190, speed: 7 }),
          el('div', { className: 'prts-grant-mark' }, el(Wordmark, { font: 'clamp(46px, 5.6vw, 74px)' })),
          el(
            'div',
            { className: 'prts-grant-line' },
            el('span', null, 'ACCESS GRANTED'),
            el('span', { className: 'pct' }, `${String(Math.round(progress * 100)).padStart(3, '0')}%`),
          ),
          el('div', { className: 'prts-grant-user' }, el('span', { className: 'lbl' }, 'WELCOME BACK,'), el('span', { className: 'who' }, user.en)),
          el('div', { className: 'prts-grant-meta' }, `档案 ${user.serial}`, el('i', { className: 'sep' }), `权限 ${user.clearance}`, el('i', { className: 'sep' }), user.id === 'prts' ? 'BABEL' : 'RHODES ISLAND'),
        ),
        el(
          'div',
          { className: 'prts-grant-foot' },
          el(
            'div',
            { className: 'prts-grant-foot-line' },
            el('span', null, 'SECURE CHANNEL · HANDOVER COMPLETE'),
            el('span', { className: 'pct' }, `${String(Math.round(progress * 100)).padStart(3, '0')}%`),
          ),
          el('div', { className: 'prts-grant-track' }, el('span', { style: { width: `${progress * 100}%` } })),
        ),
        el('div', { className: 'prts-grant-scan' }),
        user.id === 'prts' ? el(PrtsFx) : null,
      )
    }

    // ---------------------------------------------------------------------
    // Audio
    // ---------------------------------------------------------------------

    function reportAudioError(message) {
      try {
        fetch(`${BASE}/api/beacon`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ audio: message }),
        }).catch(() => {})
      } catch {
        /* ignore */
      }
    }

    function useVoice(settingsRef) {
      // WebAudio engine: one shared AudioContext, cached decoded buffers and
      // three gain buses (voice / sfx / bed). Every entry and exit is a short
      // gain ramp so nothing hard-cuts; the bed ducks under voice cues and is
      // itself a seamless looped buffer source.
      const ctxRef = React.useRef(null)
      const voiceBusRef = React.useRef(null)
      const sfxBusRef = React.useRef(null)
      const bedBusRef = React.useRef(null)
      const cacheRef = React.useRef(new Map())
      const bedSrcRef = React.useRef(null)
      const okSrcRef = React.useRef(null)
      const bedOnRef = React.useRef(false)
      const bedVolRef = React.useRef(0)
      const pendingRef = React.useRef(null)
      const hoverAtRef = React.useRef(0)
      // Voice lane: one voice cue audible at a time (a new cue gently cuts
      // the previous one), so lines never overlap and stay distinguishable.
      const voiceLaneRef = React.useRef(null)
      // Once-per-session guards: the boot bed and the success bed each play
      // exactly one pass per gate session; both reset on re-lock.
      const bgmOnceRef = React.useRef(false)
      const okOnceRef = React.useRef(false)
      // Monotonic voice-request sequence: a cue whose load resolves after a
      // newer request must NOT start (it would otherwise cut the newer line).
      const voiceSeqRef = React.useRef(0)
      // Soft-voice queue: cues requested while the lane is busy play right
      // after the current line ends, instead of cutting it mid-word.
      const laneQueueRef = React.useRef([])
      const playClipRef = React.useRef(null)

      const ac = React.useCallback(() => {
        if (ctxRef.current === null) {
          const AC = globalThis.AudioContext || globalThis.webkitAudioContext
          if (typeof AC === 'undefined') return null
          const ctx = new AC()
          voiceBusRef.current = ctx.createGain()
          sfxBusRef.current = ctx.createGain()
          bedBusRef.current = ctx.createGain()
          voiceBusRef.current.gain.value = 1
          sfxBusRef.current.gain.value = 1
          bedBusRef.current.gain.value = 0
          voiceBusRef.current.connect(ctx.destination)
          sfxBusRef.current.connect(ctx.destination)
          bedBusRef.current.connect(ctx.destination)
          ctxRef.current = ctx
        }
        return ctxRef.current
      }, [])

      const load = React.useCallback((clip, ctx) => {
        const hit = cacheRef.current.get(clip)
        if (hit !== undefined) return Promise.resolve(hit)
        return fetch(`${VOICE_URL}/${clip}.mp3`, { credentials: 'same-origin', cache: 'no-store' })
          .then((response) => {
            if (!response.ok) throw new Error(`voice ${clip} -> HTTP ${response.status}`)
            return response.arrayBuffer()
          })
          .then((data) => ctx.decodeAudioData(data))
          .then((buffer) => {
            cacheRef.current.set(clip, buffer)
            return buffer
          })
      }, [])

      // One-shot through an envelope node: quick fade-in, longer fade-out.
      // A voice cue ducks the bed and ALWAYS restores it on end (even if the
      // bed started while the voice was already playing). `lane`, when given,
      // records the active source+envelope so a newer voice cue can gently
      // cut the previous one.
      const play = React.useCallback((ctx, buffer, bus, vol, duck, lane) => {
        const src = ctx.createBufferSource()
        src.buffer = buffer
        const env = ctx.createGain()
        const t0 = ctx.currentTime
        const dur = buffer.duration
        const fadeIn = Math.min(0.02, dur / 5)
        const fadeOut = Math.min(0.14, dur / 4)
        env.gain.setValueAtTime(0.0001, t0)
        env.gain.linearRampToValueAtTime(vol, t0 + fadeIn)
        env.gain.setValueAtTime(vol, t0 + Math.max(fadeIn, dur - fadeOut))
        env.gain.linearRampToValueAtTime(0.0001, t0 + dur)
        src.connect(env)
        env.connect(bus)
        let restore = null
        if (duck && bedBusRef.current !== null) {
          const target = bedVolRef.current
          bedBusRef.current.gain.cancelScheduledValues(t0)
          bedBusRef.current.gain.setTargetAtTime(Math.max(0, target * 0.35), t0, 0.05)
          restore = () => {
            const now = ctx.currentTime
            bedBusRef.current.gain.cancelScheduledValues(now)
            bedBusRef.current.gain.setTargetAtTime(bedVolRef.current, now, 0.3)
          }
        }
        if (lane !== null) lane.current = { src, env }
        src.onended = () => {
          if (lane !== null && lane.current !== null && lane.current.src === src) {
            lane.current = null
            // The line ended; start the next queued soft cue (if any).
            if (lane === voiceLaneRef && laneQueueRef.current.length > 0) {
              const next = laneQueueRef.current.shift()
              if (playClipRef.current !== null) playClipRef.current(next.clip, next.vol, next.duck)
            }
          }
          if (restore !== null) restore()
        }
        src.start(t0)
        src.stop(t0 + dur + 0.05)
      }, [])

      // Gently cut the voice lane: 60 ms gain ramp down, then stop.
      const stopVoice = React.useCallback((ctx) => {
        const lane = voiceLaneRef.current
        if (lane === null) return
        const now = ctx.currentTime
        lane.env.gain.cancelScheduledValues(now)
        lane.env.gain.setValueAtTime(Math.max(0.0001, lane.env.gain.value), now)
        lane.env.gain.linearRampToValueAtTime(0.0001, now + 0.06)
        try { lane.src.stop(now + 0.09) } catch { /* ignore */ }
      }, [])

      const playClip = React.useCallback((clip, vol, duck) => {
        const ctx = ac()
        if (ctx === null) return
        // UI interaction sounds (hover/tick/pick) follow the `sfx` switch and
        // never the `voice` switch: muting the float bar must not touch the
        // startup sounds or the voice lines, and vice versa.
        const isUiSfx = clip === 'hover' || clip === 'tick' || clip === 'pick'
        if (isUiSfx ? !settingsRef.current.sfx : !settingsRef.current.voice) return
        if (ctx.state === 'suspended') {
          // Autoplay is refused until the first user gesture; defer the cue.
          if (clip !== 'hover') pendingRef.current = { clip, vol, duck }
          return
        }
        const bus = clip === 'hover' ? sfxBusRef.current : voiceBusRef.current
        const isVoice = bus === voiceBusRef.current
        let seq = 0
        if (isVoice) {
          // Cut the current line synchronously so a slow-loading older cue
          // can never arrive after a newer one and cut it mid-word.
          seq = ++voiceSeqRef.current
          stopVoice(ctx)
        }
        load(clip, ctx)
          .then((buffer) => {
            if (isVoice && seq !== voiceSeqRef.current) return // superseded by a newer cue
            play(ctx, buffer, bus, vol, duck, isVoice ? voiceLaneRef : null)
          })
          .catch((error) => reportAudioError(String((error && error.message) || error)))
      }, [ac, load, play, stopVoice, settingsRef])

      playClipRef.current = playClip

      const speak = React.useCallback(
        (clip) => playClip(clip, settingsRef.current.volume, true),
        [playClip, settingsRef],
      )

      // Queue a voice line behind the current one: used for the post-grant
      // welcome so it never cuts granted-<user> off mid-sentence.
      const speakSoft = React.useCallback(
        (clip) => {
          const ctx = ac()
          if (ctx === null) return
          if (!settingsRef.current.voice) return
          if (ctx.state === 'suspended') {
            pendingRef.current = { clip, vol: settingsRef.current.volume, duck: true }
            return
          }
          if (voiceLaneRef.current === null) {
            playClip(clip, settingsRef.current.volume, true)
          } else {
            laneQueueRef.current.push({ clip, vol: settingsRef.current.volume, duck: true })
          }
        },
        [ac, playClip, settingsRef],
      )

      const hover = React.useCallback(() => {
        const now = Date.now()
        if (now - hoverAtRef.current < 60) return
        hoverAtRef.current = now
        playClip('hover', 0.7, false)
      }, [playClip])

      const typeAtRef = React.useRef(0)
      const type = React.useCallback(() => {
        const now = Date.now()
        if (now - typeAtRef.current < 45) return
        typeAtRef.current = now
        playClip('tick', 0.5, false)
      }, [playClip])

      const pick = React.useCallback(() => playClip('pick', 0.55, false), [playClip])

      const bedVolume = React.useCallback(() => Math.min(0.95, settingsRef.current.volume * 1.4), [settingsRef])

      const fadeBedTo = React.useCallback((target) => {
        const ctx = ctxRef.current
        if (ctx === null || bedBusRef.current === null) return
        const now = ctx.currentTime
        bedBusRef.current.gain.cancelScheduledValues(now)
        bedBusRef.current.gain.setTargetAtTime(target, now, 0.4)
      }, [])

      // Boot background audio: the Rhodes Island splash score (bgm.mp3), ONE
      // pass per session — it plays at the start of the gate and then stays
      // silent (bgmOnceRef). Fades in/out with no hard edge.
      const ambience = React.useCallback((on) => {
        bedOnRef.current = on
        const ctx = ac()
        if (ctx === null) return
        if (!on) {
          if (bedSrcRef.current !== null) {
            try { bedSrcRef.current.stop() } catch { /* ignore */ }
            bedSrcRef.current = null
          }
          // Leave the success sting alone — it plays through the same bed bus.
          if (okSrcRef.current === null) fadeBedTo(0)
          return
        }
        if (!settingsRef.current.voice) return
        if (bgmOnceRef.current) return
        if (okSrcRef.current !== null) {
          try { okSrcRef.current.stop() } catch { /* ignore */ }
          okSrcRef.current = null
        }
        if (bedSrcRef.current !== null) return
        const vol = bedVolume()
        bedVolRef.current = vol
        load('bgm', ctx)
          .then((buffer) => {
            if (!bedOnRef.current) return
            const src = ctx.createBufferSource()
            src.buffer = buffer
            src.loop = false
            src.onended = () => {
              if (bedSrcRef.current === src) bedSrcRef.current = null
            }
            src.connect(bedBusRef.current)
            src.start(0)
            bedSrcRef.current = src
            bgmOnceRef.current = true
            fadeBedTo(vol)
            // The boot cue may still be talking when the bed is finally
            // loaded; keep it ducked until the voice releases the bed.
            if (voiceLaneRef.current !== null) {
              const now = ctx.currentTime
              bedBusRef.current.gain.cancelScheduledValues(now)
              bedBusRef.current.gain.setTargetAtTime(Math.max(0, vol * 0.35), now, 0.05)
            }
          })
          .catch((error) => reportAudioError(String((error && error.message) || error)))
      }, [ac, load, bedVolume, fadeBedTo, settingsRef])

      // Bed one-shot: stop both bed sources, then play the given clip once
      // through the bed bus. Used for the login-success sting (bgm-ok) and
      // for the settings-page BGM audition (bgm).
      const sting = React.useCallback((clip) => {
        const ctx = ac()
        if (ctx === null) return
        if (!settingsRef.current.voice) return
        if (bedSrcRef.current !== null) {
          try { bedSrcRef.current.stop() } catch { /* ignore */ }
          bedSrcRef.current = null
        }
        if (okSrcRef.current !== null) {
          try { okSrcRef.current.stop() } catch { /* ignore */ }
          okSrcRef.current = null
        }
        const vol = bedVolume()
        bedVolRef.current = vol
        load(clip, ctx)
          .then((buffer) => {
            const src = ctx.createBufferSource()
            src.buffer = buffer
            src.loop = false
            src.onended = () => {
              if (okSrcRef.current === src) okSrcRef.current = null
            }
            src.connect(bedBusRef.current)
            src.start(0)
            okSrcRef.current = src
            fadeBedTo(vol)
            if (voiceLaneRef.current !== null) {
              const now = ctx.currentTime
              bedBusRef.current.gain.cancelScheduledValues(now)
              bedBusRef.current.gain.setTargetAtTime(Math.max(0, vol * 0.35), now, 0.05)
            }
          })
          .catch((error) => reportAudioError(String((error && error.message) || error)))
      }, [ac, load, bedVolume, fadeBedTo, settingsRef])

      // Login-success sting: the speech-free ambience of the game's own
      // welcome-back moment (bgm-ok.mp3), one pass per session.
      const success = React.useCallback(() => {
        if (okOnceRef.current) return
        okOnceRef.current = true
        sting('bgm-ok')
      }, [sting])

      // Re-lock resets the once-per-session beds for the next gate session.
      const resetSession = React.useCallback(() => {
        bgmOnceRef.current = false
        okOnceRef.current = false
      }, [])

      // Audition blip at the CURRENT volume (for the volume slider).
      const probe = React.useCallback(() => {
        playClip('pick', Math.min(1, settingsRef.current.volume * 0.9), false)
      }, [playClip, settingsRef])

      // First gesture after an autoplay refusal: resume the context, replay the
      // pending cue and light the bed if it was blocked at boot.
      React.useEffect(() => {
        const unlock = () => {
          const ctx = ctxRef.current
          if (ctx === null) return
          if (ctx.state === 'suspended') ctx.resume().catch(() => {})
          const pending = pendingRef.current
          if (pending !== null) {
            pendingRef.current = null
            playClip(pending.clip, pending.vol, pending.duck)
          }
          if (bedOnRef.current && bedSrcRef.current === null) ambience(true)
        }
        window.addEventListener('pointerdown', unlock, true)
        window.addEventListener('keydown', unlock, true)
        return () => {
          window.removeEventListener('pointerdown', unlock, true)
          window.removeEventListener('keydown', unlock, true)
        }
      }, [playClip, ambience])

      const voiceBusy = React.useCallback(() => voiceLaneRef.current !== null, [])

      return { speak, speakSoft, hover, type, pick, probe, ambience, success, sting, resetSession, voiceBusy }
    }

    // ---------------------------------------------------------------------
    // Extension surface: a stable handle for future features and third-party
    // integrations. State lives in bootApiState (kept fresh by Gate); the API
    // object itself never changes, so consumers may hold onto it forever.
    // ---------------------------------------------------------------------
    const bootApiState = { settings: DEFAULTS, phase: 'boot', speak: null }
    const bootApiListeners = new Set()
    function apiMount(node) {
      let host = document.getElementById('prts-ui-ext')
      if (host === null) {
        host = document.createElement('div')
        host.id = 'prts-ui-ext'
        host.className = 'prts-ui-ext'
        document.body.appendChild(host)
      }
      if (node instanceof Node) host.appendChild(node)
      return host
    }
    function apiUnmount() {
      try {
        document.getElementById('prts-ui-ext')?.remove()
      } catch {
        /* ignore */
      }
    }
    function apiCss(text) {
      let style = document.getElementById('prts-ui-ext-css')
      if (style === null) {
        style = document.createElement('style')
        style.id = 'prts-ui-ext-css'
        document.head.appendChild(style)
      }
      style.textContent = typeof text === 'string' ? text : ''
    }
    const bootApi = Object.freeze({
      version: '0.1.0',
      getSettings: () => bootApiState.settings,
      getPhase: () => bootApiState.phase,
      subscribe: (fn) => {
        if (typeof fn !== 'function') return () => {}
        bootApiListeners.add(fn)
        try {
          fn(bootApiState)
        } catch {
          /* listener errors never break the gate */
        }
        return () => bootApiListeners.delete(fn)
      },
      speak: (clip, vol) => {
        if (typeof bootApiState.speak !== 'function') return
        bootApiState.speak(clip, typeof vol === 'number' ? vol : 0.8)
      },
      ui: {
        mount: apiMount,
        unmount: apiUnmount,
        css: apiCss,
      },
    })
    function publishApi() {
      try {
        globalThis.__PRTS_BOOT_API__ = bootApi
      } catch {
        /* ignore */
      }
    }

    // ---------------------------------------------------------------------
    // Floating dialog bar (main UI, open phase)
    // ---------------------------------------------------------------------

    const FLOAT_KEY = 'dsh-prts-boot:float'

    /** Resolve a client service from the plugin context (get() first, then direct property). */
    const resolveService = (name) => {
      const c = themeCtxRef
      if (c === null || typeof c !== 'object') return null
      try {
        if (typeof c.get === 'function') {
          const viaGet = c.get(name)
          if (viaGet !== undefined && viaGet !== null) return viaGet
        }
      } catch {
        /* fall through to direct property */
      }
      try {
        return c[name] ?? null
      } catch {
        return null
      }
    }

    function FloatBar({ paletteVariant, hover, pickSfx, onToggleVariant, settings, onToggleSfx }) {
      const [saved, setSaved] = React.useState(() => {
        try {
          // localStorage (not sessionStorage): the bar's position, collapsed and
          // pinned state must survive app restarts, not just page refreshes.
          return JSON.parse(localStorage.getItem(FLOAT_KEY) ?? 'null') ?? {}
        } catch {
          return {}
        }
      })
      const collapsed = saved.collapsed === true
      const pinned = saved.pinned === true
      const pos =
        typeof saved.pos === 'object' && saved.pos !== null && Number.isFinite(saved.pos.x) && Number.isFinite(saved.pos.y)
          ? saved.pos
          : null
      const [busy, setBusy] = React.useState(false)
      const [snapping, setSnapping] = React.useState(false)
      const barRef = React.useRef(null)
      const chipRef = React.useRef(null)
      const chipDragRef = React.useRef(null)
      const chipMovedRef = React.useRef(false)
      const dragRef = React.useRef(null)
      const velRef = React.useRef({ x: 0, y: 0 })
      const lastRef = React.useRef(null)
      const flingRef = React.useRef(0)
      const rightbarOpenRef = React.useRef(false)
      const posRef = React.useRef(pos)
      posRef.current = pos

      // Busy = the app is thinking (any tool call in the running state).
      React.useEffect(() => {
        const check = () => setBusy(document.querySelector('[data-tool][data-state="running"]') !== null)
        check()
        let mo = null
        try {
          mo = new MutationObserver(check)
          mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] })
        } catch {
          /* no observer — fall back to the interval */
        }
        const iv = window.setInterval(check, 2500)
        return () => {
          if (mo !== null) { try { mo.disconnect() } catch { /* ignore */ } }
          window.clearInterval(iv)
        }
      }, [])

      React.useEffect(() => {
        try {
          localStorage.setItem(FLOAT_KEY, JSON.stringify(saved))
        } catch {
          /* ignore */
        }
      }, [saved])

      React.useEffect(() => () => window.cancelAnimationFrame(flingRef.current), [])

      // One-shot service diagnostic: proves which app services the plugin
      // context can reach (readable via the staging beacon reader). Preview
      // pages have no host, so skip there.
      React.useEffect(() => {
        if (preview() !== null) return
        try {
          const layout = resolveService('layout')
          const uiWorkspace = resolveService('uiWorkspace')
          const sidebarRight = resolveService('sidebarRight')
          fetch(`${BASE}/api/beacon`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              floatSvc: {
                layout: layout !== null,
                toggleSidebar: typeof layout?.toggleSidebar === 'function',
                openRightbar: typeof layout?.openRightbar === 'function',
                closeRightbar: typeof layout?.closeRightbar === 'function',
                uiWorkspace: uiWorkspace !== null,
                startSession: typeof uiWorkspace?.startSession === 'function',
                sidebarRight: sidebarRight !== null,
                sidebarRightToggle: typeof sidebarRight?.toggleExpanded === 'function',
                sidebarRightExpanded: typeof sidebarRight?.isExpanded === 'function' ? sidebarRight.isExpanded() : null,
              },
            }),
          }).catch(() => {})
        } catch {
          /* ignore */
        }
      }, [])

      const run = (fn) => {
        try {
          fn()
        } catch {
          /* service absent or signature drift — never break the bar */
        }
      }

      const onDown = (event) => {
        if (collapsed) return
        if (event.target.closest('.prts-float-btn')) return
        if (barRef.current === null) return
        window.cancelAnimationFrame(flingRef.current)
        setSnapping(false)
        const rect = barRef.current.getBoundingClientRect()
        dragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
        lastRef.current = { x: event.clientX, y: event.clientY, t: event.timeStamp }
        velRef.current = { x: 0, y: 0 }
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          /* ignore */
        }
      }
      const onMove = (event) => {
        if (dragRef.current === null || barRef.current === null) return
        const last = lastRef.current ?? { x: event.clientX, y: event.clientY, t: event.timeStamp }
        const dt = Math.max(1, event.timeStamp - last.t)
        const vx = ((event.clientX - last.x) / dt) * 16.7
        const vy = ((event.clientY - last.y) / dt) * 16.7
        velRef.current = { x: vx * 0.35 + velRef.current.x * 0.65, y: vy * 0.35 + velRef.current.y * 0.65 }
        lastRef.current = { x: event.clientX, y: event.clientY, t: event.timeStamp }
        const w = barRef.current.offsetWidth
        const h = barRef.current.offsetHeight
        const x = Math.max(8, Math.min(window.innerWidth - w - 8, event.clientX - dragRef.current.dx))
        const y = Math.max(8, Math.min(window.innerHeight - h - 8, event.clientY - dragRef.current.dy))
        posRef.current = { x, y }
        setSaved((s) => ({ ...s, pos: { x, y } }))
      }
      const snapToEdge = (x, y) => {
        const w = collapsed ? (chipRef.current?.offsetWidth ?? 46) : (barRef.current?.offsetWidth ?? 272)
        const target = x + w / 2 < window.innerWidth / 2 ? 8 : window.innerWidth - w - 8
        posRef.current = { x: target, y }
        setSnapping(true)
        setSaved((s) => ({ ...s, pos: { x: target, y } }))
        window.setTimeout(() => setSnapping(false), 340)
      }
      const onUp = () => {
        if (dragRef.current === null) return
        dragRef.current = null
        const v = velRef.current
        const p = posRef.current
        if (p === null) return
        if (Math.abs(v.x) + Math.abs(v.y) < 0.6) {
          if (!pinned) snapToEdge(p.x, p.y)
          return
        }
        // Throw physics: decay the release velocity, then snap to the
        // nearest horizontal edge.
        let fx = p.x
        let fy = p.y
        let vx = v.x
        let vy = v.y
        const w = barRef.current?.offsetWidth ?? 272
        const h = barRef.current?.offsetHeight ?? 240
        const step = () => {
          fx += vx
          fy += vy
          vx *= 0.88
          vy *= 0.88
          fx = Math.max(8, Math.min(window.innerWidth - w - 8, fx))
          fy = Math.max(8, Math.min(window.innerHeight - h - 8, fy))
          posRef.current = { x: fx, y: fy }
          if (barRef.current !== null) {
            barRef.current.style.left = fx + 'px'
            barRef.current.style.top = fy + 'px'
          }
          if (Math.abs(vx) + Math.abs(vy) < 0.25) {
            if (!pinned) snapToEdge(fx, fy)
            return
          }
          flingRef.current = window.requestAnimationFrame(step)
        }
        flingRef.current = window.requestAnimationFrame(step)
      }

      const row = (label, value, fn) =>
        el(
          'button',
          {
            type: 'button',
            className: 'prts-float-row prts-float-btn',
            onClick: () => {
              pickSfx?.()
              run(fn)
            },
            onMouseEnter: () => hover?.(),
          },
          el('span', { className: 'prts-float-row-label' }, label),
          el('span', { className: 'prts-float-row-val' }, value),
        )

      const statusText = busy ? 'PROCESSING' : 'SYSTEM ONLINE'

      if (collapsed) {
        const style = pos !== null ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined
        const onChipDown = (event) => {
          if (event.button !== 0) return
          chipDragRef.current = { sx: event.clientX, sy: event.clientY }
          chipMovedRef.current = false
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            /* ignore */
          }
        }
        const onChipMove = (event) => {
          const d = chipDragRef.current
          if (d === null) return
          if (!chipMovedRef.current && Math.abs(event.clientX - d.sx) + Math.abs(event.clientY - d.sy) < 5) return
          chipMovedRef.current = true
          const rect = chipRef.current?.getBoundingClientRect()
          if (rect === undefined) return
          const w = chipRef.current?.offsetWidth ?? 46
          const h = chipRef.current?.offsetHeight ?? 46
          const x = Math.max(8, Math.min(window.innerWidth - w - 8, event.clientX - (w / 2)))
          const y = Math.max(8, Math.min(window.innerHeight - h - 8, event.clientY - (h / 2)))
          posRef.current = { x, y }
          setSaved((s) => ({ ...s, pos: { x, y } }))
        }
        const onChipUp = () => {
          const d = chipDragRef.current
          chipDragRef.current = null
          if (d === null) return
          if (chipMovedRef.current && !pinned && posRef.current !== null) {
            snapToEdge(posRef.current.x, posRef.current.y)
          }
        }
        return createPortal(
          el(
            'button',
            {
              type: 'button',
              className: cx('prts-float-chip', busy && 'busy'),
              'data-skin': paletteVariant.id,
              'aria-label': 'PRTS 悬浮对话栏',
              title: 'PRTS 悬浮对话栏（可拖动）',
              ref: chipRef,
              style,
              onPointerDown: onChipDown,
              onPointerMove: onChipMove,
              onPointerUp: onChipUp,
              onPointerCancel: onChipUp,
              onClick: () => {
                if (chipMovedRef.current) return
                pickSfx?.()
                setSaved((s) => ({ ...s, collapsed: false }))
              },
            },
            el('span', { className: 'prts-float-chip-glyph', 'aria-hidden': 'true' }, '◇'),
          ),
          document.body,
        )
      }

      const style = pos !== null ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined
      return createPortal(
        el(
          'div',
          {
            className: cx('prts-float', snapping && 'snapping'),
            'data-skin': paletteVariant.id,
            ref: barRef,
            style,
            onPointerDown: onDown,
            onPointerMove: onMove,
            onPointerUp: onUp,
            onPointerCancel: onUp,
          },
          el(
            'div',
            { className: 'prts-float-frame' },
            el(
              'div',
              { className: 'prts-float-head' },
              el('span', { className: 'prts-float-mark', 'aria-hidden': 'true' }, '◇'),
              el('span', { className: 'prts-float-title' }, 'PRTS'),
              el('span', { className: 'prts-float-sub' }, 'DIALOG'),
              el(
                'button',
                {
                  type: 'button',
                  className: cx('prts-float-pin prts-float-btn', pinned && 'on'),
                  'aria-label': pinned ? '解除固定' : '固定位置',
                  title: pinned ? '解除固定' : '固定位置',
                  onClick: () => {
                    pickSfx?.()
                    setSaved((s) => ({ ...s, pinned: !s.pinned }))
                  },
                },
                '◈',
              ),
              el(
                'button',
                {
                  type: 'button',
                  className: 'prts-float-min prts-float-btn',
                  'aria-label': '折叠',
                  title: '折叠',
                  onClick: () => {
                    pickSfx?.()
                    setSaved((s) => ({ ...s, collapsed: true }))
                  },
                },
                '—',
              ),
            ),
            el('div', { className: cx('prts-float-status', busy && 'busy') }, el('i', { 'aria-hidden': 'true' }), statusText),
            el(
              'div',
              { className: 'prts-float-rows' },
              row('NEW SESSION', '＋ 新建会话', () => resolveService('uiWorkspace')?.startSession?.()),
              row('SFX', settings.sfx ? '音效 · 开' : '音效 · 关', onToggleSfx),
              row('SKIN', paletteVariant.id === 'A' ? 'A · 白 · 档案' : 'B · 黑 · 核心', onToggleVariant),
              row('SIDEBAR', '侧栏', () => resolveService('layout')?.toggleSidebar?.()),
              row('RIGHTBAR', '右侧栏', () => {
                // Prefer Better Sidebar's right panel when it is installed;
                // fall back to the native right panel otherwise.
                const sidebarRight = resolveService('sidebarRight')
                if (sidebarRight !== null && typeof sidebarRight.toggleExpanded === 'function') {
                  const wasOpen = typeof sidebarRight.isExpanded === 'function' ? sidebarRight.isExpanded() : false
                  sidebarRight.toggleExpanded()
                  rightbarOpenRef.current = !wasOpen
                  return
                }
                const layout = resolveService('layout')
                if (layout === null) return
                if (rightbarOpenRef.current) layout.closeRightbar?.()
                else layout.openRightbar?.(true, false)
                rightbarOpenRef.current = !rightbarOpenRef.current
              }),
              row('REPLAY GATE', '重演启动门', () => document.dispatchEvent(new Event('prts-boot:relock'))),
            ),
          ),
        ),
        document.body,
      )
    }

    // ---------------------------------------------------------------------
    // The gate
    // ---------------------------------------------------------------------

    function Gate() {
      const previewState = React.useMemo(preview, [])
      const [settings, setSettings] = React.useState(() => normaliseSettings(previewState?.settings))
      const [phase, setPhase] = React.useState(() => previewState?.phase ?? 'boot')
      const [user, setUser] = React.useState(() => {
        const raw = previewState?.user
        if (raw !== null && typeof raw === 'object') return raw
        return userById(raw ?? '') ?? null
      })
      const [error, setError] = React.useState(false)
      const settingsRef = React.useRef(settings)
      settingsRef.current = settings
      const { speak, speakSoft, hover, type, pick: pickSfx, ambience, success, resetSession, voiceBusy } = useVoice(settingsRef)

      // Keep the extension surface in sync and notify subscribers on every
      // settings / phase / voice change.
      React.useEffect(() => {
        bootApiState.settings = settings
        bootApiState.phase = phase
        bootApiState.speak = speak
        publishApi()
        for (const fn of bootApiListeners) {
          try {
            fn(bootApiState)
          } catch {
            /* listener errors never break the gate */
          }
        }
      }, [settings, phase, speak])
      const paletteVariant = variantOf(settings)
      const bootDoneRef = React.useRef(false)
      // Grant handover: the scene's progress bar finishes first, then the gate
      // holds until the granted voice line ends, then fades out and opens.
      const [grantFull, setGrantFull] = React.useState(false)
      const [grantFading, setGrantFading] = React.useState(false)
      const grantDoneRef = React.useRef(false)

      // Take the Host's boot cover off in the same commit that paints the gate,
      // so the cover can never outlive its replacement.
      React.useLayoutEffect(() => {
        try {
          globalThis.__PRTS_BOOT_COVER__?.release?.()
        } catch {
          /* ignore */
        }
        document.documentElement.classList.remove('dsh-prts-booting')
      }, [])

      // Settings: the Host is the source of truth, except in the local harness.
      const loadSettings = React.useCallback(() => {
        if (previewState !== null) return
        fetch(STATE_URL, { credentials: 'same-origin', headers: { accept: 'application/json' } })
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => {
            if (data === null) return
            setSettings(normaliseSettings(data))
          })
          .catch(() => {})
      }, [previewState])
      React.useEffect(() => {
        loadSettings()
      }, [loadSettings])

      // Re-lock: the settings page can put the gate back without a reload.
      // Re-fetch settings first so profiles added in Settings (custom users,
      // keys, skin) are recognised by the identify page immediately.
      React.useEffect(() => {
        const onRelock = () => {
          clearSession()
          bootDoneRef.current = false
          resetSession()
          setUser(null)
          setError(false)
          loadSettings()
          setPhase('boot')
        }
        document.addEventListener('prts-boot:relock', onRelock)
        return () => document.removeEventListener('prts-boot:relock', onRelock)
      }, [resetSession, loadSettings])

      // Skin + hero attributes live on <html> so the token overrides and the hero
      // mark can be switched without remounting anything. The main-UI flags
      // (prts-ui*) follow the same pattern and only appear once the gate opens.
      React.useEffect(() => {
        const root = document.documentElement
        const active = settings.skin && phase !== 'boot' && phase !== 'identify' && phase !== 'passcode' && phase !== 'granted'
        if (active) {
          root.dataset.prtsSkin = paletteVariant.id
          root.dataset.prtsVariant = paletteVariant.id
        } else {
          delete root.dataset.prtsSkin
          root.dataset.prtsVariant = paletteVariant.id
        }
        root.dataset.prtsHero = settings.hero ? '1' : '0'
        const uiOn = active && settings.uiSkin && phase === 'open'
        if (uiOn) {
          root.dataset.prtsUi = paletteVariant.id
          root.dataset.prtsUiBg = settings.uiBg ? '1' : '0'
          root.dataset.prtsUiChat = settings.uiChat ? '1' : '0'
          root.dataset.prtsUiPanels = settings.uiPanels ? '1' : '0'
        } else {
          delete root.dataset.prtsUi
          delete root.dataset.prtsUiBg
          delete root.dataset.prtsUiChat
          delete root.dataset.prtsUiPanels
        }
        // Mirror the boot skin into the DSH theme preference: variant A
        // activates the registered light theme, variant B the dark one.
        // Disabling the skin restores whatever the user had before.
        // (See the themeApply/themeRelease/acq docs above for the restart
        // survival strategy: override layer + re-assert hook + retry.)
        try {
          if (themeServiceRef === null && themeCtxRef !== null) acquireTheme(themeCtxRef)
          if (themeServiceRef !== null && typeof themeServiceRef.setTheme === 'function') {
            const themeId = PRTS_THEME_FOR_VARIANT[paletteVariant.id] ?? 'prts-paper'
            if (uiOn) themeApply(themeId)
            else themeRelease()
          }
        } catch {
          /* Unknown id or absent service — the CSS pairing still applies. */
        }
        return () => {
          delete root.dataset.prtsSkin
          delete root.dataset.prtsVariant
          delete root.dataset.prtsHero
          delete root.dataset.prtsUi
          delete root.dataset.prtsUiBg
          delete root.dataset.prtsUiChat
          delete root.dataset.prtsUiPanels
        }
      }, [settings.skin, settings.uiSkin, settings.uiBg, settings.uiChat, settings.uiPanels, settings.hero, paletteVariant.id, phase])

      // Main-UI background layer: a fixed, pointer-transparent sheet that sits
      // behind the app content (the shell columns are made transparent by CSS)
      // and carries the grid / watermark / vignette. Managed as a plain DOM node
      // so it survives the Gate rendering null once the session is open.
      const uiBgNodeRef = React.useRef(null)
      const postBeacon = React.useCallback((extra) => {
        if (previewState !== null) return
        try {
          fetch(`${BASE}/api/beacon`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(Object.assign({ phase, user: user === null ? null : user.id }, extra ?? {})),
          }).catch(() => {})
        } catch {
          /* ignore */
        }
      }, [phase, user, previewState])
      React.useEffect(() => {
        const on = settings.uiSkin && settings.skin && settings.uiBg && phase === 'open'
        if (!on) {
          if (uiBgNodeRef.current !== null) {
            uiBgNodeRef.current.remove()
            uiBgNodeRef.current = null
          }
          return undefined
        }
        if (uiBgNodeRef.current === null) {
          const node = document.createElement('div')
          node.className = 'prts-ui-bg'
          node.setAttribute('aria-hidden', 'true')
          const wallSrc = `${ASSET_URL}/${paletteVariant.id === 'B' ? 'prts-wall-dark.jpg' : 'prts-wall-light.jpg'}`
          let dots = ''
          for (let d = 1; d <= 9; d++) dots += `<i class="fx-dot d${d}"></i>`
          node.innerHTML =
            '<div class="prts-ui-comp">' +
            '<i class="fx-anchor"><i class="fx-core"></i><i class="fx-core2"></i>' +
            '<i class="fx-ring r1"></i><i class="fx-ring r2"></i><i class="fx-ring r3"></i>' +
            '<i class="fx-orbit o1"><i class="fx-frag f1"></i><i class="fx-frag f2"></i><i class="fx-frag f3"></i></i>' +
            '<i class="fx-orbit o2"><i class="fx-frag f4"></i><i class="fx-frag f5"></i><i class="fx-frag f6"></i></i>' +
            '</i>' + dots +
            '</div>' +
            '<div class="prts-ui-wall"><img alt="" src="' + wallSrc + '"></div>' +
            '<i class="prts-ui-grid"></i>' +
            '<i class="prts-ui-mark">PRTS</i>' +
            '<i class="prts-ui-corner a"></i>' +
            '<i class="prts-ui-corner b"></i>' +
            '<i class="prts-ui-vig"></i>'
          const dotPos = [
            ['14%', '26%'], ['22%', '74%'], ['34%', '38%'], ['30%', '84%'], ['46%', '20%'],
            ['52%', '88%'], ['64%', '12%'], ['74%', '30%'], ['84%', '66%'],
          ]
          for (let di = 0; di < dotPos.length; di++) {
            const dn = node.querySelector('.fx-dot.d' + (di + 1))
            if (dn !== null) {
              dn.style.left = dotPos[di][0]
              dn.style.top = dotPos[di][1]
            }
          }
          document.body.appendChild(node)
          uiBgNodeRef.current = node
          // Load the wall through the authenticated fetch path. A plain <img src>
          // can be rejected by the web guard (it carries no custom credentials);
          // the fetch path is proven to work (the voice clips use it).
          const imgEl = node.querySelector('.prts-ui-wall img')
          if (imgEl !== null && previewState === null) {
            fetch(wallSrc, { credentials: 'same-origin', cache: 'no-store' })
              .then((r) => {
                if (!r.ok) {
                  postBeacon({ event: 'wall-err', wallErr: 'http-' + r.status, wallSrc: wallSrc.split('/').pop() })
                  return null
                }
                return r.blob()
              })
              .then((blob) => {
                if (blob === null) return
                const url = URL.createObjectURL(blob)
                imgEl.src = url
                imgEl.onload = () => postBeacon({ event: 'wall-ok', wallOk: true })
                imgEl.onerror = () => postBeacon({ event: 'wall-err', wallErr: 'decode' })
              })
              .catch((err) => postBeacon({ event: 'wall-err', wallErr: String((err && err.message) || err).slice(0, 80) }))
            // Settled diagnostics: what does the page actually look like?
            // Two samples: 1.6s (post-open settle) and 7.1s (after any
            // late durable-preference adoption would have landed).
            setTimeout(() => {
              const settleFn = (sample) => {
                try {
                  if (themeServiceRef === null && themeCtxRef !== null) acquireTheme(themeCtxRef)
                  const bgNode = document.querySelector('.prts-ui-bg')
                  const scene = document.querySelector('.prts-agent-scene')
                  const cs = bgNode === null ? null : getComputedStyle(bgNode)
                  const sceneCs = scene === null ? null : getComputedStyle(scene)
                  const bodyCs = getComputedStyle(document.body)
                  let themeInfo = null
                  try {
                    if (themeServiceRef !== null && typeof themeServiceRef.getTheme === 'function') {
                      const snap = themeServiceRef.getTheme()
                      themeInfo = {
                        pref: snap.preference,
                        active: snap.active ? snap.active.id : null,
                        scheme: snap.active ? snap.active.colorScheme : null,
                      }
                    }
                  } catch {
                    themeInfo = null
                  }
                  let sidebarBg = null
                  let convBg = null
                  let bubbleBg = null
                  let convChain = null
                  try {
                    const side = document.querySelector(':has(> [data-shell-overlay]) > div:nth-of-type(1)')
                    sidebarBg = side === null ? null : getComputedStyle(side).backgroundColor
                    const conv = document.querySelector('[data-conversation-scroll]')
                    convBg = conv === null ? null : getComputedStyle(conv).backgroundColor
                    const bubble = document.querySelector('[data-chat-flow-kind="assistant-step"]')
                    bubbleBg = bubble === null ? null : getComputedStyle(bubble).backgroundColor
                    if (conv !== null) {
                      const chain = []
                      let n = conv
                      for (let i = 0; i < 6 && n !== null; i++) {
                        n = n.parentElement
                        if (n === null) break
                        chain.push({
                          t: n.tagName.toLowerCase(),
                          c: String(n.className ?? '').slice(0, 36),
                          bg: getComputedStyle(n).backgroundColor,
                        })
                      }
                      convChain = chain
                    }
                  } catch {
                    /* ignore */
                  }
                  postBeacon({
                    event: sample,
                    wallOk: imgEl.naturalWidth > 0,
                    bgColor: cs === null ? null : cs.backgroundColor,
                    bgRect: bgNode === null ? null : [Math.round(bgNode.getBoundingClientRect().width), Math.round(bgNode.getBoundingClientRect().height)],
                    scene: sceneCs === null ? null : sceneCs.display,
                    skinAttr: document.body.getAttribute('data-prts-skin'),
                    bodyBg: bodyCs.backgroundColor,
                    uiAttr: document.documentElement.dataset.prtsUi ?? null,
                    theme: themeInfo,
                    themeHook: themeHookRef !== null,
                    themeSvc: themeServiceRef !== null,
                    tokenBg: document.body.style.getPropertyValue('--dsw-alias-bg-base') || null,
                    sidebarBg,
                    convBg,
                    bubbleBg,
                    convChain,
                    bundleRev: (String(document.querySelector('script[src*="dsh-prts-boot"]')?.getAttribute('src') ?? '').split('rev=')[1]) || null,
                    brand: document.querySelector('.prts-brand') !== null,
                  })
                } catch {
                  /* ignore */
                }
              }
              settleFn('settle')
              setTimeout(() => settleFn('settle2'), 5500)
              setTimeout(() => settleFn('settle3'), 20000)
            }, 1600)
          }
        }
        // PRTS texture on the main UI: a throttled hover tick over the
        // interactive surfaces (session rows, composer, tool blocks).
        const hoverSound = (event) => {
          const t = event.target
          if (t === null || typeof t.closest !== 'function') return
          if (t.closest('div[role="treeitem"], [data-composer-card], [data-chat-flow-kind="tool-call"] [data-tool]') !== null) hover()
        }
        document.addEventListener('mouseover', hoverSound, true)
        return () => {
          document.removeEventListener('mouseover', hoverSound, true)
          if (uiBgNodeRef.current !== null) {
            uiBgNodeRef.current.remove()
            uiBgNodeRef.current = null
          }
        }
      }, [phase, settings.uiSkin, settings.skin, settings.uiBg, paletteVariant.id, postBeacon])

      // Voice cues, one per scene entry.
      React.useEffect(() => {
        if (phase === 'boot') {
          const timer = setTimeout(() => speak('boot'), 420)
          return () => clearTimeout(timer)
        }
        if (phase === 'identify') speak('identify')
        // Keyless profiles (PRTS itself, user-defined profiles without a key)
        // skip the auth prompt; everyone else is asked for credentials.
        if (phase === 'passcode' && (user === null || user.key !== '')) speak('auth')
        // Personal lines exist for the three operators and PRTS; user-defined
        // profiles are carried by the sting and the queued welcome instead.
        if (phase === 'granted') {
          if (user === null) speak('granted-doctor')
          else if (user.id === 'prts' || USERS.some((u) => u.id === user.id)) speak(`granted-${user.id}`)
        }
        // Queue the welcome behind granted-<user> (4.7s line) instead of
        // cutting it when the grant scene ends at ~2.6s.
        if (phase === 'open') speakSoft('welcome')
        return undefined
      }, [phase, speak, speakSoft, user])

      // Boot bed: one pass of the splash score at the start of the gate; it
      // stops when the grant screen appears (handed over to the success sting)
      // and never loops. It ducks under voice cues.
      React.useEffect(() => {
        ambience(phase !== 'open' && phase !== 'granted' && settings.voice)
      }, [phase, settings.voice, ambience])

      // Login-success sting: one pass of bgm-ok.mp3 on the grant screen.
      React.useEffect(() => {
        if (phase === 'granted') success()
      }, [phase, success])

      // Mouse parallax: the pointer position drives --ppx/--ppy on the gate
      // root; layers tagged prts-pl / prts-pm / prts-pf ride those variables,
      // scaled by --pps (the user's strength setting, 0 = disabled).
      const gateRef = React.useRef(null)
      React.useEffect(() => {
        if (phase === 'open') return undefined
        const node = gateRef.current
        if (node === null) return undefined
        const strength = settings.parallax
        node.style.setProperty('--pps', String(strength / 2))
        node.style.setProperty('--ppx', '0')
        node.style.setProperty('--ppy', '0')
        if (strength === 0) return undefined
        let raf = 0
        const onMove = (event) => {
          if (raf !== 0) return
          raf = requestAnimationFrame(() => {
            raf = 0
            const rect = node.getBoundingClientRect()
            if (rect.width < 2 || rect.height < 2) return
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
            node.style.setProperty('--ppx', x.toFixed(3))
            node.style.setProperty('--ppy', y.toFixed(3))
          })
        }
        const onLeave = () => {
          node.style.setProperty('--ppx', '0')
          node.style.setProperty('--ppy', '0')
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        document.documentElement.addEventListener('pointerleave', onLeave)
        return () => {
          window.removeEventListener('pointermove', onMove)
          document.documentElement.removeEventListener('pointerleave', onLeave)
          if (raf !== 0) cancelAnimationFrame(raf)
        }
      }, [phase, settings.parallax])

      // Beacon: report the phase to the Host so it can be inspected from outside.
      React.useEffect(() => {
        try {
          let wallSrc = null
          let wallOk = null
          const wallImg = document.querySelector('.prts-ui-wall img')
          if (wallImg !== null) {
            wallSrc = String(wallImg.getAttribute('src') ?? '').split('/').pop()
            wallOk = wallImg.naturalWidth > 0
          }
          const bundleEl = document.querySelector('script[src*="dsh-prts-boot"]')
          if (themeServiceRef === null && themeCtxRef !== null) acquireTheme(themeCtxRef)
          let themeInfo = null
          try {
            if (themeServiceRef !== null && typeof themeServiceRef.getTheme === 'function') {
              const snap = themeServiceRef.getTheme()
              themeInfo = {
                pref: snap.preference,
                active: snap.active ? snap.active.id : null,
                scheme: snap.active ? snap.active.colorScheme : null,
              }
            }
          } catch {
            themeInfo = null
          }
          let sidebarBg = null
          let convBg = null
          let bubbleBg = null
          let convChain = null
          try {
            const side = document.querySelector(':has(> [data-shell-overlay]) > div:nth-of-type(1)')
            sidebarBg = side === null ? null : getComputedStyle(side).backgroundColor
            const conv = document.querySelector('[data-conversation-scroll]')
            convBg = conv === null ? null : getComputedStyle(conv).backgroundColor
            const bubble = document.querySelector('[data-chat-flow-kind="assistant-step"]')
            bubbleBg = bubble === null ? null : getComputedStyle(bubble).backgroundColor
            if (conv !== null) {
              const chain = []
              let n = conv
              for (let i = 0; i < 6 && n !== null; i++) {
                n = n.parentElement
                if (n === null) break
                chain.push({
                  t: n.tagName.toLowerCase(),
                  c: String(n.className ?? '').slice(0, 36),
                  bg: getComputedStyle(n).backgroundColor,
                })
              }
              convChain = chain
            }
          } catch {
            /* ignore */
          }
          postBeacon({
            ui: document.documentElement.dataset.prtsUi ?? null,
            bg: !!document.querySelector('.prts-ui-bg'),
            wallSrc,
            wallOk,
            bundleRev: bundleEl === null ? null : (String(bundleEl.getAttribute('src') ?? '').split('rev=')[1] ?? null),
            theme: themeInfo,
            tokenBg: document.body.style.getPropertyValue('--dsw-alias-bg-base') || null,
            sidebarBg,
            convBg,
            bubbleBg,
            convChain,
            brand: document.querySelector('.prts-brand') !== null,
          })
        } catch {
          /* ignore */
        }
      }, [phase, user, postBeacon])

      const settleBoot = React.useCallback(() => {
        if (bootDoneRef.current) return
        bootDoneRef.current = true
        const session = settingsRef.current.remember ? readSession() : null
        if (session !== null) {
          // Legacy visitor sessions are no longer a valid profile; forget them.
          if (session.user === 'custom') {
            try {
              window.sessionStorage.removeItem(SESSION_KEY)
            } catch {
              /* ignore */
            }
          } else {
            const restored = userById(session.user)
            if (restored !== null) {
              setUser(restored)
              setPhase('open')
              return
            }
          }
        }
        setPhase('identify')
      }, [])

      const pick = React.useCallback((next) => {
        setUser(next)
        setError(false)
        setPhase('passcode')
      }, [])

      const granted = React.useCallback(
        (next) => {
          if (settingsRef.current.remember) writeSession(next)
          setError(false)
          setPhase('granted')
        },
        [],
      )

      const denied = React.useCallback(() => {
        setError(true)
        settingsRef.current.voice && speak('denied')
      }, [speak])

      const open = React.useCallback(() => {
        setPhase('open')
      }, [])

      // Stable identity: GrantScene's progress effect depends on it.
      const grantFullDone = React.useCallback(() => setGrantFull(true), [])

      // Handover: once the grant progress bar is full AND the granted voice
      // line has finished, fade the gate out, then open the app.
      React.useEffect(() => {
        if (phase !== 'granted') {
          setGrantFull(false)
          setGrantFading(false)
          grantDoneRef.current = false
          return undefined
        }
        if (!grantFull || grantDoneRef.current) return undefined
        let openTimer = 0
        const finish = () => {
          if (grantDoneRef.current) return
          grantDoneRef.current = true
          setGrantFading(true)
          openTimer = window.setTimeout(open, 800)
        }
        if (!voiceBusy()) {
          finish()
          return () => window.clearTimeout(openTimer)
        }
        // The line is still playing: wait until the lane frees, then finish.
        const timer = window.setInterval(() => {
          if (!voiceBusy()) {
            window.clearInterval(timer)
            finish()
          }
        }, 120)
        return () => {
          window.clearInterval(timer)
          window.clearTimeout(openTimer)
        }
      }, [phase, grantFull, voiceBusy, open])

      const isOpen = phase === 'open'

      // Skin switch from the floating bar: flip the variant, apply locally and
      // persist to the Host (same path the settings page uses).
      const toggleVariant = React.useCallback(() => {
        const next = { ...settingsRef.current, variant: settingsRef.current.variant === 'A' ? 'B' : 'A' }
        setSettings(next)
        if (previewState === null) {
          fetch(STATE_URL, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) }).catch(() => {})
        }
      }, [previewState])

      const toggleSfx = React.useCallback(() => {
        const next = { ...settingsRef.current, sfx: !settingsRef.current.sfx }
        setSettings(next)
        if (previewState === null) {
          fetch(STATE_URL, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) }).catch(() => {})
        }
      }, [previewState])

      const node = isOpen
        ? settings.uiFloat
          ? el(FloatBar, { paletteVariant, hover, pickSfx, onToggleVariant: toggleVariant, settings, onToggleSfx: toggleSfx })
          : null
        : el(
            'div',
            {
              className: cx('prts-gate', `variant-${paletteVariant.id}`, grantFading && 'prts-gate-fading'),
              style: palette(paletteVariant),
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': 'PRTS 登录',
              ref: gateRef,
            },
            el(
              'div',
              { className: 'prts-media', 'aria-hidden': 'true' },
              el('div', { className: 'prts-layer prts-grid prts-pl' }),
              el('div', { className: 'prts-layer prts-grid coarse prts-pm' }),
              el('div', { className: 'prts-layer prts-grain prts-pf' }),
              el('div', { className: 'prts-layer prts-vignette' }),
              el('div', { className: 'prts-layer prts-scanline prts-pm' }),
            ),
            phase === 'boot' ? el(BootScene, { paletteVariant, onDone: settleBoot }) : null,
            phase === 'identify'
              ? el(IdentifyScene, { paletteVariant, onPick: (u) => { pickSfx(); pick(u) }, speak, hover, type, anomaly: settings.anomaly, keys: settings.keys, customUsers: settings.customUsers })
              : null,
            phase === 'passcode'
              ? el(PasscodeScene, {
                  paletteVariant,
                  user: user ?? USERS[0],
                  error,
                  type,
                  keys: settings.keys,
                  onBack: () => {
                    setError(false)
                    setPhase('identify')
                  },
                  onGranted: granted,
                  onDenied: denied,
                })
              : null,
            phase === 'granted' ? el(GrantScene, { paletteVariant, user: user ?? USERS[0], onFull: grantFullDone }) : null,
          )

      if (node === null) return null
      if (typeof document === 'undefined' || document.body === null) return node
      return createPortal(node, document.body)
    }

    // ---------------------------------------------------------------------
    // Hero mark
    // ---------------------------------------------------------------------

    function HeroMark() {
      let name = '博士'
      try {
        const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
        const found = raw && typeof raw.user === 'string' ? userById(raw.user) : null
        if (found !== null) name = found.cn
      } catch {
        /* ignore */
      }
      return el(
        'div',
        { className: 'prts-hero' },
        el('div', { className: 'prts-hero-row' }, el(Mark, { size: 15 }), el('span', { className: 'prts-hero-word' }, 'PRTS')),
        el('div', { className: 'prts-hero-note' }, `欢迎回来，${name}`),
      )
    }

    /** Sidebar brand mark: a PRTS diamond + wordmark. Shown only while the
     *  main-UI skin is active (html[data-prts-ui] is set by the Gate). */
    function PrtsBrand({ size }) {
      const s = typeof size === 'number' && size > 0 ? size : 15
      return el(
        'span',
        { className: 'prts-brand', title: 'PRTS' },
        el('span', { className: 'prts-brand-mark', style: { width: `${s}px`, height: `${s}px` } }),
        el('span', { className: 'prts-brand-text' }, 'PRTS'),
      )
    }

    // ---------------------------------------------------------------------
    // Settings page
    // ---------------------------------------------------------------------

    const TEXT = {
      zh: {
        tab: 'PRTS',
        title: 'PRTS',
        intro: '启动动画、登录门与界面皮肤。改动立即保存；皮肤在通过登录门之后生效。',
        variant: '视觉方案',
        variantDesc: '两款皮肤的排版相同，气质不同。',
        voice: 'PRTS 语音',
        voiceDesc: '合成音，冷静、简短，只报状态。',
        volume: '音量',
        boot: '启动动画',
        bootDesc: '每次打开 DSH 先播 PRTS 启动序列。',
        remember: '记住登录',
        rememberDesc: '同一标签页内不再要求密钥；重新锁定可手动复位。',
        skin: '界面皮肤',
        skinDesc: '通行后覆盖 DSH 的颜色与字体。',
        hero: '主界面字标',
        heroDesc: '在空白会话的标题上方加 PRTS 字标。',
        relock: '重新锁定',
        relockHint: '下一次刷新会重新播放启动序列并退回登录门。',
        parallax: '鼠标视差',
        parallaxDesc: '登录门内各层元素跟随鼠标的景深位移。',
        parallaxOptions: ['关闭', '轻微', '标准', '强烈'],
        anomaly: '异常效果',
        anomalyDesc: '唤醒隐藏档案时的干扰影像强度。',
        anomalyOptions: ['关闭', '含蓄', '激进'],
        preview: '试听',
        previewDesc: '分别试听语音、音效与背景音乐（使用当前音量）。',
        previewVoice: '语音',
        previewSfx: '音效',
        previewBgm: '背景音乐',
        keys: '访问密钥',
        keysValue: '博士 B101 · 阿米娅 R001 · 凯尔希 B003',
        keysCustom: '账户密码',
        keysCustomDesc: '为各档案设置自定义密码；留空则使用默认编号密钥。',
        keysCustomPlaceholder: '留空 = 默认密钥',
        keysCustomDefault: '默认密钥',
        keysCustomCustom: '自定义密码',
        customUsers: '自定义用户',
        customUsersDesc: '添加自定义登录档案：在登录页输入其编号或姓名即可匹配（密钥留空则免密钥）。最多 4 个。',
        customUsersSave: '保存',
        customUsersIncomplete: '档案不完整：编号 2-12 位大写字母/数字 + 至少一个姓名',
        customUsersSaved: '已保存 ✓',
        customUsersAdd: '添加用户',
        customUsersRemove: '移除',
        customUsersSerial: '编号 SERIAL',
        customUsersName: '姓名',
        customUsersEn: 'EN',
        customUsersKey: '密钥（可选）',
        uiSkin: '主界面美化',
        uiSkinDesc: '总开关。下方「背景 / 聊天框 / 面板 / 悬浮对话栏」四项分别控制对应区域；关闭后应用恢复原生外观。',
        uiBg: '背景',
        uiBgDesc: '纸感底色、坐标网格、PRTS 水印与暗角，衬在应用内容之后。',
        uiChat: '聊天框',
        uiChatDesc: '输入框卡片、助手消息的菱形标记与工具卡样式。',
        uiPanels: '面板',
        uiPanelsDesc: '侧栏毛玻璃、分隔线与会话行的主题样式。',
        uiFloat: '悬浮对话栏',
        uiFloatDesc: '在主界面右下角显示悬浮对话操作栏（可拖动、可折叠）。',
        sfx: '按键音效',
        sfxDesc: '主界面按键音效开关（悬停、按键、选择）；不影响启动音效与语音。',
        saved: '已保存',
        saving: '保存中…',
      },
      en: {
        tab: 'PRTS boot',
        title: 'PRTS boot',
        intro: 'Boot sequence, login gate and interface skin. Changes save immediately; the skin applies after the gate opens.',
        variant: 'Visual variant',
        variantDesc: 'Same typography for both skins; the mood differs.',
        voice: 'PRTS voice',
        voiceDesc: 'Synthesised, calm, short — status lines only.',
        volume: 'Volume',
        boot: 'Boot sequence',
        bootDesc: 'Play the PRTS boot sequence on every launch.',
        remember: 'Remember login',
        rememberDesc: 'Skip the key inside the same tab. Re-lock to reset.',
        skin: 'Interface skin',
        skinDesc: 'Override DSH colours and type once inside.',
        hero: 'Hero mark',
        heroDesc: 'Put the PRTS lockup above the blank-session headline.',
        relock: 'Re-lock',
        relockHint: 'The next reload replays the boot sequence and returns to the gate.',
        parallax: 'Mouse parallax',
        parallaxDesc: 'Depth offset of gate layers following the pointer.',
        parallaxOptions: ['Off', 'Light', 'Standard', 'Strong'],
        anomaly: 'Anomaly FX',
        anomalyDesc: 'Intensity of the interference overlay when the hidden record wakes.',
        anomalyOptions: ['Off', 'Subtle', 'Strong'],
        preview: 'Audition',
        previewDesc: 'Audition the voice, the SFX and the bed music at the current volume.',
        previewVoice: 'Voice',
        previewSfx: 'SFX',
        previewBgm: 'BGM',
        keys: 'Access keys',
        keysValue: 'Doctor B101 · Amiya R001 · Kal’tsit B003',
        keysCustom: 'Account passwords',
        keysCustomDesc: 'Set a custom password per profile; leave empty to keep the default serial key.',
        keysCustomPlaceholder: 'Empty = default key',
        keysCustomDefault: 'Default key',
        keysCustomCustom: 'Custom password',
        customUsers: 'Custom users',
        customUsersDesc: 'Add user-defined login profiles — their serial or name works on the entry page (empty key = keyless). Up to 4.',
        customUsersSave: 'Save',
        customUsersIncomplete: 'Incomplete — serial (2-12 A-Z/0-9) and at least one name required',
        customUsersSaved: 'Saved ✓',
        customUsersAdd: 'Add user',
        customUsersRemove: 'Remove',
        customUsersSerial: 'SERIAL',
        customUsersName: 'Name',
        customUsersEn: 'EN',
        customUsersKey: 'Key (optional)',
        uiSkin: 'Main UI theme',
        uiSkinDesc: 'Master switch. The four rows below — background, chat box, panels and floating bar — style each area; the app keeps its native look when off.',
        uiBg: 'Background',
        uiBgDesc: 'Paper base, coordinate grid, PRTS watermark and vignette behind the app content.',
        uiChat: 'Chat box',
        uiChatDesc: 'Composer card, diamond marker on assistant messages and tool-card styling.',
        uiPanels: 'Panels',
        uiPanelsDesc: 'Frosted sidebar, divider and session-row theming.',
        uiFloat: 'Floating bar',
        uiFloatDesc: 'Show the floating dialog bar on the bottom-right of the main UI (draggable, collapsible).',
        sfx: 'UI sounds',
        sfxDesc: 'Float bar and main-UI key sounds; startup audio and voice lines stay unaffected.',
        saved: 'Saved',
        saving: 'Saving…',
      },
    }

    function strings() {
      try {
        return String(navigator.language ?? '').toLowerCase().startsWith('zh') ? TEXT.zh : TEXT.en
      } catch {
        return TEXT.en
      }
    }

    function Toggle({ checked, onChange, label, disabled }) {
      return el(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': checked ? 'true' : 'false',
          'aria-label': label,
          'aria-disabled': disabled ? 'true' : undefined,
          className: cx('prts-switch', checked && 'on', disabled && 'off'),
          onClick: () => {
            if (disabled) return
            onChange(!checked)
          },
        },
        el('span', { className: 'knob' }),
      )
    }

    function SettingsRow({ title, desc, dim, wide, children }) {
      return el(
        'div',
        { className: cx('prts-set-row', dim && 'dim', wide && 'wide') },
        el('div', { className: 'prts-set-copy' }, el('div', { className: 'prts-set-title' }, title), desc ? el('div', { className: 'prts-set-desc' }, desc) : null),
        el('div', { className: cx('prts-set-control', wide && 'wide') }, children),
      )
    }

    // One editable custom password for a profile. Draft locally while typing,
    // commit on blur / Enter; an empty value falls back to the default key.
    function KeyField({ id, cn, en, def, value, onSave }) {
      const t = strings()
      const [draft, setDraft] = React.useState(null) // null = not editing
      const effective = value.trim() === '' ? '' : value.trim()
      const commit = (raw) => {
        setDraft(null)
        onSave(id, cleanKey(raw))
      }
      return el(
        'div',
        { className: 'prts-keyrow' },
        el(
          'div',
          { className: 'prts-key-copy' },
          el('span', { className: 'prts-key-cn' }, cn),
          el('span', { className: 'prts-key-en' }, `${en} · ${def}`),
        ),
        el(
          'div',
          { className: 'prts-key-control' },
          el('input', {
            type: 'password',
            className: 'prts-key-input',
            maxLength: 12,
            value: draft ?? effective,
            placeholder: def,
            spellCheck: false,
            autoComplete: 'off',
            'aria-label': `${cn} ${t.keysCustom}`,
            onChange: (event) => setDraft(event.target.value),
            onBlur: (event) => commit(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            },
          }),
          effective === ''
            ? el('span', { className: 'prts-key-tag' }, t.keysCustomDefault)
            : el('span', { className: 'prts-key-tag on' }, t.keysCustomCustom),
        ),
      )
    }

    // One user-defined profile row: serial, Chinese name, English name and an
    // optional key. Drafts locally; the ✓ button (or a valid blur) persists
    // the whole row. Incomplete rows show an amber hint and are not saved.
    function CuRow({ entry, onCommit, onSave, onRemove, savedAt }) {
      const t = strings()
      const [flash, setFlash] = React.useState(false)
      const valid = cuValid(entry)
      React.useEffect(() => {
        if (savedAt === 0) return
        setFlash(true)
        const timer = window.setTimeout(() => setFlash(false), 1400)
        return () => window.clearTimeout(timer)
      }, [savedAt])
      const commit = (field, raw) => {
        const next = { ...entry, [field]: field === 'serial' ? String(raw).toUpperCase() : raw }
        onCommit(next)
      }
      const input = (field, max, placeholder, isKey) =>
        el('input', {
          type: isKey ? 'password' : 'text',
          className: 'prts-cu-input',
          maxLength: max,
          value: entry[field],
          placeholder,
          spellCheck: false,
          autoComplete: 'off',
          'aria-label': placeholder,
          onChange: (event) => {
            const next = { ...entry, [field]: field === 'serial' ? event.target.value.toUpperCase() : event.target.value }
            onCommit(next)
          },
          onBlur: (event) => {
            const next = { ...entry, [field]: field === 'serial' ? String(event.target.value).toUpperCase() : event.target.value }
            onCommit(next)
            if (cuValid(next)) onSave(next)
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          },
        })
      return el(
        'div',
        { className: 'prts-curow-wrap' },
        el(
          'div',
          { className: 'prts-curow' },
          input('serial', 12, t.customUsersSerial, false),
          input('cn', 12, t.customUsersName, false),
          input('en', 16, t.customUsersEn, false),
          input('key', 12, t.customUsersKey, true),
          el(
            'button',
            {
              type: 'button',
              className: cx('prts-cu-save', !valid && 'off'),
              onClick: valid ? () => onSave(entry) : undefined,
              disabled: !valid,
              'aria-label': t.customUsersSave,
              title: t.customUsersSave,
            },
            '✓',
          ),
          el('button', { type: 'button', className: 'prts-cu-remove', onClick: onRemove, 'aria-label': t.customUsersRemove }, '×'),
        ),
        el(
          'div',
          { className: cx('prts-cu-status', !valid && 'bad', valid && flash && 'ok') },
          !valid ? t.customUsersIncomplete : flash ? t.customUsersSaved : '',
        ),
      )
    }

    function SettingsTab() {
      const t = strings()
      const [settings, setSettings] = React.useState(() => {
        const previewSettings = preview()?.settings
        return previewSettings === undefined ? DEFAULTS : normaliseSettings(previewSettings)
      })
      const [status, setStatus] = React.useState('')
      const [volDraft, setVolDraft] = React.useState(null)
      const settingsRef = React.useRef(settings)
      settingsRef.current = settings
      const [cuDrafts, setCuDrafts] = React.useState(() =>
        settings.customUsers.map((entry, index) => ({ uid: `cu-${index}`, ...entry })),
      )
      const cuSyncedRef = React.useRef(false)
      const { speak, hover, probe, sting } = useVoice(settingsRef)

      React.useEffect(() => {
        let cancelled = false
        fetch(STATE_URL, { credentials: 'same-origin', headers: { accept: 'application/json' } })
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => {
            if (cancelled || data === null) return
            const next = normaliseSettings(data)
            setSettings(next)
            if (!cuSyncedRef.current) {
              cuSyncedRef.current = true
              setCuDrafts(next.customUsers.map((entry, index) => ({ uid: `cu-${index}`, ...entry })))
            }
          })
          .catch(() => {})
        return () => {
          cancelled = true
        }
      }, [])

      // Report the custom-users row geometry so real-app renders can be
      // verified through the beacon (preview skipped — preview is our testbed).
      React.useEffect(() => {
        if (preview() !== null) return
        try {
          const settingsNode = document.querySelector('.prts-settings')
          const rowNode = document.querySelector('.prts-curow')
          const inputs = Array.from(document.querySelectorAll('.prts-cu-input'))
          const rect = (node) => (node === null ? null : node.getBoundingClientRect())
          fetch(`${BEACON_URL}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              cuLayout: {
                sw: rect(settingsNode) === null ? null : Math.round(rect(settingsNode).width),
                rw: rect(rowNode) === null ? null : Math.round(rect(rowNode).width),
                iw: inputs.map((node) => Math.round(rect(node).width)),
                wm: inputs.length > 0 ? getComputedStyle(inputs[0]).writingMode : null,
              },
            }),
          }).catch(() => {})
        } catch {}
      }, [])

      const save = React.useCallback((patch) => {
        const next = normaliseSettings({ ...settingsRef.current, ...patch })
        setSettings(next)
        setStatus(t.saving)
        fetch(STATE_URL, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(next),
        })
          .then(() => setStatus(t.saved))
          .catch(() => setStatus(''))
      }, [t])

      // Volume: draft locally while dragging, commit once on release, then
      // play a blip at the new level so the user hears the result.
      const commitVolume = React.useCallback((value) => {
        setVolDraft(null)
        save({ volume: value })
        window.setTimeout(() => probe(), 60)
      }, [save, probe])

      // Custom passwords: merge one key into the settings.keys map.
      const saveKey = React.useCallback(
        (id, value) => {
          save({ keys: { ...settingsRef.current.keys, [id]: value } })
        },
        [save],
      )

      // User-defined profiles: cuDrafts holds every row (including half-filled
      // ones being edited). Keystrokes only update the draft; the whole row is
      // persisted by the ✓ button or by blurring out of a valid row. Invalid
      // rows are kept as drafts with an amber hint and never hit the server.
      const stripUid = (rows) => rows.map(({ uid, ...entry }) => entry)
      const [cuSavedAt, setCuSavedAt] = React.useState([])
      const commitCu = React.useCallback((index, patch) => {
        setCuDrafts((current) => {
          const next = current.slice()
          next[index] = { ...next[index], ...patch }
          return next
        })
      }, [])
      const saveCu = React.useCallback(
        (index, entry) => {
          const next = cuDrafts.slice()
          next[index] = { ...entry, uid: next[index].uid }
          setCuDrafts(next)
          save({ customUsers: stripUid(next) })
          setCuSavedAt((marks) => {
            const copy = marks.slice()
            copy[index] = Date.now()
            return copy
          })
        },
        [cuDrafts, save],
      )
      const removeCu = React.useCallback(
        (index) => {
          const next = cuDrafts.slice()
          next.splice(index, 1)
          setCuDrafts(next)
          save({ customUsers: stripUid(next) })
          setCuSavedAt((marks) => marks.filter((_, markIndex) => markIndex !== index))
        },
        [cuDrafts, save],
      )
      const addCu = React.useCallback(() => {
        if (cuDrafts.length >= 4) return
        setCuDrafts(cuDrafts.concat([{ uid: `cu-${Date.now()}`, cn: '', en: '', serial: '', key: '' }]))
      }, [cuDrafts])

      const KEY_ROWS = [
        { id: 'doctor', cn: '博士', en: 'DOCTOR', def: '101', serial: 'B101' },
        { id: 'amiya', cn: '阿米娅', en: 'AMIYA', def: '001', serial: 'R001' },
        { id: 'kaltsit', cn: '凯尔希', en: "KAL'TSIT", def: '003', serial: 'B003' },
      ]
      const keyDisplay = KEY_ROWS.map((row) => {
        const custom = settings.keys[row.id] ?? ''
        return `${row.cn} ${custom === '' ? row.serial : custom}`
      }).join(' · ')

      return el(
        'div',
        { className: 'prts-settings' },
        el('div', { className: 'prts-set-head' }, el(Mark, { size: 16 }), el('h3', null, t.title), status ? el('span', { className: 'prts-set-status' }, status) : null),
        el('p', { className: 'prts-set-intro' }, t.intro),
        el(
          'div',
          { className: 'prts-variants' },
          ['A', 'B'].map((id) => {
            const item = VARIANTS[id]
            return el(
              'button',
              {
                key: id,
                type: 'button',
                className: cx('prts-variant', settings.variant === id && 'on'),
                onClick: () => save({ variant: id }),
                onMouseEnter: hover,
                onFocus: hover,
                style: { '--pv-bg': item.bg, '--pv-ink': item.ink, '--pv-acc': item.acc, '--pv-line': item.line },
              },
              el('span', { className: 'swatch' }, el('span', { className: 'mini' }, 'PRTS')),
              el('span', { className: 'name' }, item.label),
              el('span', { className: 'code' }, item.code),
              el('span', { className: 'desc' }, item.desc),
            )
          }),
        ),
        el(SettingsRow, { title: t.voice, desc: t.voiceDesc }, el(Toggle, { checked: settings.voice, onChange: (value) => save({ voice: value }), label: t.voice })),
        el(SettingsRow, { title: t.sfx, desc: t.sfxDesc }, el(Toggle, { checked: settings.sfx, onChange: (value) => save({ sfx: value }), label: t.sfx })),
        el(
          SettingsRow,
          { title: t.volume, desc: `${Math.round((volDraft ?? settings.volume) * 100)}%` },
          el('input', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.05,
            value: volDraft ?? settings.volume,
            className: 'prts-range',
            'aria-label': t.volume,
            onChange: (event) => setVolDraft(Number(event.target.value)),
            onPointerUp: (event) => commitVolume(Number(event.target.value)),
            onKeyUp: (event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                commitVolume(Number(event.target.value))
              }
            },
            onBlur: (event) => {
              if (volDraft !== null) commitVolume(Number(event.target.value))
            },
          }),
        ),
        el(
          SettingsRow,
          { title: t.preview, desc: t.previewDesc },
          el('button', { type: 'button', className: 'prts-mini-btn', onClick: () => speak('welcome') }, t.previewVoice),
          el('button', { type: 'button', className: 'prts-mini-btn', onClick: () => probe(), onMouseEnter: hover, onFocus: hover }, t.previewSfx),
          el('button', { type: 'button', className: 'prts-mini-btn', onClick: () => sting('bgm') }, t.previewBgm),
        ),
        el(SettingsRow, { title: t.boot, desc: t.bootDesc }, el(Toggle, { checked: settings.boot, onChange: (value) => save({ boot: value }), label: t.boot })),
        el(SettingsRow, { title: t.remember, desc: t.rememberDesc }, el(Toggle, { checked: settings.remember, onChange: (value) => save({ remember: value }), label: t.remember })),
        el(SettingsRow, { title: t.skin, desc: t.skinDesc }, el(Toggle, { checked: settings.skin, onChange: (value) => save({ skin: value }), label: t.skin })),
        el(SettingsRow, { title: t.hero, desc: t.heroDesc }, el(Toggle, { checked: settings.hero, onChange: (value) => save({ hero: value }), label: t.hero })),
        el(SettingsRow, { title: t.uiSkin, desc: t.uiSkinDesc }, el(Toggle, { checked: settings.uiSkin, onChange: (value) => save({ uiSkin: value }), label: t.uiSkin })),
        el(
          SettingsRow,
          { title: t.uiBg, desc: t.uiBgDesc, dim: !settings.uiSkin },
          el(Toggle, { checked: settings.uiBg, onChange: (value) => save({ uiBg: value }), label: t.uiBg, disabled: !settings.uiSkin }),
        ),
        el(
          SettingsRow,
          { title: t.uiChat, desc: t.uiChatDesc, dim: !settings.uiSkin },
          el(Toggle, { checked: settings.uiChat, onChange: (value) => save({ uiChat: value }), label: t.uiChat, disabled: !settings.uiSkin }),
        ),
        el(
          SettingsRow,
          { title: t.uiPanels, desc: t.uiPanelsDesc, dim: !settings.uiSkin },
          el(Toggle, { checked: settings.uiPanels, onChange: (value) => save({ uiPanels: value }), label: t.uiPanels, disabled: !settings.uiSkin }),
        ),
        el(
          SettingsRow,
          { title: t.uiFloat, desc: t.uiFloatDesc, dim: !settings.uiSkin },
          el(Toggle, { checked: settings.uiFloat, onChange: (value) => save({ uiFloat: value }), label: t.uiFloat, disabled: !settings.uiSkin }),
        ),
        el(
          SettingsRow,
          { title: t.parallax, desc: t.parallaxDesc },
          el(
            'div',
            { className: 'prts-para', role: 'radiogroup', 'aria-label': t.parallax },
            t.parallaxOptions.map((label, value) =>
              el(
                'button',
                {
                  key: value,
                  type: 'button',
                  className: cx('prts-para-btn', settings.parallax === value && 'on'),
                  onClick: () => save({ parallax: value }),
                  onMouseEnter: hover,
                  onFocus: hover,
                  'aria-pressed': settings.parallax === value ? 'true' : 'false',
                },
                label,
              ),
            ),
          ),
        ),
        el(
          SettingsRow,
          { title: t.anomaly, desc: t.anomalyDesc },
          el(
            'div',
            { className: 'prts-para', role: 'radiogroup', 'aria-label': t.anomaly },
            t.anomalyOptions.map((label, value) =>
              el(
                'button',
                {
                  key: value,
                  type: 'button',
                  className: cx('prts-para-btn', settings.anomaly === value && 'on'),
                  onClick: () => save({ anomaly: value }),
                  onMouseEnter: hover,
                  onFocus: hover,
                  'aria-pressed': settings.anomaly === value ? 'true' : 'false',
                },
                label,
              ),
            ),
          ),
        ),
        el(
          SettingsRow,
          { title: t.keysCustom, desc: t.keysCustomDesc },
          el(
            'div',
            { className: 'prts-keys' },
            KEY_ROWS.map((row) =>
              el(KeyField, {
                key: row.id,
                id: row.id,
                cn: row.cn,
                en: row.en,
                def: row.def,
                value: settings.keys[row.id] ?? '',
                onSave: saveKey,
              }),
            ),
          ),
        ),
        el(
          SettingsRow,
          { title: t.customUsers, desc: t.customUsersDesc, wide: true },
          el(
            'div',
            { className: 'prts-cu' },
            cuDrafts.map((entry, index) =>
              el(CuRow, {
                key: entry.uid,
                entry,
                onCommit: (patch) => commitCu(index, patch),
                onSave: (row) => saveCu(index, row),
                onRemove: () => removeCu(index),
                savedAt: cuSavedAt[index] ?? 0,
              }),
            ),
            cuDrafts.length < 4
              ? el('button', { type: 'button', className: 'prts-mini-btn', onClick: addCu }, `+ ${t.customUsersAdd}`)
              : null,
          ),
        ),
        el(
          SettingsRow,
          { title: t.relock, desc: t.relockHint },
          el(
            'button',
            {
              type: 'button',
              className: 'prts-mini-btn',
              onClick: () => {
                clearSession()
                document.dispatchEvent(new CustomEvent('prts-boot:relock'))
              },
            },
            t.relock,
          ),
        ),
        el('div', { className: 'prts-set-keys' }, el('span', { className: 'lbl' }, t.keys), el('span', { className: 'val' }, keyDisplay)),
      )
    }

    // ---------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------

    const CSS = String.raw`
.prts-gate,.prts-hero,.prts-settings{--prts-mono:"Cascadia Mono","SF Mono","Roboto Mono",Consolas,"Liberation Mono",monospace}
.prts-gate{position:fixed;inset:0;z-index:${TOP_Z};overflow:hidden;background:var(--p-bg);color:var(--p-ink);
  font-family:"Helvetica Neue",Helvetica,Arial,"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif;
  -webkit-font-smoothing:antialiased;user-select:none;animation:prts-fade .5s ease both;
  transition:opacity .8s ease}
.prts-gate.prts-gate-fading{opacity:0;pointer-events:none}
.prts-gate *,.prts-gate *::before,.prts-gate *::after{box-sizing:border-box}
.prts-gate button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.prts-media{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.prts-layer{position:absolute;inset:0}
.prts-grid{background-image:linear-gradient(var(--p-grid) 1px,transparent 1px),linear-gradient(90deg,var(--p-grid) 1px,transparent 1px);
  background-size:46px 46px;background-position:-1px -1px;mask-image:radial-gradient(96% 84% at 50% 42%,#000 22%,transparent 100%)}
.prts-grid.coarse{background-image:linear-gradient(var(--p-grid2) 1px,transparent 1px),linear-gradient(90deg,var(--p-grid2) 1px,transparent 1px);
  background-size:230px 230px;mask-image:none;opacity:.9}
.prts-grain{opacity:var(--p-grain);mix-blend-mode:var(--p-blend);
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='.62'/></svg>");
  background-size:160px 160px}
.prts-vignette{background:radial-gradient(120% 104% at 50% 46%,transparent 38%,var(--p-vig) 100%)}
.prts-scanline{background:linear-gradient(180deg,transparent 0,var(--p-acc) 50%,transparent 100%);height:120px;opacity:.045;
  animation:prts-scan 7.5s cubic-bezier(.4,0,.6,1) infinite}
@keyframes prts-scan{0%{transform:translateY(-140px)}70%,100%{transform:translateY(100vh)}}
@keyframes prts-fade{from{opacity:0}to{opacity:1}}

.prts-scene{position:absolute;inset:0;display:flex;flex-direction:column;padding:clamp(18px,2.6vw,38px);animation:prts-in .55s cubic-bezier(.2,.7,.2,1) both}
@keyframes prts-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.prts-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;z-index:3}
.prts-eyebrow{font-family:var(--prts-mono);font-size:9.5px;line-height:1.5;letter-spacing:.3em;text-transform:uppercase;color:var(--p-dim);white-space:nowrap}
.prts-top-right{display:flex;gap:26px;align-items:flex-start}
.prts-stamp{letter-spacing:.18em;color:var(--p-ink);opacity:.7;font-variant-numeric:tabular-nums}

.prts-corner{position:absolute;width:15px;height:15px;border:0 solid var(--p-line);z-index:4}
.prts-corner.tl{top:14px;left:14px;border-top-width:1px;border-left-width:1px}
.prts-corner.tr{top:14px;right:14px;border-top-width:1px;border-right-width:1px}
.prts-corner.bl{bottom:14px;left:14px;border-bottom-width:1px;border-left-width:1px}
.prts-corner.br{bottom:14px;right:14px;border-bottom-width:1px;border-right-width:1px}

.prts-wm{display:inline-flex;flex-direction:column;width:max-content;font-size:var(--wm-font);line-height:1}
.prts-wm .bar{display:block;width:100%;height:1px;background:currentColor;opacity:.85}
.prts-wm .bar.top{margin-bottom:.14em}
.prts-wm .bar.bottom{margin-top:.16em}
.prts-wm .prts{display:block;font-family:"Arial Black","Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:900;font-size:100%;
  line-height:.8;letter-spacing:-.045em;transform:scaleX(1.02);transform-origin:left center}
.prts-wm .syn{display:flex;justify-content:space-between;align-items:baseline;width:100%;font-family:"Helvetica Neue",Arial,sans-serif;
  font-weight:700;font-size:13.2%;line-height:1;margin-top:.5em;white-space:nowrap}
.prts-wm .syn-char{display:block}
.prts-wm .syn-space{display:block;width:.62em}
.prts-wm .os{display:flex;justify-content:space-between;align-items:baseline;width:100%;gap:1.8em;margin-top:.34em;
  font-family:"Helvetica Neue",Arial,sans-serif;font-weight:300;font-size:28%;line-height:1.05;letter-spacing:.14em}
.prts-wm .os-word.last{letter-spacing:.16em}

.prts-mark{display:inline-block;vertical-align:middle;flex:none}

.prts-rule{display:flex;align-items:center;gap:1em;color:var(--p-ink)}
.prts-rule::before,.prts-rule::after{content:"";flex:1;height:1px;background:currentColor;opacity:.22}
.prts-rule-label{font-family:var(--prts-mono);font-size:10px;letter-spacing:.52em;text-transform:uppercase;white-space:nowrap;padding-left:.52em}

.prts-footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;gap:18px;
  padding:0 clamp(18px,2.6vw,38px) clamp(12px,1.8vw,20px);font-family:var(--prts-mono);font-size:9px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--p-dim)}
.prts-footer .mid{color:var(--p-ink);opacity:.55}

.prts-kbd{font-family:var(--prts-mono);font-size:8.5px;letter-spacing:.18em;border:1px solid var(--p-line);padding:3px 6px;border-radius:2px;opacity:.8}

/* ---------- boot ---------- */
.prts-boot-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;z-index:2;pointer-events:none}
.prts-boot-mark{will-change:opacity,transform}
.prts-boot-mark .prts-wm .bar{opacity:.55}
.prts-boot-caption{display:flex;align-items:center;gap:14px;font-family:var(--prts-mono);font-size:9.5px;letter-spacing:.34em;
  text-transform:uppercase;color:var(--p-dim);transition:opacity .6s ease}
.prts-boot-caption .dot{width:3px;height:3px;background:var(--p-acc);border-radius:50%;display:block}
.glitching .prts-wm .prts{animation:prts-glitch .34s steps(2,end) 2}
@keyframes prts-glitch{0%,100%{text-shadow:none;transform:scaleX(1.02)}30%{text-shadow:2px 0 var(--p-acc),-2px 0 var(--p-acc2);transform:scaleX(1.02) translateX(1px)}60%{text-shadow:-1.5px 0 var(--p-acc2),1.5px 0 var(--p-acc);transform:scaleX(1.02) translateX(-1px)}}
.prts-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1}
.prts-streaks{position:absolute;inset:0;z-index:1;color:var(--p-ink);overflow:hidden}
.prts-streaks span{position:absolute;height:1px;display:block;animation:prts-streak 2.4s steps(14,end) infinite}
@keyframes prts-streak{0%,100%{transform:translateX(-4%);opacity:0}12%{opacity:1}40%{transform:translateX(4%);opacity:.6}70%{opacity:0}}
.prts-scanfield{position:absolute;inset:0;z-index:1;overflow:hidden;color:var(--p-ink)}
.prts-scanbars{position:absolute;left:0;right:0;bottom:0;height:34%;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;padding:0 5vw;opacity:.5;
  -webkit-mask-image:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.55) 46%,#000 100%);
  mask-image:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.55) 46%,#000 100%)}
.prts-scanbars span{display:block;transition:opacity .5s ease}
.prts-sweep{position:absolute;left:0;right:0;height:5vh;background:linear-gradient(180deg,transparent,var(--p-acc),transparent);opacity:.12;filter:blur(2px)}
.prts-scanline-static{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,var(--p-grid2) 3px 4px);opacity:.2}

.prts-boot-foot{position:absolute;left:clamp(18px,2.6vw,38px);right:clamp(18px,2.6vw,38px);bottom:clamp(30px,3.2vw,42px);
  display:flex;flex-direction:column;gap:10px;z-index:3}
.prts-boot-foot-top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;min-height:52px}
.prts-log{display:flex;flex-direction:column;gap:4px;font-family:var(--prts-mono);font-size:9px;letter-spacing:.08em;color:var(--p-dim)}
.prts-log-line{display:grid;grid-template-columns:96px 1fr 52px;gap:10px;transition:opacity .5s ease}
.prts-log-line .t{opacity:.75}
.prts-log-line .n{color:var(--p-ink);opacity:.72;letter-spacing:.12em}
.prts-log-line .v{color:var(--p-acc);text-align:right;letter-spacing:.14em}
.prts-boot-meta{display:flex;align-items:baseline;justify-content:space-between;gap:24px;font-family:var(--prts-mono);font-size:9px;
  letter-spacing:.24em;text-transform:uppercase;color:var(--p-dim)}
.prts-boot-meta .meta-right{display:flex;align-items:baseline;gap:20px}
.prts-boot-meta .status{color:var(--p-ink);opacity:.62;letter-spacing:.24em}
.prts-boot-meta .num{font-size:11px;letter-spacing:.06em;color:var(--p-acc);font-variant-numeric:tabular-nums}
.prts-track{position:relative;height:1px;background:var(--p-line);overflow:visible}
.prts-track>span{position:absolute;left:0;top:0;height:1px;background:var(--p-ink);transition:width .12s linear}
.prts-track .tip{position:absolute;right:-1px;top:-2px;width:1px;height:5px;background:var(--p-acc)}
.prts-gate .prts-skip{display:flex;align-items:center;gap:10px;flex:none;margin-bottom:1px;
  font-family:var(--prts-mono);font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--p-dim);z-index:5;
  border:1px solid var(--p-line);padding:7px 11px;border-radius:2px;transition:color .2s,border-color .2s}
.prts-gate .prts-skip:hover{color:var(--p-ink);border-color:var(--p-ink)}

/* ---------- identify ---------- */
.prts-identify-main{flex:1;display:grid;grid-template-columns:minmax(0,1.22fr) minmax(250px,.68fr);gap:clamp(28px,4vw,64px);
  align-items:center;padding:clamp(10px,3vh,40px) clamp(2px,1vw,14px);z-index:2}
.prts-identify-left{display:flex;flex-direction:column;gap:14px;max-width:660px;padding-top:6vh}
.prts-step{color:var(--p-acc);letter-spacing:.42em}
.prts-h1{font-size:clamp(22px,2.1vw,30px);font-weight:500;letter-spacing:.06em;margin:0;line-height:1.2}
.prts-sub{font-family:var(--prts-mono);font-size:9px;letter-spacing:.36em;text-transform:uppercase;color:var(--p-dim);margin:0}
.prts-sub::first-letter{color:var(--p-acc)}
.prts-rows{display:flex;flex-direction:column;border-top:1px solid var(--p-line);margin-top:8px;outline:none}
.prts-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto 24px;align-items:center;gap:14px;width:100%;
  padding:15px 16px 15px 4px;border-bottom:1px solid var(--p-line);text-align:left;position:relative;
  transition:background .16s ease,color .16s ease,padding .18s ease;color:var(--p-ink)}
.prts-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:0;background:var(--p-acc);transition:width .18s ease}
.prts-row.is-active{background:var(--p-ink);color:var(--p-bg);padding-left:12px}
.prts-row.is-active::before{width:3px}
.prts-row .tag{font-family:var(--prts-mono);font-size:9px;letter-spacing:.14em;opacity:.6}
.prts-row .body{display:flex;flex-direction:column;gap:5px;min-width:0}
.prts-row .name{display:flex;align-items:baseline;gap:12px;min-width:0}
.prts-row .name .en{font-size:clamp(19px,1.7vw,24px);font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.prts-row .name .cn{font-size:13px;letter-spacing:.2em;opacity:.62}
.prts-row .meta{display:flex;align-items:center;gap:8px;font-family:var(--prts-mono);font-size:8.5px;letter-spacing:.16em;
  text-transform:uppercase;opacity:.62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prts-row .meta .sep{width:2px;height:2px;background:currentColor;border-radius:50%;display:block;flex:none}
.prts-row .serial{font-family:var(--prts-mono);font-size:9.5px;letter-spacing:.1em;opacity:.72;display:flex;gap:6px;align-items:baseline}
.prts-row .serial .label{font-size:7.5px;opacity:.55;letter-spacing:.2em}
.prts-row .go{font-family:var(--prts-mono);font-size:13px;opacity:0;transform:translateX(-4px);transition:opacity .18s,transform .18s}
.prts-row.is-active .go,.prts-row:hover .go{opacity:1;transform:none}
.prts-row.is-prts .tag{animation:prts-ghost 2.3s steps(2,end) infinite}
.prts-row.is-prts .name .cn{letter-spacing:.34em}
.prts-row.is-prts .serial{opacity:.9}
@keyframes prts-ghost{50%{opacity:.18}}
.prts-hint{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--prts-mono);font-size:8.5px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--p-dim);margin-top:6px}
.prts-entry-form{display:flex;flex-direction:column;margin-top:clamp(26px,5vh,48px)}
.prts-entry-form .prts-field{margin-top:0}
.prts-entry-form .prts-input{letter-spacing:.18em;font-size:19px}
.prts-match{font-family:var(--prts-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--p-dim);min-height:15px;margin-top:12px}
.prts-match.hit{color:var(--p-acc)}
.prts-entry-actions{display:flex;align-items:center;gap:16px;margin-top:14px}
.prts-entry-actions .prts-submit{margin-top:0;padding:0 34px;width:auto}
.prts-list-back{margin-top:2px}

.prts-plate{position:relative;align-self:center;height:min(486px,62vh);border:1px solid var(--p-line);padding:18px 20px;
  display:flex;flex-direction:column;justify-content:space-between;gap:16px;overflow:hidden;
  background:linear-gradient(180deg,transparent,rgba(127,127,127,.05))}
.prts-plate-reticle{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);opacity:.14;pointer-events:none}
.prts-plate-top{display:flex;align-items:center;gap:9px;font-family:var(--prts-mono);font-size:10px;letter-spacing:.42em}
.prts-plate-mid{display:flex;flex-direction:column;gap:12px;padding:6px 0 4px}
.prts-plate-mid .prts-wm .bar{opacity:.45}
.prts-plate-tag{font-family:var(--prts-mono);font-size:8px;letter-spacing:.3em;text-transform:uppercase;color:var(--p-dim)}
.prts-plate-data{display:flex;flex-direction:column;gap:9px}
.prts-plate-row{display:flex;justify-content:space-between;gap:12px;font-family:var(--prts-mono);font-size:8.5px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--p-dim);border-bottom:1px dotted var(--p-line);padding-bottom:7px}
.prts-plate-row .v{color:var(--p-ink);opacity:.8}
.prts-plate-watermark{position:absolute;right:-26px;bottom:-34px;font-size:190px;line-height:.7;color:var(--p-ink);opacity:.06;pointer-events:auto;cursor:crosshair;user-select:none;transition:opacity .18s ease}
.prts-plate-watermark:hover{opacity:.22}
.prts-plate-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
.prts-plate-foot .vt{writing-mode:vertical-rl;font-family:var(--prts-mono);font-size:7.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--p-dim);height:78px}
.prts-barcode{color:var(--p-ink);opacity:.66;display:block}

/* ---------- passcode ---------- */
.prts-passcode-form{width:min(432px,86vw);margin:auto;display:flex;flex-direction:column;align-items:stretch;gap:0;z-index:2;
  animation:prts-in .5s cubic-bezier(.2,.7,.2,1) both}
.prts-passcode-mark{display:flex;justify-content:center;margin-bottom:clamp(18px,3vh,30px)}
.prts-please{font-family:var(--prts-mono);font-size:10px;letter-spacing:.62em;text-transform:uppercase;text-align:center;color:var(--p-ink);opacity:.85}
.prts-identity{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;font-family:var(--prts-mono);
  font-size:10px;letter-spacing:.2em;text-transform:uppercase}
.prts-identity .en{letter-spacing:.22em}
.prts-identity .cn{opacity:.5;letter-spacing:.24em}
.prts-gate .prts-link{font-family:var(--prts-mono);font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--p-dim);
  border-bottom:1px solid var(--p-line);padding-bottom:2px;margin-left:6px;transition:color .2s,border-color .2s}
.prts-gate .prts-link:hover{color:var(--p-ink);border-color:var(--p-ink)}
.prts-field{display:flex;flex-direction:column;gap:8px;margin-top:clamp(26px,5vh,48px)}
.prts-label{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-family:var(--prts-mono);
  font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:var(--p-dim)}
.prts-label-sub{letter-spacing:.16em;opacity:.7;font-size:8px}
.prts-input-wrap{position:relative;display:flex;align-items:center;border-bottom:1px solid var(--p-ink);padding-bottom:2px}
.prts-input{flex:1;background:none;border:0;outline:none;color:var(--p-ink);font-family:var(--prts-mono);font-size:22px;
  letter-spacing:.42em;padding:6px 0 8px;width:100%;user-select:text}
.prts-input:focus{outline:none}
.prts-input-wrap.has-value .prts-input{letter-spacing:.34em}
.prts-input-wrap.has-error{border-color:var(--p-danger);animation:prts-shake .32s ease}
@keyframes prts-shake{0%,100%{transform:none}20%{transform:translateX(-4px)}45%{transform:translateX(4px)}70%{transform:translateX(-2px)}}
.prts-eye{font-family:var(--prts-mono);font-size:14px;color:var(--p-dim);padding:0 2px;transition:color .2s}
.prts-eye:hover{color:var(--p-ink)}
.prts-error{font-family:var(--prts-mono);font-size:9px;letter-spacing:.16em;color:var(--p-danger);min-height:16px;
  margin-top:10px;opacity:0;transition:opacity .2s}
.prts-error.show{opacity:1}
.prts-gate .prts-submit{margin-top:18px;height:46px;border:1px solid var(--p-ink);background:transparent;color:var(--p-ink);
  font-size:12px;letter-spacing:.62em;text-indent:.62em;text-transform:uppercase;transition:background .2s,color .2s;border-radius:2px}
.prts-gate .prts-submit:hover{background:var(--p-ink);color:var(--p-bg)}
.prts-passcode-foot{display:flex;justify-content:space-between;gap:14px;margin-top:16px;font-family:var(--prts-mono);
  font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--p-dim)}
.prts-vlabel{position:absolute;top:50%;font-family:var(--prts-mono);font-size:8px;letter-spacing:.42em;text-transform:uppercase;
  color:var(--p-dim);writing-mode:vertical-rl;opacity:.6;z-index:2}
.prts-vlabel.left{left:clamp(6px,1.2vw,16px);transform:translateY(-50%) rotate(180deg)}
.prts-vlabel.right{right:clamp(6px,1.2vw,16px);transform:translateY(-50%)}

/* ---------- grant ---------- */
.prts-grant{background:#000 !important;color:#f2efe8;justify-content:center;align-items:center}.prts-gate.variant-B .prts-grant,.prts-gate.variant-C .prts-grant{color:#f2efe8}
.prts-grant-glow{position:absolute;inset:0;background:radial-gradient(38% 44% at 50% 48%,rgba(255,255,255,.10),transparent 70%);
  animation:prts-pulse 3.6s ease-in-out infinite}
@keyframes prts-pulse{0%,100%{opacity:.5}50%{opacity:1}}
.prts-grant-center{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;z-index:2;text-align:center}
.prts-reticle{position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:4px}
.prts-reticle .ring{position:absolute;inset:0;border:1px solid currentColor;opacity:.28;transform:rotate(45deg)}
.prts-reticle .ring.slow{animation:prts-spin 16s linear infinite}
.prts-reticle .ring.mid{inset:16%;opacity:.5;animation:prts-spin 9s linear reverse infinite}
.prts-reticle .core{position:absolute;inset:38%;border:1px solid currentColor;opacity:.85;transform:rotate(45deg)}
.prts-reticle .tick{font-size:9px;opacity:.5}
.prts-reticle .orbit{position:absolute;inset:0;animation:prts-spin 7s linear infinite}
.prts-reticle .orbit i{position:absolute;left:50%;top:-2px;width:4px;height:4px;background:var(--p-acc);border-radius:50%;display:block}
@keyframes prts-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.prts-grant-mark .prts-wm .bar{opacity:.4}
.prts-grant-line{display:flex;align-items:center;gap:18px;font-family:var(--prts-mono);font-size:10px;letter-spacing:.44em;text-transform:uppercase}
.prts-grant-line .pct{color:var(--p-acc);letter-spacing:.1em}
.prts-grant-user{display:flex;align-items:baseline;gap:12px;font-size:clamp(20px,2.4vw,30px);letter-spacing:.02em}
.prts-grant-user .lbl{font-family:var(--prts-mono);font-size:9px;letter-spacing:.34em;text-transform:uppercase;opacity:.6}
.prts-grant-user .who{font-weight:700}
.prts-grant-meta{display:flex;align-items:center;gap:10px;font-family:var(--prts-mono);font-size:8.5px;letter-spacing:.22em;
  text-transform:uppercase;opacity:.62}
.prts-grant-meta .sep{width:2px;height:2px;background:currentColor;border-radius:50%;display:block}
.prts-grant-foot{position:absolute;left:clamp(28px,5vw,88px);right:clamp(28px,5vw,88px);bottom:clamp(26px,4.4vh,50px);
  display:flex;flex-direction:column;gap:11px;z-index:3}
.prts-grant-foot-line{display:flex;align-items:baseline;justify-content:space-between;gap:18px;font-family:var(--prts-mono);
  font-size:8.5px;letter-spacing:.3em;text-transform:uppercase;opacity:.5}
.prts-grant-foot-line .pct{color:var(--p-acc);letter-spacing:.08em;opacity:1;font-size:10px}
.prts-grant-track{width:100%;height:1px;background:rgba(242,239,232,.2)}
.prts-grant-track span{display:block;height:1px;background:var(--p-acc);transition:width .12s linear}
.prts-grant-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.035) 3px 4px);pointer-events:none}

/* ---------- hero ---------- */
.prts-hero{display:flex;flex-direction:column;gap:6px;color:var(--dsw-alias-label-primary,currentColor)}
html[data-prts-hero="0"] .prts-hero{display:none}
.prts-hero-row{display:flex;align-items:center;gap:9px}
.prts-hero-word{font-size:13px;letter-spacing:.42em;font-weight:500}
.prts-hero-note{font-size:11px;letter-spacing:.16em;color:var(--dsw-alias-label-tertiary,currentColor);opacity:.9}

/* ---------- settings ---------- */
.prts-settings{display:flex;flex-direction:column;max-width:760px;gap:14px;color:var(--dsw-alias-label-primary,#17181a)}
.prts-set-head{display:flex;align-items:center;gap:10px}
.prts-set-head h3{margin:0;font-size:15px;font-weight:600;letter-spacing:.02em}
.prts-set-status{margin-left:auto;font-family:var(--prts-mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,#6f6d66)}
.prts-set-intro{margin:0;font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary,#4c4b45)}
.prts-variants{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:4px 0 6px}
.prts-variant{display:flex;flex-direction:column;gap:7px;text-align:left;padding:12px;border-radius:10px;
  border:1px solid var(--dsw-alias-border-l2,#dcdcdc);background:var(--dsw-alias-bg-layer-2,#f6f4ef);transition:border-color .18s,transform .18s}
.prts-variant:hover{transform:translateY(-1px);border-color:var(--dsw-alias-border-l4,#9a9a9a)}
.prts-variant.on{border-color:var(--dsw-alias-brand-primary,#3f45c9);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary,#3f45c9) inset}
.prts-variant .swatch{display:flex;align-items:center;justify-content:center;height:54px;border-radius:6px;background:var(--pv-bg);
  border:1px solid var(--pv-line);color:var(--pv-ink)}
.prts-variant .mini{font-family:"Arial Black",Arial,sans-serif;font-weight:900;font-size:20px;letter-spacing:-.04em}
.prts-variant .name{font-size:12.5px;font-weight:600}
.prts-variant .code{font-family:var(--prts-mono);font-size:8.5px;letter-spacing:.26em;color:var(--pv-acc)}
.prts-variant .desc{font-size:10.5px;line-height:1.55;color:var(--dsw-alias-label-tertiary,#6f6d66)}
.prts-set-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 0;
  border-top:1px solid var(--dsw-alias-border-l1,#e6e4de)}
.prts-set-row.dim{opacity:.42}
.prts-set-row.dim .prts-switch{cursor:not-allowed}
.prts-set-row.wide{flex-direction:column;align-items:stretch;gap:10px}
.prts-set-control.wide{flex:1;min-width:0;width:100%}
.prts-set-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
.prts-set-title{font-size:12.5px;font-weight:600}
.prts-set-desc{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-tertiary,#6f6d66);max-width:420px}
.prts-set-control{display:flex;align-items:center;gap:10px;flex:none}
.prts-switch{width:38px;height:20px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3,#c9c7c0);background:transparent;
  position:relative;transition:background .18s,border-color .18s;flex:none}
.prts-switch .knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-tertiary,#8a8880);
  transition:transform .18s,background .18s}
.prts-switch.on{background:var(--dsw-alias-brand-primary,#3f45c9);border-color:var(--dsw-alias-brand-primary,#3f45c9)}
.prts-switch.on .knob{transform:translateX(18px);background:#fff}
.prts-switch.off{opacity:.45;cursor:not-allowed}
.prts-range{width:150px;accent-color:var(--dsw-alias-brand-primary,#3f45c9)}
.prts-mini-btn{font-size:11px;letter-spacing:.04em;padding:6px 11px;border-radius:7px;border:1px solid var(--dsw-alias-border-l3,#c9c7c0);
  background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;transition:border-color .18s,background .18s}
.prts-mini-btn:hover{border-color:var(--dsw-alias-border-l4,#9a9a9a);background:var(--dsw-alias-bg-layer-3,#fff)}
.prts-keys{display:flex;flex-direction:column;gap:8px}
.prts-keyrow{display:flex;align-items:center;gap:10px}
.prts-key-copy{display:flex;align-items:baseline;gap:8px;min-width:168px}
.prts-key-copy .prts-key-cn{font-size:13px;font-weight:600}
.prts-key-copy .prts-key-en{font-family:var(--prts-mono);font-size:10px;letter-spacing:.05em;color:var(--dsw-alias-label-tertiary,#6f6d66)}
.prts-key-control{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.prts-key-input{flex:1;min-width:0;font-family:var(--prts-mono);font-size:12px;letter-spacing:.08em;padding:6px 9px;border-radius:7px;
  border:1px solid var(--dsw-alias-border-l3,#c9c7c0);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;outline:none;
  transition:border-color .18s}
.prts-key-input:focus{border-color:var(--dsw-alias-brand-primary,#3f45c9)}
.prts-key-tag{font-size:10px;letter-spacing:.04em;padding:3px 7px;border-radius:6px;white-space:nowrap;
  color:var(--dsw-alias-label-tertiary,#6f6d66);border:1px solid var(--dsw-alias-border-l2,#e0ded7);background:transparent}
.prts-key-tag.on{color:var(--dsw-alias-brand-primary,#3f45c9);border-color:var(--dsw-alias-brand-primary,#3f45c9)}
.prts-cu{display:flex;flex-direction:column;gap:8px;width:100%;min-width:0}
.prts-curow-wrap{display:flex;flex-direction:column;gap:4px;min-width:0}
.prts-curow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.prts-cu-input{flex:1 1 130px;min-width:130px;font-family:var(--prts-mono);font-size:12px;letter-spacing:.06em;padding:6px 9px;border-radius:7px;
  border:1px solid var(--dsw-alias-border-l1,#e6e4de);background:transparent;color:var(--dsw-alias-label-primary,#1b1c1f)}
.prts-cu-input:focus{border-color:var(--dsw-alias-brand-primary,#3f45c9);outline:none}
.prts-cu-input::placeholder{color:var(--dsw-alias-label-tertiary,#9a998f)}
.prts-cu-remove{flex:none;margin-left:auto;width:26px;height:26px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1,#e6e4de);
  color:var(--dsw-alias-label-tertiary,#9a998f);font-size:14px;line-height:1;cursor:pointer;background:transparent}
.prts-cu-save{flex:none;margin-left:auto;width:26px;height:26px;border-radius:7px;border:1px solid var(--dsw-alias-brand-primary,#3f45c9);
  color:var(--dsw-alias-brand-primary,#3f45c9);font-size:14px;line-height:1;cursor:pointer;background:transparent}
.prts-cu-save.off{opacity:.35;cursor:not-allowed}
.prts-cu-status{min-height:15px;font-family:var(--prts-mono);font-size:11px;letter-spacing:.04em;color:transparent;padding-left:2px}
.prts-cu-status.bad{color:var(--dsw-alias-state-warn-primary,#b07a2f)}
.prts-cu-status.ok{color:var(--dsw-alias-state-success-primary,#2a6b64)}
.prts-cu-remove:hover{color:var(--dsw-alias-state-error-primary,#c14b3f);border-color:var(--dsw-alias-state-error-primary,#c14b3f)}
.prts-set-keys{display:flex;justify-content:space-between;gap:16px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1,#e6e4de);
  font-size:11px;color:var(--dsw-alias-label-tertiary,#6f6d66)}
.prts-set-keys .val{font-family:var(--prts-mono);letter-spacing:.06em;color:var(--dsw-alias-label-secondary,#4c4b45)}

/* ---------- skin ---------- */
html[data-prts-skin]{--p-sk:1}
html[data-prts-skin] body{font-family:"Helvetica Neue",Helvetica,Arial,"Microsoft YaHei UI","Microsoft YaHei","PingFang SC",sans-serif}
html[data-prts-skin] ::selection{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}
html[data-prts-skin="A"]{
  --dsw-alias-bg-base:#efede7;--dsw-alias-bg-layer-1:#f6f4ef;--dsw-alias-bg-layer-2:#faf8f3;--dsw-alias-bg-layer-3:#fffefb;
  --dsw-alias-bg-overlay:rgba(250,248,243,.94);
  --dsw-alias-border-l1:rgba(17,17,16,.07);--dsw-alias-border-l2:rgba(17,17,16,.13);--dsw-alias-border-l3:rgba(17,17,16,.2);--dsw-alias-border-l4:rgba(17,17,16,.32);
  --dsw-alias-label-primary:#12120f;--dsw-alias-label-secondary:#4c4b45;--dsw-alias-label-tertiary:#6f6d66;--dsw-alias-label-caption:#8a8880;
  --dsw-alias-label-primary-foreground:#f6f4ef;--dsw-alias-label-primary-inverted:#f6f4ef;
  --dsw-alias-brand-primary:#3f45c9;--dsw-alias-brand-text:#3f45c9;
  --dsw-alias-interactive-bg-hover:rgba(17,17,16,.05);--dsw-alias-interactive-bg-active:rgba(17,17,16,.09);
  --dsw-alias-button-primary-fill:#12120f;--dsw-alias-button-primary-hover:#2a2a26;
  --dsw-alias-state-error-primary:#a8322a;
  --dsw-specific-sidebar-fill:rgba(246,244,239,.62);--dsw-specific-bubble:#faf8f3;--dsw-specific-input-major:#fbfaf6;
  --dsw-specific-menu:#fbfaf7;--dsw-specific-selector:#f1efe9}
html[data-prts-skin="B"]{
  --dsw-alias-bg-base:#0a0a0b;--dsw-alias-bg-layer-1:#101012;--dsw-alias-bg-layer-2:#151517;--dsw-alias-bg-layer-3:#1b1b1e;
  --dsw-alias-bg-overlay:rgba(12,12,13,.94);
  --dsw-alias-border-l1:rgba(236,233,225,.07);--dsw-alias-border-l2:rgba(236,233,225,.13);--dsw-alias-border-l3:rgba(236,233,225,.21);--dsw-alias-border-l4:rgba(236,233,225,.34);
  --dsw-alias-label-primary:#ece9e1;--dsw-alias-label-secondary:#b6b2a8;--dsw-alias-label-tertiary:#8b877e;--dsw-alias-label-caption:#6b6862;
  --dsw-alias-label-primary-foreground:#0a0a0b;--dsw-alias-label-primary-inverted:#0a0a0b;
  --dsw-alias-brand-primary:#e0a94f;--dsw-alias-brand-text:#e0a94f;
  --dsw-alias-interactive-bg-hover:rgba(236,233,225,.06);--dsw-alias-interactive-bg-active:rgba(236,233,225,.1);
  --dsw-alias-button-primary-fill:#ece9e1;--dsw-alias-button-primary-hover:#d6d2c8;
  --dsw-alias-state-error-primary:#e2685c;
  --dsw-specific-sidebar-fill:rgba(13,13,14,.72);--dsw-specific-bubble:#141416;--dsw-specific-input-major:#131315;
  --dsw-specific-menu:#141416;--dsw-specific-selector:#111113}
html[data-prts-skin="C"]{
  --dsw-alias-bg-base:#10171a;--dsw-alias-bg-layer-1:#131c20;--dsw-alias-bg-layer-2:#172227;--dsw-alias-bg-layer-3:#1c2a30;
  --dsw-alias-bg-overlay:rgba(16,23,26,.94);
  --dsw-alias-border-l1:rgba(231,238,240,.07);--dsw-alias-border-l2:rgba(231,238,240,.13);--dsw-alias-border-l3:rgba(231,238,240,.21);--dsw-alias-border-l4:rgba(231,238,240,.34);
  --dsw-alias-label-primary:#e7eef0;--dsw-alias-label-secondary:#aab8bd;--dsw-alias-label-tertiary:#7f8f95;--dsw-alias-label-caption:#63727a;
  --dsw-alias-label-primary-foreground:#0d1417;--dsw-alias-label-primary-inverted:#0d1417;
  --dsw-alias-brand-primary:#7fd6e8;--dsw-alias-brand-text:#7fd6e8;
  --dsw-alias-interactive-bg-hover:rgba(231,238,240,.06);--dsw-alias-interactive-bg-active:rgba(231,238,240,.1);
  --dsw-alias-button-primary-fill:#e7eef0;--dsw-alias-button-primary-hover:#cfdade;
  --dsw-alias-state-error-primary:#e2685c;
  --dsw-specific-sidebar-fill:rgba(13,19,22,.72);--dsw-specific-bubble:#152025;--dsw-specific-input-major:#131e22;
  --dsw-specific-menu:#152025;--dsw-specific-selector:#121b1f}

/* ---------- anomaly (Priestess corruption overlay) ---------- */
@keyframes prtsAxFlash{0%,100%{opacity:0}1.5%,4.5%{opacity:1}36%,39%{opacity:1}70%,73%{opacity:1}}
@keyframes prtsAxStrobe{0%,1.4%,6.6%,35.9%,41.1%,69.9%,75.1%,100%{opacity:0}1.5%,6.5%{opacity:.72}36%,41%{opacity:.72}70%,75%{opacity:.72}}
@keyframes prtsAxGlitch{0%,1.4%,6.6%,35.9%,41.1%,69.9%,75.1%,100%{transform:translateX(0)}2%,5%{transform:translateX(5px)}36.5%,40%{transform:translateX(-5px)}70.5%,74%{transform:translateX(3px)}}
@keyframes prtsAxCorrupt{0%,100%{opacity:0}36.5%,40%{opacity:1}71%,74%{opacity:1}}
@keyframes prtsAxHalo{0%,100%{opacity:.5;transform:rotate(45deg) scale(1)}50%{opacity:.9;transform:rotate(45deg) scale(1.06)}}
@keyframes prtsAxSliceA{0%,100%{transform:translateX(0)}1.5%,4.5%{transform:translateX(-9px)}36%,39%{transform:translateX(-13px)}70%,73%{transform:translateX(-7px)}}
@keyframes prtsAxSliceB{0%,100%{transform:translateX(0)}1.5%,4.5%{transform:translateX(10px)}36%,39%{transform:translateX(14px)}70%,73%{transform:translateX(8px)}}
@keyframes prtsAxStamp{0%,8%{opacity:0;transform:rotate(-4deg) scale(.9)}9%,14%{opacity:.95;transform:rotate(-4deg) scale(1)}15%,44%{opacity:0;transform:rotate(-4deg) scale(.9)}45%,50%{opacity:.95;transform:rotate(-4deg) scale(1)}51%,100%{opacity:0;transform:rotate(-4deg) scale(.9)}}
@keyframes prtsAxErr1{0%,5%{opacity:0;transform:translateY(6px)}8%,20%{opacity:.95;transform:translateY(0)}24%,30%{opacity:0;transform:translateY(-4px)}100%{opacity:0}}
@keyframes prtsAxErr2{0%,48%{opacity:0;transform:translateY(6px)}52%,64%{opacity:.95;transform:translateY(0)}68%,74%{opacity:0;transform:translateY(-4px)}100%{opacity:0}}
@keyframes prtsAxGhost{0%,100%{transform:translateX(0)}2%,5%{transform:translateX(2px);filter:drop-shadow(1.6px 0 rgba(198,79,63,.55)) drop-shadow(-1.6px 0 rgba(53,162,160,.55))}36.5%,39.5%{transform:translateX(-2px);filter:drop-shadow(-1.6px 0 rgba(198,79,63,.55)) drop-shadow(1.6px 0 rgba(53,162,160,.55))}70.5%,73.5%{transform:translateX(1px);filter:drop-shadow(1.6px 0 rgba(198,79,63,.55)) drop-shadow(-1.6px 0 rgba(53,162,160,.55))}}
.prts-anomaly{position:absolute;inset:0;z-index:12;pointer-events:none;overflow:hidden}
.prts-anomaly-sil{position:absolute;left:0;top:0;width:50%;height:100%;display:flex;align-items:flex-end;justify-content:center}
.prts-anomaly-portal{position:absolute;left:50%;top:58%;width:560px;height:560px;margin:-280px 0 0 -280px;border-radius:50%;
  background:radial-gradient(circle,rgba(17,17,16,.14) 0%,rgba(155,111,255,.13) 34%,rgba(155,111,255,.06) 55%,rgba(155,111,255,0) 72%)}
.prts-anomaly-halo{position:absolute;left:50%;top:24%;width:240px;height:240px;margin-left:-120px;
  border:2px solid rgba(155,111,255,.5);box-shadow:0 0 90px rgba(155,111,255,.3),inset 0 0 60px rgba(155,111,255,.16);
  animation:prtsAxHalo 4.2s ease-in-out infinite}
.prts-anomaly-halo::after{content:'';position:absolute;inset:42px;border:1px solid rgba(155,111,255,.35);
  box-shadow:0 0 34px rgba(155,111,255,.22)}
.prts-anomaly-halo::before{content:'';position:absolute;inset:86px;background:rgba(155,111,255,.14);
  box-shadow:0 0 26px rgba(155,111,255,.3)}
.prts-anomaly-fig{position:relative;height:calc(100% - 80px);aspect-ratio:412/394;opacity:0;
  animation:prtsAxStrobe 7s linear infinite,prtsAxGlitch 7s linear infinite}
.prts-anomaly:not(.strong) .prts-anomaly-sil{opacity:.66}
.prts-anomaly:not(.strong) .prts-anomaly-fig{animation-name:prtsAxStrobe}
.prts-anomaly-fig .layer{position:absolute;inset:0}
.prts-anomaly-fig .layer img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 44px rgba(155,111,255,.5))}
.prts-anomaly-fig .layer.corrupted{opacity:0;animation:prtsAxCorrupt 7s linear infinite}
.prts-anomaly-fig .layer.corrupted img{filter:drop-shadow(2.5px 0 rgba(198,79,63,.6)) drop-shadow(-2.5px 0 rgba(53,162,160,.6)) drop-shadow(0 0 52px rgba(198,79,63,.45))}
.prts-anomaly-slice{position:absolute;left:0;right:0;height:26px;opacity:0;
  background:linear-gradient(rgba(198,79,63,.20),rgba(198,79,63,.20)),linear-gradient(rgba(53,162,160,.16),rgba(53,162,160,.16)),linear-gradient(rgba(247,245,240,.9),rgba(247,245,240,.9));
  background-size:26px 100%,26px 100%,100% 100%;background-position:-9px 0,10px 0,0 0;background-repeat:no-repeat;mix-blend-mode:multiply}
.prts-anomaly-slice.s1{top:18%;animation:prtsAxFlash 7s linear infinite,prtsAxSliceA 7s linear infinite}
.prts-anomaly-slice.s2{top:47%;height:18px;animation:prtsAxFlash 7s linear infinite,prtsAxSliceB 7s linear infinite}
.prts-anomaly-slice.s3{top:71%;height:30px;animation:prtsAxFlash 7s linear infinite,prtsAxSliceA 7s linear infinite}
.prts-anomaly-flicker{position:absolute;inset:0;opacity:0;
  background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,0) 30%,rgba(255,255,255,.14) 62%,rgba(255,255,255,0) 100%);
  animation:prtsAxFlash 7s linear infinite}
.prts-anomaly-errs{position:absolute;font-family:var(--prts-mono);font-size:15px;letter-spacing:.5px}
.prts-anomaly-errs.tl{top:64px;left:64px}
.prts-anomaly-errs.br{bottom:64px;right:64px;text-align:right}
.prts-anomaly-errs .err{padding:2px 8px;margin-bottom:6px;width:max-content;background:rgba(17,17,16,.88);color:#a9e3de;
  border-left:3px solid #c64f3f;text-shadow:0 0 6px rgba(53,162,160,.8);opacity:0}
.prts-anomaly-errs .err.red{border-left-color:#35a2a0;color:#ffb3a8;text-shadow:0 0 6px rgba(198,79,63,.8)}
.prts-anomaly-errs.tl .err:nth-child(1){animation:prtsAxErr1 7s linear infinite}
.prts-anomaly-errs.tl .err:nth-child(2){animation:prtsAxErr1 7s linear infinite .35s}
.prts-anomaly-errs.tl .err:nth-child(3){animation:prtsAxErr2 7s linear infinite .2s}
.prts-anomaly-errs.br .err:nth-child(1){animation:prtsAxErr2 7s linear infinite}
.prts-anomaly-errs.br .err:nth-child(2){animation:prtsAxErr1 7s linear infinite .5s}
.prts-anomaly-errs .gibberish{letter-spacing:3px;color:rgba(17,17,16,.5);font-size:17px;opacity:.8}
.prts-anomaly-stamp{position:absolute;right:6%;top:38%;font-family:var(--prts-mono);font-size:15px;color:#c64f3f;
  border:1px solid #c64f3f;padding:3px 10px;letter-spacing:.12em;box-shadow:0 0 18px rgba(198,79,63,.25);opacity:0;
  animation:prtsAxStamp 7s linear infinite}
.prts-identify.prts-anomaly-on .prts-row.is-prts{animation:prtsAxGhost 7s linear infinite !important}

/* ---------- priestess flow fx (passcode / granted) ---------- */
.prts-pfx{position:absolute;inset:0;z-index:14;pointer-events:none;overflow:hidden;
  font-family:var(--prts-mono)}
.prts-pfx-d{position:absolute;border:1px solid rgba(155,111,255,.16);transform:rotate(45deg)}
.prts-pfx-d.d1{left:50%;top:50%;width:640px;height:640px;margin:-320px 0 0 -320px;
  box-shadow:0 0 90px rgba(155,111,255,.08),inset 0 0 90px rgba(155,111,255,.06);animation:prtsFxSpin 26s linear infinite}
.prts-pfx-d.d2{left:50%;top:50%;width:430px;height:430px;margin:-215px 0 0 -215px;border-color:rgba(155,111,255,.24);animation:prtsFxSpinR 18s linear infinite}
.prts-pfx-d.d3{right:-120px;top:16%;width:260px;height:260px;border-color:rgba(155,111,255,.12);animation:prtsFxSpin 34s linear infinite}
.prts-pfx-d.d4{left:-100px;bottom:10%;width:220px;height:220px;border-color:rgba(155,111,255,.1);animation:prtsFxSpinR 30s linear infinite}
.prts-pfx-d.d5{left:20%;top:14%;width:120px;height:120px;border-color:rgba(155,111,255,.14);animation:prtsFxSpin 22s linear infinite}
@keyframes prtsFxSpin{from{transform:rotate(45deg)}to{transform:rotate(405deg)}}
@keyframes prtsFxSpinR{from{transform:rotate(45deg)}to{transform:rotate(-315deg)}}
.prts-pfx-rt{position:absolute;color:rgba(226,74,66,.85);font-size:13px;letter-spacing:.16em;
  text-shadow:0 0 8px rgba(226,74,66,.45);opacity:0;animation:prtsFxRt 4.6s steps(1,end) infinite;white-space:nowrap}
@keyframes prtsFxRt{0%,5%,11%,15%,21%,100%{opacity:0}7%,13%,17%{opacity:.82}}
.prts-pfx-rt.r1{left:8%;top:30%;animation-duration:5.3s}
.prts-pfx-rt.r2{right:9%;top:22%;animation-duration:6.1s;animation-delay:-2.4s}
.prts-pfx-rt.r3{left:15%;bottom:24%;animation-duration:4.9s;animation-delay:-1.1s}
.prts-pfx-rt.r4{right:12%;bottom:28%;animation-duration:5.7s;animation-delay:-3.2s}
.prts-pfx-rt.r5{left:38%;top:9%;animation-duration:6.7s;animation-delay:-.6s}
.prts-pfx-rt.r6{right:26%;bottom:11%;animation-duration:5.1s;animation-delay:-2.9s}
.prts-pfx-sl{position:absolute;height:3px;opacity:0;mix-blend-mode:multiply;animation:prtsFxSl 6.8s steps(1,end) infinite}
.prts-pfx-sl.w{height:12px}
.prts-pfx-sl.r{background:linear-gradient(90deg,rgba(226,74,66,0) 0%,rgba(226,74,66,.5) 14%,rgba(226,74,66,0) 22%,rgba(226,74,66,.4) 70%,rgba(226,74,66,0) 84%)}
.prts-pfx-sl.c{background:linear-gradient(90deg,rgba(53,162,160,0) 0%,rgba(53,162,160,.45) 16%,rgba(53,162,160,0) 26%,rgba(53,162,160,.38) 68%,rgba(53,162,160,0) 82%)}
.prts-pfx-sl.g{background:linear-gradient(90deg,rgba(128,128,128,0) 0%,rgba(140,140,140,.42) 18%,rgba(128,128,128,0) 30%,rgba(150,150,150,.34) 66%,rgba(130,130,130,0) 80%)}
.prts-pfx-sl.rc{background:linear-gradient(90deg,rgba(226,74,66,0) 0%,rgba(226,74,66,.45) 8%,rgba(226,74,66,0) 14%,rgba(53,162,160,0) 44%,rgba(53,162,160,.4) 50%,rgba(53,162,160,0) 56%,rgba(226,74,66,.35) 82%,rgba(226,74,66,0) 90%)}
@keyframes prtsFxSl{0%,5%,6.4%,11%,12.4%,15%,16.4%,22%,23%,26%,27.4%,100%{opacity:0}5.4%,6%{opacity:.9}11.4%,12%{opacity:.75}15.4%,16%{opacity:.85}22.4%,22.8%{opacity:.65}26.4%,27%{opacity:.5}}
@keyframes prtsFxSlX{0%,5%,6.4%,11%,12.4%,15%,16.4%,22%,23%,26%,27.4%,100%{transform:translateX(0)}5.4%,6%{transform:translateX(9px)}11.4%,12%{transform:translateX(-7px)}15.4%,16%{transform:translateX(13px)}22.4%,22.8%{transform:translateX(-10px)}}
.prts-pfx-sl.shift{animation:prtsFxSl 6.8s steps(1,end) infinite,prtsFxSlX 6.8s steps(1,end) infinite}
.prts-pfx-sl.sl1{top:13%;left:4%;width:41%;animation-duration:5.9s}
.prts-pfx-sl.sl2{top:13.4%;left:52%;width:27%;animation-duration:5.9s}
.prts-pfx-sl.sl3{top:24%;left:14%;width:33%;animation-duration:7.3s;animation-delay:-2.1s}
.prts-pfx-sl.sl4{top:24.6%;left:64%;width:22%;animation-duration:7.3s;animation-delay:-2.1s}
.prts-pfx-sl.sl5{top:35%;left:6%;width:52%;animation-duration:5.4s;animation-delay:-1.2s}
.prts-pfx-sl.sl6{top:35.5%;left:66%;width:16%;animation-duration:5.4s;animation-delay:-1.2s}
.prts-pfx-sl.sl7{top:46%;left:20%;width:38%;animation-duration:6.5s;animation-delay:-3.4s}
.prts-pfx-sl.sl8{top:57%;left:8%;width:44%;animation-duration:7.8s;animation-delay:-.7s}
.prts-pfx-sl.sl9{top:57.5%;left:60%;width:25%;animation-duration:7.8s;animation-delay:-.7s}
.prts-pfx-sl.sl10{top:68%;left:16%;width:30%;animation-duration:5.6s;animation-delay:-2.8s}
.prts-pfx-sl.sl11{top:68.4%;left:70%;width:18%;animation-duration:5.6s;animation-delay:-2.8s}
.prts-pfx-sl.sl12{top:79%;left:30%;width:40%;animation-duration:6.2s;animation-delay:-4.1s}
.prts-pfx-sl.sl13{top:88%;left:12%;width:26%;animation-duration:7.1s;animation-delay:-1.6s}
.prts-pfx-sl.sl14{top:88.5%;left:46%;width:32%;animation-duration:7.1s;animation-delay:-1.6s}
.prts-scene.prts-fx-on{animation:prts-in .55s cubic-bezier(.2,.7,.2,1) both,prtsFxJit 7s linear infinite}
@keyframes prtsFxJit{0%,1.4%,6.6%,35.9%,41.1%,69.9%,75.1%,100%{transform:translate(0,0) skewX(0)}
  2%,5%{transform:translate(3px,-2px) skewX(.4deg)}
  36.5%,40%{transform:translate(-4px,2px) skewX(-.5deg)}
  70.5%,74%{transform:translate(2px,1px) skewX(.3deg)}}

/* ---------- main ui ---------- */
.prts-brand{display:flex;align-items:center;gap:9px;font-family:var(--prts-mono,ui-monospace,'SF Mono',Consolas,monospace);font-size:13px;letter-spacing:.3em;color:var(--dsw-alias-label-primary,inherit);cursor:default;user-select:none;line-height:1}
html:not([data-prts-ui]) .prts-brand{display:none}
.prts-brand-mark{display:inline-block;width:15px;height:15px;border:1px solid var(--dsw-alias-brand-primary);transform:rotate(45deg);position:relative;flex:none}
.prts-brand-mark::after{content:'';position:absolute;inset:27%;background:var(--dsw-alias-brand-primary)}
.prts-brand-text{font-weight:600}
html[data-prts-ui='A'] .prts-ui-bg{--fx-ink:rgba(17,17,16,.16);--fx-line:rgba(17,17,16,.14);--fx-line2:rgba(17,17,16,.09);--fx-c1:rgba(63,69,201,.2);--fx-c2:rgba(42,107,100,.22);--fx-c3:rgba(176,122,47,.2)}
html[data-prts-ui='B'] .prts-ui-bg{--fx-ink:rgba(236,233,225,.14);--fx-line:rgba(236,233,225,.15);--fx-line2:rgba(236,233,225,.09);--fx-c1:rgba(198,91,213,.3);--fx-c2:rgba(95,195,201,.26);--fx-c3:rgba(224,169,79,.26)}
.prts-ui-comp{position:absolute;inset:0;pointer-events:none;z-index:0}
@keyframes prtsFxSpin{to{transform:rotate(360deg)}}
@keyframes prtsFxSpinR{to{transform:rotate(-360deg)}}
@keyframes prtsFxSpin45{from{transform:rotate(45deg)}to{transform:rotate(405deg)}}
@keyframes prtsFxSpinR45{from{transform:rotate(45deg)}to{transform:rotate(-315deg)}}
@keyframes prtsFxPulse{0%,100%{transform:rotate(45deg) scale(1)}50%{transform:rotate(45deg) scale(1.45)}}
.prts-ui-bg .fx-anchor{position:absolute;left:62%;top:50%;width:0;height:0}
.prts-ui-bg .fx-core{position:absolute;left:0;top:0;width:min(46vh,420px);height:min(46vh,420px);margin:calc(min(46vh,420px)/-2) 0 0 calc(min(46vh,420px)/-2);border:1px solid var(--fx-line);animation:prtsFxSpin45 96s linear infinite}
.prts-ui-bg .fx-core2{position:absolute;left:0;top:0;width:min(22vh,200px);height:min(22vh,200px);margin:calc(min(22vh,200px)/-2) 0 0 calc(min(22vh,200px)/-2);background:var(--fx-ink);animation:prtsFxSpinR45 72s linear infinite}
.prts-ui-bg .fx-ring{position:absolute;left:0;top:0;border-radius:50%;border:1px dashed var(--fx-line2)}
.prts-ui-bg .fx-ring.r1{width:min(58vh,540px);height:min(58vh,540px);margin:calc(min(58vh,540px)/-2) 0 0 calc(min(58vh,540px)/-2);animation:prtsFxSpin 120s linear infinite}
.prts-ui-bg .fx-ring.r2{width:min(72vh,660px);height:min(72vh,660px);margin:calc(min(72vh,660px)/-2) 0 0 calc(min(72vh,660px)/-2);border-style:solid;border-color:var(--fx-c1);animation:prtsFxSpinR 160s linear infinite}
.prts-ui-bg .fx-ring.r3{width:min(86vh,780px);height:min(86vh,780px);margin:calc(min(86vh,780px)/-2) 0 0 calc(min(86vh,780px)/-2);border-style:solid;border-color:var(--fx-c2);border-left-color:transparent;border-right-color:transparent;animation:prtsFxSpin 200s linear infinite}
.prts-ui-bg .fx-orbit{position:absolute;left:0;top:0;animation:prtsFxSpin linear infinite}
.prts-ui-bg .fx-orbit.o1{width:min(62vh,580px);height:min(62vh,580px);margin:calc(min(62vh,580px)/-2) 0 0 calc(min(62vh,580px)/-2);animation-duration:44s}
.prts-ui-bg .fx-orbit.o2{width:min(78vh,720px);height:min(78vh,720px);margin:calc(min(78vh,720px)/-2) 0 0 calc(min(78vh,720px)/-2);animation-duration:67s;animation-direction:reverse}
.prts-ui-bg .fx-frag{position:absolute;left:50%;top:0;width:15px;height:15px;margin-left:-7.5px;border:1px solid var(--fx-c2);transform:rotate(45deg);animation:prtsFxPulse 7s ease-in-out infinite}
.prts-ui-bg .fx-frag.f2{border-color:var(--fx-c3);animation-delay:-2.4s}
.prts-ui-bg .fx-frag.f3{border-color:var(--fx-c1);animation-delay:-4.8s}
.prts-ui-bg .fx-orbit.o1 .fx-frag.f2{left:100%;top:50%;margin-top:-7.5px}
.prts-ui-bg .fx-orbit.o1 .fx-frag.f3{left:50%;top:100%;margin-top:-7.5px}
.prts-ui-bg .fx-orbit.o2 .fx-frag.f5{left:0;top:50%;margin-left:-7.5px;margin-top:-7.5px}
.prts-ui-bg .fx-orbit.o2 .fx-frag.f6{left:50%;top:100%;margin-top:-7.5px}
.prts-ui-bg .fx-dot{position:absolute;width:4px;height:4px;background:var(--fx-c1);animation:prtsFxPulse 9s ease-in-out infinite}
.prts-ui-wall{position:absolute;top:0;left:0;width:140%;z-index:1;-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 51%,transparent 58%,transparent 100%);mask-image:linear-gradient(to bottom,#000 0%,#000 51%,transparent 58%,transparent 100%)}
.prts-ui-wall img{width:100%;height:auto;display:block;-webkit-mask-image:linear-gradient(to right,transparent 0%,transparent 22%,rgba(0,0,0,.55) 42%,#000 62%);mask-image:linear-gradient(to right,transparent 0%,transparent 22%,rgba(0,0,0,.55) 42%,#000 62%)}
html[data-prts-ui] body{background:var(--prts-ui-base)}
html[data-prts-ui] .prts-agent-scene{display:none!important}
html[data-prts-ui] :has(> [data-shell-overlay]){position:relative;z-index:1}
/* A/B pairing: the whole main UI follows the chosen skin. */
html[data-prts-ui]{--prts-ui-base:#f4f3ef;--prts-ui-ink:#1b1c1f;color-scheme:light}
html[data-prts-ui='B']{--prts-ui-base:#0f1013;--prts-ui-ink:#f2f3f1;color-scheme:dark}
html[data-prts-ui] .prts-ui-bg{background:var(--prts-ui-base)}
html[data-prts-ui='A'] :has(> [data-shell-overlay]){--dsw-alias-bg-base:#f4f3ef;--dsw-alias-bg-layer-1:#ecebe5;--dsw-alias-bg-layer-2:#faf9f6;--dsw-alias-bg-layer-3:#ffffff;--dsw-alias-label-primary:#1b1c1f;--dsw-alias-label-secondary:#4c5057;--dsw-alias-label-tertiary:#737881;--dsw-alias-label-caption:#949aa1;--dsw-alias-border-l1:rgba(22,24,28,.09);--dsw-alias-border-l2:rgba(22,24,28,.15);--dsw-alias-border-l3:rgba(22,24,28,.22);--dsw-alias-interactive-bg-hover:rgba(22,24,28,.055)}
html[data-prts-ui='B'] :has(> [data-shell-overlay]){--dsw-alias-bg-base:#0f1013;--dsw-alias-bg-layer-1:#16181d;--dsw-alias-bg-layer-2:#1a1d22;--dsw-alias-bg-layer-3:#21252c;--dsw-alias-label-primary:#f2f3f1;--dsw-alias-label-secondary:#c9cdce;--dsw-alias-label-tertiary:#9da3a8;--dsw-alias-label-caption:#7a8087;--dsw-alias-border-l1:rgba(255,255,255,.09);--dsw-alias-border-l2:rgba(255,255,255,.16);--dsw-alias-border-l3:rgba(255,255,255,.24);--dsw-alias-interactive-bg-hover:rgba(255,255,255,.07)}
/* Sidebar column: neutralise the terrarchive dark gradient + light-text vars so
   the sidebar follows the chosen skin instead of forcing its own palette. */
html[data-prts-ui='A'] :has(> [data-shell-overlay]) > div:nth-of-type(1){--dsw-alias-label-primary:#1b1c1f;--dsw-alias-label-secondary:#4c5057;--dsw-alias-label-tertiary:#737881;--dsw-alias-label-caption:#949aa1;--dsw-alias-button-elevated-fill:#f4f3ef;--dsw-alias-button-floating-hover:#e6e5e0;--dsw-alias-border-l1:rgba(22,24,28,.09);--dsw-alias-border-l2:rgba(22,24,28,.15);--dsw-alias-interactive-bg-hover:rgba(22,24,28,.055);border-right:1px solid rgba(22,24,28,.1)}
html[data-prts-ui='B'] :has(> [data-shell-overlay]) > div:nth-of-type(1){--dsw-alias-label-primary:#f2f3f1;--dsw-alias-label-secondary:#c9cdce;--dsw-alias-label-tertiary:#9da3a8;--dsw-alias-label-caption:#7a8087;--dsw-alias-button-elevated-fill:#1e2229;--dsw-alias-button-floating-hover:#262b34;--dsw-alias-border-l1:rgba(255,255,255,.09);--dsw-alias-border-l2:rgba(255,255,255,.16);--dsw-alias-interactive-bg-hover:rgba(255,255,255,.07);border-right:1px solid rgba(255,255,255,.12)}
/* Conversation page: reset the terrarchive vertical text-gradient so sidebar
   text stays readable over the paired background. */
html[data-prts-ui] body[data-prts-skin="agent"]:has(.prts-agent-scene[data-page="conversation"]) :has(> [data-shell-overlay])>div:nth-of-type(1) :is(span,b,small,p,h1,h2,h3,label):not([role="dialog"] *):not([data-git-tone]){color:inherit!important;background:none!important;background-clip:border-box!important;-webkit-background-clip:border-box!important;-webkit-text-fill-color:currentColor!important}
html[data-prts-ui] body[data-prts-skin="agent"]:has(.prts-agent-scene[data-page="conversation"]) :has(> [data-shell-overlay])>div:nth-of-type(1) svg:not([role="dialog"] *){color:currentColor!important;mix-blend-mode:normal!important}
/* Header strip + composer follow the pairing (terrarchive forces white). */
html[data-prts-ui='B'] [data-phase="active"]:not(#prts-agent-scene)>:first-child:not([data-conversation-scroll]){background:rgba(16,17,20,.45)!important;border-bottom-color:rgba(255,255,255,.08)!important}
html[data-prts-ui='B'] [data-composer-seat]{background:linear-gradient(180deg,rgba(15,16,19,0) 0,rgba(15,16,19,.9) 38px)!important}
html[data-prts-ui='B'] [data-composer-card]{background:transparent!important;border:none!important;box-shadow:none!important}
.prts-ui-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:var(--dsw-alias-bg-base)}
.prts-ui-bg .prts-ui-grid{position:absolute;inset:0;background-image:linear-gradient(var(--dsw-alias-border-l1) 1px,transparent 1px),linear-gradient(90deg,var(--dsw-alias-border-l1) 1px,transparent 1px);background-size:44px 44px;opacity:.55}
.prts-ui-bg .prts-ui-mark{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);font-weight:800;font-style:normal;font-size:clamp(180px,24vw,420px);line-height:1;letter-spacing:.04em;color:transparent;-webkit-text-stroke:1px var(--dsw-alias-border-l2);opacity:.26;user-select:none;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.prts-ui-bg .prts-ui-corner{position:absolute;width:26px;height:26px;border:0 solid var(--dsw-alias-border-l3)}
.prts-ui-bg .prts-ui-corner.a{left:18px;top:18px;border-top-width:1px;border-left-width:1px}
.prts-ui-bg .prts-ui-corner.b{right:18px;bottom:18px;border-bottom-width:1px;border-right-width:1px}
.prts-ui-bg .prts-ui-vig{position:absolute;inset:0;background:radial-gradient(120% 104% at 50% 46%,transparent 52%,var(--dsw-alias-border-l1) 100%)}
html[data-prts-ui-bg='1'] :has(> [data-shell-overlay]),html[data-prts-ui-bg='1'] :has(> [data-shell-overlay]) > div:nth-of-type(1),html[data-prts-ui-bg='1'] :has(> [data-shell-overlay]) > div:nth-of-type(2),html[data-prts-ui-bg='1'] [data-phase],html[data-prts-ui-bg='1'] [data-conversation-scroll]{background:transparent!important}
/* Frameless · hairline · translate-extend (v18 design). */
html[data-prts-ui-chat='1'] [data-composer-card]{border:none;border-radius:0;background:transparent;box-shadow:none}
html[data-prts-ui-chat='1'] [data-composer-seat]{border-top:1px solid var(--dsw-alias-border-l1);transition:border-color .24s cubic-bezier(.2,.7,.2,1)}
html[data-prts-ui-chat='1'] [data-composer-seat]:focus-within{border-top-color:var(--dsw-alias-brand-primary)}
html[data-prts-ui-chat='1'] [data-chat-flow-kind='assistant-step']::before{content:'◇';display:inline-block;margin-right:7px;color:var(--dsw-alias-brand-primary);font-size:.72em;vertical-align:2px}
html[data-prts-ui-chat='1'] [data-chat-flow-kind='tool-call'] [data-tool]{border:none;border-radius:0;border-left:2px solid var(--dsw-alias-brand-primary);transition:border-color .24s cubic-bezier(.2,.7,.2,1)}
html[data-prts-ui-panels='1'] :has(> [data-shell-overlay]) > div:nth-of-type(1){border-right:1px solid var(--dsw-alias-border-l1)}
/* Better Sidebar semi-transparent adaptation: frosted glass. The sidebar
   column becomes a translucent blur layer and every surface token inside it
   (Better Sidebar only paints with --dsw-alias-* tokens) is scoped to a
   translucent value, so panels / rows / popovers let the wallpaper show
   through. Text and hairlines keep full opacity for readability. */
html[data-prts-ui-panels='1'] :has(> [data-shell-overlay]) > div:nth-of-type(1){
  --dsw-alias-bg-layer-1:rgba(244,243,239,.62);
  --dsw-alias-bg-layer-2:rgba(244,243,239,.45);
  --dsw-alias-bg-layer-3:rgba(244,243,239,.32);
  --dsw-alias-bg-overlay:rgba(244,243,239,.58);
  --dsw-alias-bg-module-platform:rgba(244,243,239,.52);
  --dsw-specific-sidebar-fill:rgba(244,243,239,.5);
  backdrop-filter:blur(16px) saturate(1.06);
  -webkit-backdrop-filter:blur(16px) saturate(1.06);
}
html[data-prts-ui='B'][data-prts-ui-panels='1'] :has(> [data-shell-overlay]) > div:nth-of-type(1){
  --dsw-alias-bg-layer-1:rgba(15,16,19,.62);
  --dsw-alias-bg-layer-2:rgba(15,16,19,.45);
  --dsw-alias-bg-layer-3:rgba(15,16,19,.32);
  --dsw-alias-bg-overlay:rgba(15,16,19,.58);
  --dsw-alias-bg-module-platform:rgba(15,16,19,.52);
  --dsw-specific-sidebar-fill:rgba(15,16,19,.5);
}
/* Frosted column base (overrides the transparent rule above when the
   background layer is active — the wall stays visible through the blur). */
html[data-prts-ui-bg='1'][data-prts-ui-panels='1'] :has(> [data-shell-overlay]) > div:nth-of-type(1){background:rgba(244,243,239,.34)!important}
html[data-prts-ui='B'][data-prts-ui-bg='1'][data-prts-ui-panels='1'] :has(> [data-shell-overlay]) > div:nth-of-type(1){background:rgba(15,16,19,.34)!important}
/* Native right sidebar (hosts Better Sidebar tabs): same frosted treatment.
   The panel is [data-sidebar-right-session] (absolute, right edge); its dock
   surfaces paint with --dsw-alias-* tokens, so scoping the same translucent
   token set inside it re-skins tab bodies, floats and empty hosts.
   The glass base + blur are gated on [data-sidebar-right-open]: while the
   panel is collapsed the container must stay fully transparent (the dock
   slides off but the panel shell remains, and an ungated blur would keep
   frosting the background behind the closed panel). */
html[data-prts-ui-panels='1'] [data-sidebar-right-session]{
  --dsw-alias-bg-base:rgba(244,243,239,.5);
  --dsw-alias-bg-layer-1:rgba(244,243,239,.62);
  --dsw-alias-bg-layer-2:rgba(244,243,239,.45);
  --dsw-alias-bg-layer-3:rgba(244,243,239,.32);
  --dsw-alias-bg-overlay:rgba(244,243,239,.58);
  --dsw-alias-bg-module-platform:rgba(244,243,239,.52);
  --dsw-specific-sidebar-fill:rgba(244,243,239,.5);
}
html[data-prts-ui='B'][data-prts-ui-panels='1'] [data-sidebar-right-session]{
  --dsw-alias-bg-base:rgba(15,16,19,.5);
  --dsw-alias-bg-layer-1:rgba(15,16,19,.62);
  --dsw-alias-bg-layer-2:rgba(15,16,19,.45);
  --dsw-alias-bg-layer-3:rgba(15,16,19,.32);
  --dsw-alias-bg-overlay:rgba(15,16,19,.58);
  --dsw-alias-bg-module-platform:rgba(15,16,19,.52);
  --dsw-specific-sidebar-fill:rgba(15,16,19,.5);
}
html[data-prts-ui-panels='1'] [data-sidebar-right-session][data-sidebar-right-open]{
  background:rgba(244,243,239,.34);
  backdrop-filter:blur(16px) saturate(1.06);
  -webkit-backdrop-filter:blur(16px) saturate(1.06);
}
html[data-prts-ui='B'][data-prts-ui-panels='1'] [data-sidebar-right-session][data-sidebar-right-open]{
  background:rgba(15,16,19,.34);
}
html[data-prts-ui-panels='1'] div[role='treeitem']{transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s cubic-bezier(.2,.7,.2,1),background .22s cubic-bezier(.2,.7,.2,1)}
html[data-prts-ui-panels='1'] div[role='treeitem']:hover{transform:translateX(3px)}
html[data-prts-ui-panels='1'] div[role='treeitem'][aria-selected]{box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary);border-radius:0;background:transparent}
/* A-variant header hairline (B already set by the pairing block above). */
html[data-prts-ui='A'] [data-phase="active"]:not(#prts-agent-scene)>:first-child:not([data-conversation-scroll]){background:transparent!important;border-bottom-color:rgba(22,24,28,.08)!important}
html[data-prts-ui='A'] [data-composer-seat]{background:linear-gradient(180deg,rgba(244,243,239,0) 0,rgba(244,243,239,.88) 38px)!important}
/* PRTS interaction polish: thinking-driven composite, hover cues, running pulse. */
@keyframes prtsToolPulse{0%,100%{border-left-color:var(--dsw-alias-brand-primary)}50%{border-left-color:transparent}}
.prts-brand-mark{transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.prts-brand:hover .prts-brand-mark{transform:rotate(405deg)}
html[data-prts-ui] body:has([data-tool][data-state='running']) .prts-ui-comp .fx-core,html[data-prts-ui] body:has([data-tool][data-state='running']) .prts-ui-comp .fx-core2,html[data-prts-ui] body:has([data-tool][data-state='running']) .prts-ui-comp .fx-ring,html[data-prts-ui] body:has([data-tool][data-state='running']) .prts-ui-comp .fx-orbit{animation-duration:18s}
html[data-prts-ui-panels='1'] div[role='treeitem']:hover{box-shadow:inset 0 -1px 0 var(--dsw-alias-border-l2)}
html[data-prts-ui-panels='1'] div[role='treeitem'][aria-selected]:hover{box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary)}
html[data-prts-ui-chat='1'] [data-chat-flow-kind='assistant-step']{transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s cubic-bezier(.2,.7,.2,1)}
html[data-prts-ui-chat='1'] [data-chat-flow-kind='assistant-step']:hover{transform:translateX(2px);box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary)}
html[data-prts-ui-chat='1'] [data-chat-flow-kind='tool-call'] [data-tool][data-state='running']{animation:prtsToolPulse 1.8s ease-in-out infinite}
html[data-prts-ui-chat='1'] [data-composer-card]{transition:transform .22s cubic-bezier(.2,.7,.2,1)}
html[data-prts-ui-chat='1'] [data-composer-card]:focus-within{transform:translateY(-1px)}
/* Conversation region: LEFT-referenced fixed width. The scroll container is
   anchored to the left (it follows the sidebar edge naturally) and capped at
   760px, so toggling the LEFT sidebar reflows it while opening the native
   RIGHT sidebar (which pushes the content column) leaves the conversation
   untouched — no re-measuring, no misalignment. Long input wraps inside the
   fixed region instead of stretching it. */
html[data-prts-ui-chat='1'] [data-conversation-scroll]{margin-left:0!important;margin-right:auto!important;width:min(760px,100%)!important;max-width:760px!important;min-width:0!important;overflow-x:hidden!important}
html[data-prts-ui-chat='1'] [data-conversation-scroll] > *{margin-left:0!important;margin-right:0!important;min-width:0!important;max-width:100%!important}
html[data-prts-ui-chat='1'] [data-conversation-scroll] > * > *{min-width:0!important;max-width:100%!important}
html[data-prts-ui-chat='1'] [data-conversation-scroll] > * > * > *{min-width:0!important;max-width:100%!important}
html[data-prts-ui-chat='1'] :has(> [data-conversation-scroll]){min-width:0!important}
html[data-prts-ui-chat='1'] :has(> :has(> [data-conversation-scroll])){min-width:0!important}
html[data-prts-ui-chat='1'] :has(> :has(> :has(> [data-conversation-scroll]))){min-width:0!important}
/* ---------- floating dialog bar ---------- */
html[data-prts-ui] .prts-float,html[data-prts-ui] .prts-float-chip{--pfb-line:rgba(22,24,28,.24);--pfb-bg:rgba(244,243,239,.8);--pfb-fg:#1b1c1f;--pfb-dim:rgba(27,28,31,.55);--pfb-acc:#5a4a8a;--pfb-busy:#b13b32}
html[data-prts-ui='B'] .prts-float,html[data-prts-ui='B'] .prts-float-chip{--pfb-line:rgba(236,233,225,.22);--pfb-bg:rgba(15,16,19,.74);--pfb-fg:#f2f3f1;--pfb-dim:rgba(242,243,241,.55);--pfb-acc:#e0a94f;--pfb-busy:#ff5a4e}
.prts-float{position:fixed;right:24px;bottom:112px;width:272px;z-index:2147482050;font-family:"Helvetica Neue",Helvetica,Arial,"Microsoft YaHei UI","Microsoft YaHei","PingFang SC",sans-serif;color:var(--pfb-fg);user-select:none;-webkit-user-select:none;touch-action:none}
.prts-float-frame{position:relative;border:1px solid var(--pfb-line);background:var(--pfb-bg);backdrop-filter:blur(10px) saturate(1.05);-webkit-backdrop-filter:blur(10px) saturate(1.05)}
.prts-float{animation:prtsFloatIn .34s cubic-bezier(.2,.7,.2,1)}
.prts-float.snapping{transition:left .32s cubic-bezier(.2,.7,.2,1),top .32s cubic-bezier(.2,.7,.2,1)}
@keyframes prtsFloatIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.prts-float-frame{position:relative;border:1px solid var(--pfb-line);background:var(--pfb-bg);border-radius:10px;backdrop-filter:blur(10px) saturate(1.05);-webkit-backdrop-filter:blur(10px) saturate(1.05);overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.12)}
.prts-float-frame::before,.prts-float-frame::after{content:'';position:absolute;width:14px;height:14px;pointer-events:none;border:0 solid var(--pfb-acc);opacity:.8}
.prts-float-frame::before{left:7px;top:7px;border-left-width:1px;border-top-width:1px}
.prts-float-frame::after{right:7px;bottom:7px;border-right-width:1px;border-bottom-width:1px}
.prts-float-head{display:flex;align-items:center;gap:7px;padding:8px 10px 7px;cursor:grab;border-bottom:1px solid var(--pfb-line)}
.prts-float-head:active{cursor:grabbing}
.prts-float-mark{color:var(--pfb-acc);font-size:13px;line-height:1;display:inline-block}
.prts-float-title{font-size:12px;font-weight:700;letter-spacing:.18em}
.prts-float-sub{font-size:9px;letter-spacing:.24em;color:var(--pfb-dim)}
.prts-float-pin{margin-left:auto;background:none;border:none;color:var(--pfb-dim);font:inherit;font-size:11px;cursor:pointer;padding:2px 5px;transition:color .2s ease,transform .2s cubic-bezier(.34,1.56,.64,1)}
.prts-float-pin:hover{color:var(--pfb-acc)}
.prts-float-pin:active{transform:scale(.82)}
.prts-float-pin.on{color:var(--pfb-acc)}
.prts-float-min{background:none;border:none;color:var(--pfb-dim);font:inherit;font-size:12px;cursor:pointer;padding:2px 6px;transition:color .2s ease,transform .2s cubic-bezier(.34,1.56,.64,1)}
.prts-float-min:hover{color:var(--pfb-acc)}
.prts-float-min:active{transform:scale(.82)}
.prts-float-status{display:flex;align-items:center;gap:7px;padding:7px 10px 6px;font-size:10px;letter-spacing:.22em;color:var(--pfb-dim);border-bottom:1px solid var(--pfb-line)}
.prts-float-status i{width:6px;height:6px;transform:rotate(45deg);background:var(--pfb-acc);opacity:.85}
.prts-float-status.busy{color:var(--pfb-busy)}
.prts-float-status.busy i{background:var(--pfb-busy);animation:prtsFloatBlink 1.1s steps(2,end) infinite}
@keyframes prtsFloatBlink{50%{opacity:.15}}
.prts-float-rows{display:flex;flex-direction:column;padding:4px 0}
.prts-float-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:none;border:none;border-bottom:1px solid var(--pfb-line);margin:0;padding:8px 12px;font:inherit;font-size:12px;color:var(--pfb-fg);cursor:pointer;text-align:left;transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s cubic-bezier(.2,.7,.2,1)}
.prts-float-row:last-child{border-bottom:none}
.prts-float-row:hover{transform:translateX(3px);box-shadow:inset 2px 0 0 var(--pfb-acc)}
.prts-float-row:active{transform:translateX(3px) scale(.97)}
.prts-float-row-label{letter-spacing:.14em;font-weight:600}
.prts-float-row-val{font-size:11px;color:var(--pfb-dim);letter-spacing:.08em}
.prts-float-chip{position:fixed;right:28px;bottom:28px;z-index:2147482050;width:46px;height:46px;border-radius:13px;background:var(--pfb-bg);border:1px solid var(--pfb-line);cursor:grab;display:flex;align-items:center;justify-content:center;padding:0;backdrop-filter:blur(8px) saturate(1.05);-webkit-backdrop-filter:blur(8px) saturate(1.05);box-shadow:0 6px 18px rgba(0,0,0,.14);animation:prtsChipIn .4s cubic-bezier(.34,1.56,.64,1);touch-action:none;user-select:none;-webkit-user-select:none}
.prts-float-chip:active{cursor:grabbing}
@keyframes prtsChipIn{from{opacity:0;transform:scale(.5) rotate(-90deg)}to{opacity:1;transform:scale(1) rotate(0)}}
.prts-float-chip::before{content:'';position:absolute;inset:-1px;border-radius:14px;border:1px solid var(--pfb-acc);opacity:0;transition:opacity .25s ease}
.prts-float-chip::after{content:'';position:absolute;inset:4px;border-radius:10px;border:1px solid var(--pfb-line);opacity:.9;transition:border-color .25s ease}
.prts-float-chip:hover::before{opacity:.75}
.prts-float-chip-glyph{font-size:20px;line-height:1;color:var(--pfb-acc);transform:rotate(0);transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
.prts-float-chip:hover .prts-float-chip-glyph{transform:rotate(180deg) scale(1.18)}
.prts-float-chip:active .prts-float-chip-glyph{transform:scale(.8)}
.prts-float-chip.busy .prts-float-chip-glyph{animation:prtsFloatBlink 1.1s steps(2,end) infinite}
.prts-float-chip.busy::after{border-color:var(--pfb-busy)}
.prts-ui-ext{position:fixed;inset:0;z-index:2147482000;pointer-events:none}
.prts-ui-ext>*{pointer-events:auto}

/* ---------- parallax ---------- */
.prts-para{display:flex;border:1px solid var(--dsw-alias-border-l3,#c9c7c0);border-radius:7px;overflow:hidden}
.prts-para-btn{flex:1;padding:7px 12px;font-size:12px;color:var(--dsw-alias-label-secondary,#4c4b45);background:transparent;
  border:0;border-left:1px solid var(--dsw-alias-border-l3,#c9c7c0);outline:none;transition:background .18s,color .18s}
.prts-para-btn:first-child{border-left:0}
.prts-para-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));border:0;border-left:1px solid var(--dsw-alias-border-l3,#c9c7c0)}
.prts-para-btn:first-child:hover{border-left:0}
.prts-para-btn.on{background:var(--dsw-alias-button-primary-fill,#12120f);color:var(--dsw-alias-label-primary-foreground,#f6f4ef);border:0;border-left:1px solid var(--dsw-alias-border-l3,#c9c7c0)}
.prts-para-btn.on:first-child{border-left:0}
.prts-gate{--ppx:0;--ppy:0;--pps:1}
.prts-pl,.prts-pm,.prts-pf{transition:transform 160ms linear;will-change:transform}
.prts-pl{transform:translate3d(calc(var(--ppx) * var(--pps) * -5px),calc(var(--ppy) * var(--pps) * -3px),0)}
.prts-pm{transform:translate3d(calc(var(--ppx) * var(--pps) * 6px),calc(var(--ppy) * var(--pps) * 4px),0)}
.prts-pf{transform:translate3d(calc(var(--ppx) * var(--pps) * 13px),calc(var(--ppy) * var(--pps) * 8px),0)}
@media (prefers-reduced-motion:reduce){
  .prts-pl,.prts-pm,.prts-pf{transition:none;transform:none}
  .prts-anomaly{display:none}
  .prts-pfx{display:none}
  .prts-scene.prts-fx-on{animation:prts-in .55s cubic-bezier(.2,.7,.2,1) both}
  .prts-ui-comp{display:none}
  html[data-prts-ui-panels='1'] div[role='treeitem']{transition:none;transform:none}
  html[data-prts-ui-chat='1'] [data-composer-seat]{transition:none}
  html[data-prts-ui-chat='1'] [data-chat-flow-kind='assistant-step']{transition:none;transform:none}
  html[data-prts-ui-chat='1'] [data-tool][data-state='running']{animation:none}
  html[data-prts-ui-chat='1'] [data-composer-card]{transition:none}
  .prts-brand-mark{transition:none}
  .prts-float-row{transition:none;transform:none}
  .prts-float-chip{transition:none;animation:none}
  .prts-float-chip .prts-float-chip-glyph{transition:none}
  .prts-float{animation:none}
  .prts-float-pin,.prts-float-min{transition:none}
  .prts-float-status.busy i,.prts-float-chip.busy{animation:none}
}
`

    function ensureStyle() {
      if (typeof document === 'undefined') return () => {}
      const existing = document.getElementById(STYLE_ID)
      if (existing !== null) return () => {}
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = CSS
      document.head.appendChild(style)
      return () => {
        try {
          style.remove()
          document.getElementById(STYLE_ID)?.remove()
        } catch {
          /* ignore */
        }
        const root = document.documentElement
        delete root.dataset.prtsSkin
        delete root.dataset.prtsVariant
        delete root.dataset.prtsHero
      }
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const disposeStyle = ensureStyle()
        publishApi()

        // Register the PRTS themes with the DSH theme service. The service
        // projects the alias tokens onto the document, reskinning every
        // surface that consumes --dsw-alias-* (background, sidebar, panels,
        // chat) from one place. If it is missing, the CSS pairing below
        // remains the fallback. On cold boots the service can register after
        // this bundle applies, so acquisition is retried for up to ~30s.
        themeCtxRef = ctx
        if (!acquireTheme(ctx) && themeRetryTimer === null) {
          themeRetryTimer = setInterval(() => {
            themeRetryCount += 1
            if (acquireTheme(themeCtxRef) || themeRetryCount >= 60) {
              clearInterval(themeRetryTimer)
              themeRetryTimer = null
            }
          }, 500)
        }

        try {
          ctx.slots.inject(OVERLAY_SLOT, () =>
            ctx.slots.register({ name: 'shell.overlay', id: ROW_ID, order: 950 }, Gate),
          )
          ctx.slots.inject(HERO_SLOT, () =>
            ctx.slots.register({ name: 'conversation.hero.brand.mark', id: ROW_ID }, HeroMark),
          )
          ctx.slots.inject(TAB_SLOT, () =>
            ctx.slots.register({ name: 'settings.plugins.tab', id: ROW_ID, order: 55, label: () => strings().tab }, SettingsTab),
          )
          ctx.slots.inject(SIDEBAR_BRAND_SLOT, () =>
            ctx.slots.register({ name: 'sidebar.brand.mark', id: ROW_ID }, PrtsBrand),
          )
        } catch {
          /* An older host without one of the slots keeps the rest working. */
        }

        return disposeStyle
      },
    }
  },
})
