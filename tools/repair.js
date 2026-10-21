// One-shot repair for client.js after an ANSI/UTF-8 round-trip mangled CJK glyphs.
// Keys are 1-based line numbers in the damaged file.
import fs from 'node:fs'

const file = process.argv[2]
const fixes = new Map([
  [2, ' * dsh-prts-boot — browser half.'],
  [9, ' *   - `shell.overlay` — the boot sequence + identity gate. Portalled to <body>,'],
  [11, ' *   - `conversation.hero.brand.mark` — the small PRTS lockup on the blank-session'],
  [13, ' *   - `settings.plugins.tab` — variant / voice / skin settings.'],
  [104, '     * Crew records. The access key is the last three digits of the file number —\n     * the same rule Arknights uses for its own terminals, and the reason the'],
  [117, "        note: '最高权限 · 全面指挥',"],
  [122, "        cn: '阿米娅',"],
  [133, "        cn: '凯尔希',"],
  [147, "        label: '白 · 档案',"],
  [148, "        desc: '纸本、坐标网格、蓝紫细线 —— 官方启动动画的直译',"],
  [168, "        label: '黑 · 核心',"],
  [169, "        desc: '粒子云汇聚成菱形，白色字标 —— PRTS 核心的开机画面',"],
  [190, "        desc: '扫描线与条码列，冷青点缀 —— 天灾监测站的视觉',"],
  [343, "          'aria-label': 'PRTS — synthesize information — analysis OS',"],
  [408, "        el('span', { className: 'tick' }, '◇'),"],
  [786, "        el('span', { className: 'go' }, '→'),"],
  [833, "            el(Eyebrow, { className: 'prts-step' }, '01 / 02 — OPERATOR'),"],
  [852, "              el('span', null, '↑ ↓ 选择'),"],
  [874, "            el('div', { className: 'prts-plate-watermark' }, '◇'),"],
  [876, "            el('div', { className: 'prts-plate-foot' }, el(Barcode, { seed: 'rhodes-island' }), el('span', { className: 'vt' }, 'RHODES ISLAND — PRTS DIVISION')),"],
  [882, "          el('span', null, 'PRTS 4.2.1 — ANALYSIS OS'),"],
  [941, "            el('span', { className: 'prts-label' }, el('span', null, 'ACCESS KEY'), el('span', { className: 'prts-label-sub' }, '档案编号末三位')),"],
  [966, "                reveal ? '◉' : '◎',"],
  [973, "            error ? '验证失败 · 访问密钥不正确，请重新确认' : ' ',"],
  [975, "          el('button', { type: 'submit', className: 'prts-submit' }, '登 录'),"],
  [987, "          el('span', null, 'PRTS 4.2.1 — ANALYSIS OS'),"],
  [1251, "        el('div', { className: 'prts-hero-note' }, `欢迎回来，${name}`),"],
  [1261, "        tab: 'PRTS 启动门',"],
  [1262, "        title: 'PRTS 启动门',"],
  [1263, "        intro: '启动动画、登录门与界面皮肤。改动立即保存；皮肤在通过登录门之后生效。',"],
  [1265, "        variantDesc: '三个方案的排版相同，气质不同。',"],
  [1267, "        voiceDesc: '合成音，冷静、简短，只报状态。',"],
  [1270, "        bootDesc: '每次打开 DSH 先播 PRTS 启动序列。',"],
  [1272, "        rememberDesc: '同一标签页内不再要求密钥；重新锁定可手动复位。',"],
  [1274, "        skinDesc: '通行后覆盖 DSH 的颜色与字体。',"],
  [1275, "        hero: '主界面字标',"],
  [1276, "        heroDesc: '在空白会话的标题上方加 PRTS 字标。',"],
  [1278, "        relockHint: '下一次刷新会重新播放启动序列并退回登录门。',"],
  [1281, "        keysValue: '博士 101 · 阿米娅 102 · 凯尔希 103',"],
  [1282, "        saved: '已保存',"],
  [1283, "        saving: '保存中…',"],
  [1292, "        voiceDesc: 'Synthesised, calm, short — status lines only.',"],
  [1308, "        saving: 'Saving…',"],
])

const text = fs.readFileSync(file, 'utf8')
const lines = text.split('\n')
const problems = []
for (const number of fixes.keys()) {
  const line = lines[number - 1]
  if (line === undefined || !line.includes('\uFFFD')) problems.push(number)
}
if (problems.length > 0) {
  console.error('refusing: lines without replacement chars:', problems.join(','))
  process.exit(1)
}

const out = []
for (let index = 0; index < lines.length; index += 1) {
  const replacement = fixes.get(index + 1)
  out.push(replacement === undefined ? lines[index] : replacement)
}
const repaired = out.join('\n')
if (repaired.includes('\uFFFD')) {
  const left = repaired.split('\n').filter((line) => line.includes('\uFFFD'))
  console.error('still damaged lines:', left.length, left.slice(0, 5))
  process.exit(1)
}
fs.writeFileSync(file, repaired, 'utf8')
console.log('repaired', fixes.size, 'lines ->', Buffer.byteLength(repaired), 'bytes')
