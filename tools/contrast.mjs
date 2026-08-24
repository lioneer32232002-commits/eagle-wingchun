// 四季印色的 WCAG 對比度檢查。
// 用法：node tools/contrast.mjs
//
// 顏色表是從 assets/css/style.css 抄出來的一份快照（零相依，不解析 CSS）。
// 改 style.css 的季節色時，這裡要同步改並跑一次，確保新色不會壓不出可讀的對比。
const SEASONS = {
  '預設朱': { seal: '#a3392a', sealL: '#d3604a', paper: '#f5f2ea', paper2: '#ebe5d8' },
  '春・若竹': { seal: '#42714b', sealL: '#8cba8e', paper: '#f2f4ec', paper2: '#e8ecdc' },
  '夏・竹月': { seal: '#2f6673', sealL: '#74b6c4', paper: '#f0f3ee', paper2: '#e4eae2' },
  '秋・柿赭': { seal: '#8f5110', sealL: '#d29a56', paper: '#f6f1e3', paper2: '#eee5d0' },
  '冬・絳朱': { seal: '#a3392a', sealL: '#d3604a', paper: '#f7efe4', paper2: '#efe3d1' },
};

// 墨色不隨季節變，跟 style.css 的 --ink / --ink-2 同步
const INK = '#100e0c';
const INK_2 = '#1a1714';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function ratio(hexA, hexB) {
  const la = luminance(hexToRgb(hexA));
  const lb = luminance(hexToRgb(hexB));
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

let anyWarn = false;

for (const [name, c] of Object.entries(SEASONS)) {
  console.log(`\n【${name}】`);
  const pairs = [
    ['印色 壓 紙', c.seal, c.paper, 4.5],
    ['印色 壓 紙2', c.seal, c.paper2, 4.5],
    ['亮印色 壓 深底(ink)', c.sealL, INK, 4.5],
    ['亮印色 壓 深底(ink-2)', c.sealL, INK_2, 4.5],
    ['紙 壓 印色（新徽章）', c.paper, c.seal, 4],
    ['墨 壓 紙（內文）', INK, c.paper, 7],
  ];
  for (const [label, a, b, threshold] of pairs) {
    const r = ratio(a, b);
    const ok = r >= threshold;
    if (!ok) anyWarn = true;
    console.log(`  ${ok ? ' ' : '⚠'} ${label.padEnd(18, '　').slice(0, 18)}  ${r.toFixed(2)}  (門檻 ${threshold})`);
  }
}

console.log(anyWarn ? '\n⚠ 有配對低於門檻，回去調 style.css 的季節色。' : '\n✓ 全部配對通過。');
process.exitCode = anyWarn ? 1 : 0;
