// 剪一段 hero 背景用的循環片。
//
//   node tools/video-loop.mjs <來源.mp4> <起秒> <迄秒> <slug> [--crop=W:H:X:Y]
//   npm run loop src.mp4 62.5 75.5 zhong
//   npm run loop src.mp4 62.0 83.0 sifu-form --crop=960:540:130:120
//
// 產出 assets/video/<slug>-loop.mp4（大螢幕）與 <slug>-loop-sm.mp4（手機）。
// 無音軌、+faststart，規格見 CLAUDE.md〈hero 的背景影片〉。
// 挑起訖要看首尾幀像不像（循環接點才不會跳），不是看秒數順眼。
// --crop 在 scale 之前先裁切（W:H:X:Y，同 ffmpeg crop 濾鏡語法），
// 給「人在畫面裡太小」的來源放大用（裁掉四周再等比放大，人自然變大）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'assets', 'video');

const args = process.argv.slice(2);
const cropArg = args.find((a) => a.startsWith('--crop='));
const positional = args.filter((a) => !a.startsWith('--'));
const [src, fromS, toS, slug] = positional;
const crop = cropArg ? cropArg.slice('--crop='.length) : null;
if (!src || !fromS || !toS || !slug) {
  console.error('用法：node tools/video-loop.mjs <來源.mp4> <起秒> <迄秒> <slug> [--crop=W:H:X:Y]');
  process.exit(1);
}
if (crop && !/^\d+:\d+:\d+:\d+$/.test(crop)) {
  console.error(`--crop 格式錯誤，要是 W:H:X:Y（收到 ${crop}）`);
  process.exit(1);
}
const from = Number(fromS);
const to = Number(toS);
if (!(to > from)) {
  console.error(`迄秒要大於起秒（收到 ${fromS} → ${toS}）`);
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`找不到來源：${src}`);
  process.exit(1);
}

// 直式來源不能硬塞成 1280×720，改以高度為準（-2 讓寬度自己算成偶數）
const dim = execFileSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src,
], { encoding: 'utf8' }).trim().split(',').map(Number);
const [w, h] = dim;
const tall = h > w;
const scale = (big) => (tall ? `-2:${big}` : `${big}:${Math.round(big * 9 / 16)}`);
console.log(`來源 ${w}×${h}${tall ? '（直式，以高度為準）' : ''}　取 ${from} – ${to} 秒（${(to - from).toFixed(1)} 秒）`);

fs.mkdirSync(OUT, { recursive: true });

const SHARPEN = 'hqdn3d=1.2:1.2:2.5:2.5,unsharp=5:5:0.7:5:5:0.0';

const run = (big, crf, suffix) => {
  const out = path.join(OUT, `${slug}-loop${suffix}.mp4`);
  const chain = [crop ? `crop=${crop}` : null, `fps=30`, `scale=${scale(big)}:flags=lanczos`, SHARPEN]
    .filter(Boolean).join(',');
  execFileSync('ffmpeg', [
    '-y', '-ss', String(from), '-t', String(to - from), '-i', src,
    '-an', '-vf', chain,
    '-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  return out;
};

const made = [
  { file: run(1280, 26, ''), limit: 3 * 1024 * 1024 },
  { file: run(640, 28, '-sm'), limit: 1024 * 1024 },
];

for (const { file, limit } of made) {
  const size = fs.statSync(file).size;
  const mb = (size / 1024 / 1024).toFixed(2);
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  console.log(`${rel}　${mb} MB`);
  if (size > limit) {
    console.warn(`⚠ ${rel} 超過 ${(limit / 1024 / 1024).toFixed(0)}MB —— 剪短一點，或把 crf 調高`);
  }
}

console.log(`\nfrontmatter 填：videoLoop: ${slug}-loop.mp4`);
