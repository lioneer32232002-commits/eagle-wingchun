// 示範片轉檔工具（站上用版本＋字幕燒錄版）。
//
//   node tools/video-encode.mjs <來源.mp4> <slug> [選項]
//   npm run encode -- src.mp4 zhong --sub
//
// 輸出 assets/video/<slug>.mp4（站上用，浮水印固定壓）。
//
// 選項：
//   --h=720|540     輸出 1280×720 或 960×540（預設 720），scale flags=lanczos
//   --crf=N         預設 25
//   --t=秒          只取前 N 秒；有給的話最後 1 秒加 afade=t=out
//   --old           舊錄音／低解析來源：降噪加重、銳化減輕
//                   （預設 hqdn3d=1.2:1.2:2.5:2.5,unsharp=5:5:0.7:5:5:0.0；
//                    --old 用 hqdn3d=3:3:5:5,unsharp=5:5:0.5:5:5:0.0）
//   --sub           另外燒一份 <slug>-sub.mp4（1280×720、crf 22、音訊 128k，
//                   燒 assets/video/<slug>.vtt 進畫面），不進 assets、不進 git
//   --outdir=PATH   --sub 輸出的資料夾，預設系統暫存目錄下的 eagle-wingchun-sub-out
//   --font=NAME     字幕燒錄字型，預設「Noto Serif TC」；libass 吃不到變體字型時
//                   可以退回 "Microsoft JhengHei"
//
// 固定：libx264 preset slow、profile high、yuv420p、aac 112k、+faststart。
// 浮水印 tools/watermark.png，右上角距邊 24px（overlay=W-w-24:24）；
// 540p 輸出時浮水印先縮到 54×54、距邊 18px。兩種輸出都壓浮水印。
// 做完印檔案大小，站上版超過 20MB 印警告。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'assets', 'video');
const WATERMARK = path.join(ROOT, 'tools', 'watermark.png');

const SHARPEN_DEFAULT = 'hqdn3d=1.2:1.2:2.5:2.5,unsharp=5:5:0.7:5:5:0.0';
const SHARPEN_OLD = 'hqdn3d=3:3:5:5,unsharp=5:5:0.5:5:5:0.0';

const ASS_STYLE =
  'Style: Default,{{FONT}},46,&H00EAF2F5,&H000000FF,&H000F1416,&H80000000,-1,0,0,0,100,100,0,0,1,2.5,1,2,20,20,44,1';

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq === -1) flags[a.slice(2)] = true;
      else flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

const { flags, positional } = parseArgs(process.argv.slice(2));
const [src, slug] = positional;

if (!src || !slug) {
  console.error('用法：node tools/video-encode.mjs <來源.mp4> <slug> [--h=720|540] [--crf=N] [--t=秒] [--old] [--sub] [--sub-only] [--outdir=PATH] [--font=NAME]');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`找不到來源：${src}`);
  process.exit(1);
}
if (!fs.existsSync(WATERMARK)) {
  console.error(`找不到浮水印：${WATERMARK}（先跑 python tools/watermark.py）`);
  process.exit(1);
}

const H = flags.h ? Number(flags.h) : 720;
if (H !== 720 && H !== 540) {
  console.error(`--h 只能是 720 或 540（收到 ${flags.h}）`);
  process.exit(1);
}
const W = H === 720 ? 1280 : 960;
const CRF = flags.crf ? Number(flags.crf) : 25;
const T = flags.t ? Number(flags.t) : null;
const SHARPEN = flags.old ? SHARPEN_OLD : SHARPEN_DEFAULT;
const FONT = flags.font || 'Noto Serif TC Static';
const OUTDIR = flags.outdir
  ? path.resolve(flags.outdir)
  : path.join(os.tmpdir(), 'eagle-wingchun-sub-out');

fs.mkdirSync(OUT, { recursive: true });

function printSize(file, warnLimitMB) {
  const size = fs.statSync(file).size;
  const mb = size / 1024 / 1024;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  console.log(`${rel}　${mb.toFixed(2)} MB`);
  if (warnLimitMB && mb > warnLimitMB) {
    console.warn(`⚠ ${rel} 超過 ${warnLimitMB}MB`);
  }
  return size;
}

