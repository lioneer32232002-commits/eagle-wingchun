// 產生網站要用的 WebP：每張圖一個原尺寸版、一個 960px 的手機版。
// 用法：npm run img   （需要 ffmpeg，跟截圖用的是同一支）
//
// 原始的 .jpg 一張都不會動，webp 只是多出來的一份。
// Cloudflare 的建置環境沒有 ffmpeg，所以這步在本機做完、把 webp 一起 commit。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'img');
const SM = 960; // 手機版寬度：375px 螢幕在 2x 下也還夠用
const Q = 80;

const ff = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
const kb = (p) => Math.round(fs.statSync(p).size / 1024);

/** 從 JPEG 檔頭讀寬度，決定要不要另外做一份小的 */
function width(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length - 9; ) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return b.readUInt16BE(i + 7);
    i += 2 + b.readUInt16BE(i + 2);
  }
  return 0;
}

const jpgs = fs.readdirSync(DIR).filter((f) => f.endsWith('.jpg'));
let before = 0;
let after = 0;

for (const f of jpgs) {
  const src = path.join(DIR, f);
  const base = f.slice(0, -4);
  const full = path.join(DIR, `${base}.webp`);
  const sm = path.join(DIR, `${base}-sm.webp`);

  // 來源沒動過就跳過，重跑很快
  const fresh = (out) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

  if (!fresh(full)) ff(['-i', src, '-c:v', 'libwebp', '-quality', String(Q), '-compression_level', '6', '-preset', 'photo', full]);

  // 原圖本來就比 SM 窄的話，縮出來跟原圖一樣大，build.mjs 也不會用到它
  const wide = width(src) > SM;
  if (wide && !fresh(sm)) {
    ff(['-i', src, '-vf', `scale=${SM}:-2`, '-c:v', 'libwebp', '-quality', String(Q), '-compression_level', '6', '-preset', 'photo', sm]);
  }
  if (!wide && fs.existsSync(sm)) fs.rmSync(sm);

  before += kb(src);
  after += kb(full);
  console.log(`${String(kb(src)).padStart(5)} KB  →  ${String(kb(full)).padStart(5)} KB / ${wide ? String(kb(sm)).padStart(4) + ' KB (sm)' : '   —'}   ${f}`);
}

console.log(`\n✓ ${jpgs.length} 張；原尺寸 webp 合計 ${before} → ${after} KB`);
