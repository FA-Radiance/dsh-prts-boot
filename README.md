# dsh-prts-boot

PRTS-themed boot sequence, identity gate and interface skin for DeepSeek Harness.

The plugin adds a PRTS (Primitive Rhodes Island Terminal Service, from Arknights)
opening ceremony to the app: a boot animation, an operator identity gate with
selection / passcode entry, and an interface skin that follows the chosen
variant. All voices are synthesized or extracted in PRTS style (robotic female
voice, English lines, Chinese UI), and the main-UI theming is registered as two
real DSH themes so the whole surface — background, sidebar, chat, panels, brand
mark — re-skins consistently.

## Features

- **Boot sequence** — PRTS boot animation with the two variants:
  - `A` 白 · 档案 (paper / archive, light)
  - `B` 黑 · 核心 (black / core, dark)
- **Identity gate** — user selection (Doctor B101 / Amiya R001 / Kal'tsit
  B003, serial auto-match; unknown IDs are rejected), custom profiles created
  in settings (编号 / 中文名 / English / password), per-account custom
  passwords, remember-login, re-lock.
- **Hidden record** — a concealed Priestess (普瑞赛斯) account: click the
  plate watermark `◇` five times (or type `PRTS` in the archive list) to wake
  it. Its flow removes the passcode field and overlays interference effects
  (three intensity levels in settings).
- **PRTS voice set** — boot / identify / auth / granted / denied / welcome /
  locked, plus hidden-record lines; separate `sfx` toggle for UI sounds
  (hover / tick / pick).
- **Main-UI theming** — registered as the DSH themes `prts-paper` (light) and
  `prts-core` (dark), driven by the chosen variant. Background paper tone with
  coordinate grid, PRTS watermark and the composite geometry animation behind
  the app; frameless hairline chat / panels; frosted sidebar and right panel;
  optional floating action bar.
- **Settings page** — every option documented, saved immediately, with master /
  sub switches for the main-UI skin.

## Installation

The package is a standard DSH bundle plugin.

### Install into a profile (local directory)

1. Build nothing — the package ships plain JS (`lib/index.js` + `lib/client.js`).
2. Add it to the profile like any local bundle:

   ```jsonc
   // <DSH_HOME>/profiles/<profile>/package.json
   {
     "dependencies": {
       "dsh-prts-boot": "link:./path/to/dsh-prts-boot"
     },
     "dsh": {
       "profile": {
         "bundles": ["dsh-prts-boot"]
       }
     }
   }
   ```

3. Restart the app (or use the dsh-super-injector's `dev_install_package` /
   `dev_inject_plugin` flow to load it without a restart).

The loader reads `dsh.bundle.patch` (`cordis.patch.yml`) and materializes
`lib/index.js` on the host; the browser loads `lib/client.js` automatically
(`dsh.client.platform: web`, `immediately: true`).

### From a tarball

`npm pack` respects the `files` field (lib, assets, cordis.patch.yml,
README.md, LICENSE); install the tarball like any dependency.

## Runtime state

- Settings: `$DSH_HOME/dsh-prts-boot/config.json`
- Session memory: browser `sessionStorage` / `localStorage`
  (`dsh-prts-boot:session`, `dsh-prts-boot:float`)

## Endpoints

- `GET /dsh-prts-boot/api/state` — effective settings
- `POST /dsh-prts-boot/api/state` — patch settings
- `GET /dsh-prts-boot/voice/<id>.mp3` — voice clips (Range-capable)
- `GET /dsh-prts-boot/asset/<name>` — whitelisted images
- `GET/POST /dsh-prts-boot/api/beacon` — client heartbeat diagnostics

## Asset provenance

- 4 game-voice clips (boot / identify / auth / granted-doctor) extracted from
  the official PRTS boot animation (bilibili BV1FJ396JEqw, fair use for
  personal theming).
- 7 lines converted through an RVC model trained on those clips
  (en-US-AriaNeural base + PRTS timbre).
- Wallpapers derived from the PRTS parallax wallpapers the user provided
  (mpkg assets).
- Arknights and its characters belong to Hypergryph. This is a personal
  fan-skin plugin; do not redistribute commercially.

## License

MIT.
