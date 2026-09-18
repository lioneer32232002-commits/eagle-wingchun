// Cloudflare Pages 對靜態檔不支援 Range 請求：拖時間軸時瀏覽器要求「從第 N 個位元組給我」，
// Pages 卻回整支 200，播放器就不能跳、不能快轉。這個 Function 接 /assets/video/* ，
// 自己把檔案切成 206 回去。檔案不大（十幾 MB），整個讀進記憶體再切是可以接受的。
const YEAR = 'public, max-age=31536000, immutable';

async function handle({ request, env }) {
  const url = new URL(request.url);
  const asset = await env.ASSETS.fetch(new Request(url.toString(), { method: 'GET' }));
  if (!asset.ok) return asset;

  const type = asset.headers.get('Content-Type') || 'application/octet-stream';
  const buf = await asset.arrayBuffer();
  const size = buf.byteLength;
  const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': YEAR };

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers: { ...base, 'Content-Length': String(size) } });
  }

  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
  if (!m || (!m[1] && !m[2])) {
    return new Response(buf, { status: 200, headers: { ...base, 'Content-Length': String(size) } });
  }
  let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  let end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${size}` } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
  });
}

export const onRequestGet = handle;
export const onRequestHead = handle;