// ---- 站上用版本 ----
function encodeMain() {
  const out = path.join(OUT, `${slug}.mp4`);
  const wmOverlay =
    H === 540
      ? `[1:v]scale=54:54[wm];[v0][wm]overlay=W-w-18:18[v]`
      : `[v0][1:v]overlay=W-w-24:24[v]`;
  const filterComplex = `[0:v]scale=${W}:${H}:flags=lanczos,${SHARPEN}[v0];${wmOverlay}`;

  const args = ['-y', '-i', src, '-i', WATERMARK, '-filter_complex', filterComplex, '-map', '[v]', '-map', '0:a'];
  if (T) {
    args.push('-af', `afade=t=out:st=${Math.max(0, T - 1)}:d=1`);
    args.push('-t', String(T));
  }
  args.push(
    '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', String(CRF),
    '-c:a', 'aac', '-b:a', '112k',
    '-movflags', '+faststart',
    out,
  );
  console.log(`\n[main] ${slug}.mp4（${W}×${H}, crf ${CRF}${T ? `, 前 ${T} 秒` : ''}${flags.old ? ', --old' : ''}）`);
  execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  printSize(out, 20);
  return out;
}

// ---- 字幕燒錄版（給使用者重傳 FB / LINE） ----
function vttToAss(vttPath, assPath) {
  execFileSync('ffmpeg', ['-y', '-i', vttPath, assPath], { stdio: ['ignore', 'ignore', 'inherit'] });
  let text = fs.readFileSync(assPath, 'utf8');
  text = text.replace(/^PlayResX:.*$/m, 'PlayResX: 1280');
  text = text.replace(/^PlayResY:.*$/m, 'PlayResY: 720');
  text = text.replace(/^Style: Default,.*$/m, ASS_STYLE.replace('{{FONT}}', FONT));
  fs.writeFileSync(assPath, text, 'utf8');
}

function encodeSub() {
  const vtt = path.join(OUT, `${slug}.vtt`);
  if (!fs.existsSync(vtt)) {
    console.error(`找不到字幕：${vtt}（--sub 需要先有 assets/video/${slug}.vtt）`);
    process.exit(1);
  }
  fs.mkdirSync(OUTDIR, { recursive: true });
  const assPath = path.join(OUTDIR, `${slug}.ass`);
  vttToAss(vtt, assPath);

  const srcAbs = path.resolve(src);
  const out = path.join(OUTDIR, `${slug}-sub.mp4`);
  // 靜態 Bold 字型（tools/make-font.py 產的）複製到輸出目錄，用 fontsdir=. 給 libass；
  // 系統的可變字型 libass 只抓得到 ExtraLight
  const fontSrc = path.join(ROOT, 'tools/fonts/NotoSerifTC-Bold.ttf');
  if (!fs.existsSync(fontSrc)) console.warn('⚠ 找不到 tools/fonts/NotoSerifTC-Bold.ttf，先跑 python tools/make-font.py，否則字會很細');
  else fs.copyFileSync(fontSrc, path.join(OUTDIR, 'NotoSerifTC-Bold.ttf'));
  const filterComplex = `[0:v]scale=1280:720:flags=lanczos,${SHARPEN},subtitles=${slug}.ass:fontsdir=.[v0];[v0][1:v]overlay=W-w-24:24[v]`;

  const args = ['-y', '-i', srcAbs, '-i', WATERMARK, '-filter_complex', filterComplex, '-map', '[v]', '-map', '0:a'];
  if (T) {
    args.push('-af', `afade=t=out:st=${Math.max(0, T - 1)}:d=1`);
    args.push('-t', String(T));
  }
  args.push(
    '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '22',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    out,
  );
  console.log(`\n[sub] ${slug}-sub.mp4（1280×720, crf 22, 字型 ${FONT}${T ? `, 前 ${T} 秒` : ''}${flags.old ? ', --old' : ''}）`);
  // 燒字幕的 subtitles= 濾鏡在 Windows 上對磁碟代號的冒號很敏感，
  // 先切到 ass 所在目錄、用相對檔名，繞開路徑跳脫問題。
  const cwd = process.cwd();
  process.chdir(OUTDIR);
  try {
    execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  } finally {
    process.chdir(cwd);
  }
  printSize(out);
  return out;
}

if (!flags['sub-only']) encodeMain();
if (flags.sub || flags['sub-only']) encodeSub();
