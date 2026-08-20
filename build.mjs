// 鷹捷詠春 — 靜態網站產生器（零相依）
// 用法：node build.mjs   →  輸出到 dist/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ASSET_V = (() => {
  const f = (p) => fs.statSync(path.join(ROOT, p)).mtimeMs;
  return Math.round(Math.max(f('assets/css/style.css'), f('assets/js/site.js'))).toString(36);
})();
const DIST = path.join(ROOT, 'dist');

export const SITE = {
  name: '鷹捷詠春',
  tagline: '黃英哲師父親授',
  url: 'https://eagle-wingchun.pages.dev',
  desc: '鷹捷詠春．黃英哲師父親授。師承葉問—黃淳樑—林海龍一脈，以實用為目的，重視傳統功力訓練。台北文山區萬壽橋下，每週二、五晚間授課。',
  phone: '0987-747-867',
  phoneRaw: '0987747867',
  fb: 'https://www.facebook.com/huang.ying.zhe.322652',
  place: '台北市文山區．萬壽橋下',
  time: '每週二、週五　晚上 08:15 – 10:15',
};

/* ---------- 工具 ---------- */
/* ---------- 中文排版規則 ---------- */

/** 半形標點轉全形、中英數之間補半形空格、刪掉手機打字留下的單獨句點 */
function typo(t) {
  return (
    t
      // 疑問／驚嘆一律全形
      .replace(/\?/g, '？')
      // 五個以內轉全形；再長就是師父的語氣手勢，全形會變兩倍寬塞不下，保留原樣
      .replace(/(?<!!)!{1,5}(?!!)/g, (m) => '！'.repeat(m.length))
      // 逗號、分號、冒號、括號：只有貼著中文時才轉，才不會動到 08:15 這種
      .replace(/(?<=[\u4e00-\u9fff])\s*;\s*/g, '；')
      .replace(/(?<=[\u4e00-\u9fff])\s*,\s*/g, '，')
      .replace(/,\s*(?=[\u4e00-\u9fff])/g, '，')
      .replace(/(?<=[\u4e00-\u9fff])\s*:\s*(?=[\u4e00-\u9fff]|$)/g, '：')
      .replace(/\((?=[^()]*[\u4e00-\u9fff])/g, '（')
      .replace(/(?<=[\u4e00-\u9fff][^()]*)\)/g, '）')
      // 師父在手機上打完常會多一個單獨的句點，刪掉
      .replace(/(?<=[\u4e00-\u9fff！？])\.(?!\.)/g, '')
      // 連續的點是他的語氣停頓，一律六個點；用半形是因為它們落在基線上（偏下），
      // 全形的 … 在中文字型裡是垂直置中的
      .replace(/\.{2,}/g, '......')
      // 全形標點後面不需要空白
      .replace(/([，。！？；：、）」』])[ \u3000](?![ \u3000])/g, '$1')
      // 中文與英數之間補半形空格
      .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, '$1 $2')
      .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, '$1 $2')
  );
}

/** 只處理標籤之間的文字，不動標籤與屬性 */
function typoHtml(html) {
  return html.replace(/>([^<]+)</g, (m, text) => {
    const parts = text.split(/(&[a-zA-Z#0-9]+;)/); // 保護 HTML 實體
    return '>' + parts.map((x, i) => (i % 2 ? x : typo(x))).join('') + '<';
  });
}


const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const write = (rel, html) => {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, rel.endsWith('.html') ? typoHtml(html) : html, 'utf8');
};
const copyDir = (from, to) => fs.cpSync(from, to, { recursive: true });

/**
 * 把句子切成不可斷開的子句：斷行只會發生在標點或原稿的停頓之後，
 * 尾行才不會只剩一兩個字或標點。<br> 與連續空白（師父的停頓）都保留。
 */
const clauses = (t) =>
  t
    .split('<br>')
    .map((part) =>
      part
        .split(/ {2,}|　/)
        .filter(Boolean)
        .map((seg) =>
          seg
            .split(/(?<=[，。！？])/)
            .filter(Boolean)
            .map((c) => `<span class="nb">${c}</span>`)
            .join('')
        )
        // 間隔放在前一個詞組的尾巴，斷行時才不會跑到下一行開頭
        .map((seg, i, all) => (i < all.length - 1 ? seg.replace(/<\/span>$/, '<i class="gap"></i></span>') : seg))
        .join('')
    )
    .join('<br>');

/** 全形算 1、半形算 0.5，用來估一行佔多寬 */
const W = (t) => [...t].reduce((n, c) => n + (c.charCodeAt(0) < 0x2e80 ? 0.5 : 1), 0);
const MAX_W = 18; // 內文一行的上限，手機版剛好不會折行
const SEP = '\u241F'; // 標記停頓位置用，不會出現在文章裡

/** 把停頓處斷開的句子，貪婪合併成不超過 maxW 的行 */
function packLines(text, maxW) {
  const out = [];
  let cur = '';
  text
    .split(/ {2,}/)
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((seg) => {
      if (cur && W(cur) + 1 + W(seg) <= maxW) cur += SEP + seg;
      else {
        if (cur) out.push(cur);
        cur = seg;
      }
    });
  if (cur) out.push(cur);
  return out;
}

/** 一行一個 <br>；停頓間隔收在前一個詞組尾巴，才不會被擠到行首 */
const renderLines = (out) =>
  out
    .map((l) =>
      esc(l)
        .split(SEP)
        .map((seg, i, all) =>
          i < all.length - 1
            ? `<span class="nb">${seg}<i class="gap"></i></span>`
            : `<span class="nb">${seg}</span>`
        )
        .join('')
    )
    .join('<br>');

const rhythm = (text, maxW) => renderLines(packLines(text, maxW));

function renderBlock(block) {
  const lines = block.split('\n').map((l) => l.trimEnd());
  if (lines[0].startsWith('### ')) {
    return `<h3 class="a-h">${esc(lines[0].slice(4))}</h3>` + (lines.length > 1 ? para(lines.slice(1)) : '');
  }
  return para(lines);
}

function para(lines) {
  // 原稿用連續空白當標點。在那些停頓處斷行，短句再合併到接近 MAX_W，
  // 句子不會從中間斷掉，手機版也不會折行，首字自然全部對齊。
  const out = lines.filter(Boolean).flatMap((line) => packLines(line, MAX_W));
  const body = renderLines(out);
  return body ? `<p>${body}</p>` : '';
}

const renderBody = (body) =>
  body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map(renderBlock)
    .join('\n');

/* ---------- 讀文章 ---------- */
function loadArticles() {
  const dir = path.join(ROOT, 'content', 'articles');
  const list = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) throw new Error(`格式錯誤：${f}`);
      const meta = {};
      for (const line of m[1].split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      ['title', 'excerpt', 'quote'].forEach((k) => {
        if (meta[k]) meta[k] = typo(meta[k]);
      });
      // 先做標點與空格正規化，後面算行寬才會準
      return { ...meta, body: typo(m[2].trim()), file: f };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.file < b.file ? 1 : -1));
  return list;
}

const fmtDate = (d) => {
  const [y, m, dd] = d.split('-');
  return `${y}．${m}．${dd}`;
};

/* ---------- 版型 ---------- */
function layout({ title, desc, url, image, body, bodyClass = '', transparentNav = false }) {
  title = typo(title);
  desc = typo(desc);
  const fullTitle = title === SITE.name ? `${SITE.name}｜${SITE.tagline}` : `${title}｜${SITE.name}`;
  const og = SITE.url + (image || '/assets/img/og.jpg');
  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#12100e">
<link rel="canonical" href="${SITE.url}${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="zh_TW">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE.url}${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css?v=${ASSET_V}">
</head>
<body class="${bodyClass}">
${nav(transparentNav)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/js/site.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

const seal = `<svg class="seal" viewBox="0 0 48 48" aria-hidden="true"><rect x="1.5" y="1.5" width="45" height="45" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><text x="25" y="35.6" text-anchor="middle" font-family="'Noto Serif TC',serif" font-weight="700" font-size="31" fill="currentColor">鷹</text></svg>`;

function nav(transparent) {
  const links = [
    ['/home/', '首頁'],
    ['/about/', '關於師父'],
    ['/classes/', '課程'],
    ['/writings/', '師父手記'],
  ];
  return `<a class="skip" href="#main">跳至主要內容</a>
<header class="nav${transparent ? ' nav--over' : ''}">
  <div class="nav__in">
    <a class="brand" href="/home/">${seal}<span class="brand__t"><b>鷹捷詠春</b><i>WING CHUN</i></span></a>
    <button class="burger" aria-label="開啟選單" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <nav id="menu" class="menu">
      ${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join('\n      ')}
      <a class="menu__cta" href="${SITE.fb}" target="_blank" rel="noopener">聯絡師父</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="foot">
  <div class="wrap foot__in">
    <div class="foot__brand">${seal}<div><b>鷹捷詠春</b><span>黃英哲師父親授</span></div></div>
    <div class="foot__cols">
      <div><h4>上課時間</h4><p><span class="nb">每週二、週五</span>　<span class="nb">晚上 08:15 – 10:15</span></p></div>
      <div><h4>上課地點</h4><p><span class="nb">台北市文山區</span>　<span class="nb">萬壽橋下</span></p></div>
      <div><h4>聯絡師父</h4><p><a href="tel:${SITE.phoneRaw}">${SITE.phone}</a><br><a href="${SITE.fb}" target="_blank" rel="noopener">Facebook · 黃英哲</a></p></div>
    </div>
  </div>
  <div class="wrap foot__bar"><span>© ${new Date().getFullYear()} 鷹捷詠春</span><span>師承 葉問 — 黃淳樑 — 林海龍 — 黃英哲</span></div>
</footer>`;
}

/* 共用元件 */
const hero = ({ img, kicker, title, sub, cta = '', tall = false, pos = 'center 40%' }) => `
<section class="hero${tall ? ' hero--tall' : ''}">
  <div class="hero__bg" style="background-image:url('/assets/img/${img}');background-position:${pos}"></div>
  <div class="hero__veil"></div>
  <div class="wrap hero__in">
    ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
    <h1 class="hero__t">${title}</h1>
    ${sub ? `<p class="hero__s">${sub}</p>` : ''}
    ${cta}
  </div>
  <div class="hero__vert" aria-hidden="true">詠春．黃英哲</div>
</section>`;

const card = (a) => `
<a class="card" href="/writings/${a.slug}/">
  <div class="card__bg" style="background-image:url('/assets/img/${a.image}')"></div>
  <div class="card__veil"></div>
  <div class="card__in">
    <p class="card__date">${fmtDate(a.date)}</p>
    <h3 class="card__t">${esc(a.title)}</h3>
    <p class="card__x">${rhythm(a.excerpt, 15)}</p>
    <span class="card__more">閱讀全文</span>
  </div>
</a>`;

/* ---------- 頁面 ---------- */
function pageHome(arts) {
  const feat = arts.slice(0, 3);
  const body = `
${hero({
  img: 'hero-bridge.jpg',
  kicker: '台北 · 文山 · 萬壽橋下',
  title: '鷹捷詠春',
  sub: clauses('黃英哲師父親授　—　以實用為目的，重視傳統功力訓練，<br>授予完整的詠春觀念。'),
  cta: `<div class="btns"><a class="btn btn--solid" href="/classes/">課程資訊</a><a class="btn" href="/writings/">師父手記</a></div>`,
  tall: true,
  pos: 'center 55%',
})}

<section class="band">
  <div class="wrap band__in">
    <p class="band__q">「拳理即生理」</p>
    <p class="band__s">${clauses('練拳是要符合身體的運作。<br>教法著重詠春的基本觀念以及身體上的開發，並根據學生的個性及身材給予不同的調整。')}</p>
  </div>
</section>

<section class="sec">
  <div class="wrap split">
    <div class="split__img"><img src="/assets/img/sifu-form4.jpg" alt="黃英哲師父行拳" loading="lazy" width="1280" height="720"></div>
    <div class="split__txt">
      <p class="kicker kicker--dark">關於師父</p>
      <h2>黃英哲</h2>
      <p>英哲師父師承葉問在香港大弟子講手王 — 黃淳樑的徒弟林海龍。海龍師公與其兄長林文學（Gary Lam）在香港時期共創迪暉詠春搏擊拳館，培養優秀拳手無數。</p>
      <p>師父講解拳理非常細心，綱舉目張，親自手把手帶學生黐手、過手，從中讓學生感受詠春拳簡單又直接的拳理，並時時調整學生的手法及動作。</p>
      <p class="lineage"><span>葉問</span><i></i><span>黃淳樑</span><i></i><span>林海龍</span><i></i><span class="on">黃英哲</span></p>
      <a class="btn btn--ink" href="/about/">更多師承與故事</a>
    </div>
  </div>
</section>

<section class="sec sec--dark">
  <div class="wrap">
    <p class="kicker">師父手記</p>
    <h2 class="sec__t">武道若夢</h2>
    <div class="cards">${feat.map(card).join('')}</div>
    <p class="center"><a class="btn" href="/writings/">閱讀全部手記</a></p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <p class="kicker kicker--dark">課程</p>
    <h2 class="sec__t sec__t--dark"><span class="nb">根據學生的個性及身材</span><br><span class="nb">給予不同的調整</span></h2>
    ${syllabusList()}
    <p class="center"><a class="btn btn--ink" href="/classes/">完整授課內容</a></p>
  </div>
</section>

${ctaBand()}
`;
  return layout({
    title: SITE.name,
    desc: SITE.desc,
    url: '/home/',
    body,
    transparentNav: true,
  });
}

const SYLLABUS = [
  ['一', '套路教學', '小念頭、尋橋、標指、木人樁', 'dummy.jpg'],
  ['二', '手法線位運用', '最有效的防禦就是攻擊', 'chisau-photo.jpg'],
  ['三', '朝型步法運用', '戰場上決不背對敵人', 'team-02.jpg'],
  ['四', '身體結構運用', '身體力學的瞬息萬變', 'gear.jpg'],
  ['五', '刀　棍', '隨機教化', 'knife.jpg'],
];

const syllabusList = () => `
    <ol class="syl">
      ${SYLLABUS.map(
        ([n, t, d]) => `<li><span class="syl__n">${n}</span><b>${t}</b><span class="syl__d">${d}</span></li>`
      ).join('')}
    </ol>`;

const facts = () => `
    <div class="facts">
      <div class="fact"><p class="fact__k">時間</p><p class="fact__v">每週二、週五<em>晚上 08:15 – 10:15</em></p></div>
      <div class="fact"><p class="fact__k">地點</p><p class="fact__v">台北市文山區<em>萬壽橋下</em></p></div>
      <div class="fact"><p class="fact__k">費用</p><p class="fact__v">到現場<em>直接諮詢</em></p></div>
    </div>`;

const ctaBand = () => `
<section class="cta">
  <div class="cta__bg" style="background-image:url('/assets/img/group-night.jpg')"></div>
  <div class="cta__veil"></div>
  <div class="wrap cta__in">
    <h2><span class="nb">真真實實可以保護</span><span class="nb">自己跟家人的技能</span></h2>
    <p>費用到現場直接諮詢。</p>
    <div class="btns">
      <a class="btn btn--solid" href="${SITE.fb}" target="_blank" rel="noopener">Facebook 聯絡師父</a>
      <a class="btn" href="tel:${SITE.phoneRaw}">${SITE.phone}</a>
    </div>
  </div>
</section>`;

/* 進站頁：大圖大字，三段介紹 */
function pageIntro() {
  const scenes = [
    {
      n: '01',
      href: '/about/',
      img: 'hero-bridge.jpg',
      pos: 'center 55%',
      title: '哪些才是真功夫？',
      lines: [
        '師父黃英哲以實用為目的，重視傳統功力訓練，授予完整的詠春觀念。',
        '透過實戰練習，讓功夫不只是神祕的蹲馬步、打套路，而是真真實實可以保護自己跟家人的技能。',
      ],
      more: '關於師父',
    },
    {
      n: '02',
      href: '/classes/',
      img: 'wanshou-bridge.jpg',
      pos: 'center 50%',
      title: '拳理即生理',
      lines: [
        '練拳是要符合身體的運作。',
        '每週二、週五 晚上 08:15–10:15，文山區萬壽橋下。',
        '上課以實戰對練方式進行，讓觀念、功力同時進步。',
      ],
      more: '課程資訊',
    },
    {
      n: '03',
      href: '/writings/',
      img: 'riverside.jpg',
      pos: 'center 50%',
      title: '武道若夢',
      lines: ['這些都是隨意寫寫的  跟自己徒弟說說心情而已......'],
      more: '師父手記',
    },
  ];
  const body = `
<div class="intro">
  <div class="intro__brand">
    ${seal}
    <div><b>鷹捷詠春</b><span>黃英哲師父親授</span></div>
  </div>
  ${scenes
    .map(
      (v) => `<section class="scene">
    <div class="scene__bg" style="background-image:url('/assets/img/${v.img}');background-position:${v.pos}"></div>
    <div class="scene__veil"></div>
    <div class="scene__in">
      <p class="scene__n"><i></i>${v.n}</p>
      <h2 class="scene__t">${v.title}</h2>
      <div class="scene__x">${v.lines.map((t) => `<p>${clauses(t)}</p>`).join('')}</div>
      <a class="scene__more" href="${v.href}">${v.more} <span>→</span></a>
    </div>
  </section>`
    )
    .join('')}
  <section class="scene scene--end">
    <div class="scene__bg" style="background-image:url('/assets/img/team-01.jpg');background-position:center 55%"></div>
    <div class="scene__veil scene__veil--end"></div>
    <div class="scene__in">
      <p class="kicker">鷹捷詠春</p>
      <h2 class="scene__t">師父黃英哲親授</h2>
      <div class="scene__x"><p>師承　葉問 — 講手王黃淳樑 — 林海龍</p></div>
      <div class="btns">
        <a class="btn btn--solid" href="/home/">進入網站</a>
        <a class="btn" href="${SITE.fb}" target="_blank" rel="noopener">聯絡師父</a>
      </div>
    </div>
  </section>
</div>`;
  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>鷹捷詠春｜黃英哲師父親授</title>
<meta name="description" content="${esc(SITE.desc)}">
<meta name="theme-color" content="#12100e">
<link rel="canonical" href="${SITE.url}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="zh_TW">
<meta property="og:title" content="鷹捷詠春｜黃英哲師父親授">
<meta property="og:description" content="${esc(SITE.desc)}">
<meta property="og:url" content="${SITE.url}/">
<meta property="og:image" content="${SITE.url}/assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="鷹捷詠春｜黃英哲師父親授">
<meta name="twitter:description" content="${esc(SITE.desc)}">
<meta name="twitter:image" content="${SITE.url}/assets/img/og.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css?v=${ASSET_V}">
</head>
<body class="is-gate">
<main id="main">
${body}
</main>
<script src="/assets/js/site.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

function pageAbout() {
  const body = `
${hero({ img: 'sifu-form.jpg', kicker: '關於師父', title: '黃英哲', sub: clauses('師承葉問—黃淳樑—林海龍一脈'), pos: 'center 45%' })}

<section class="sec">
  <div class="wrap prose">
    <p class="lead">詠春（Wing Chun）是一門連重視科學的老外也瘋狂學習的武術，好萊塢明星小勞勃道尼也深深著迷。但是電影葉問之後，網路上這麼多文章，路邊這麼多詠春拳館招牌，哪些才是真功夫？</p>
    <p>鷹捷詠春搏擊，師父黃英哲以實用為目的，重視傳統功力訓練，授予完整的詠春觀念，並且透過實戰練習讓功夫不只是神祕的蹲馬步、打套路，而是真真實實可以保護自己跟家人的技能。</p>
    <p>教法著重詠春的基本觀念以及身體上的開發，並根據學生的個性及身材給予不同的調整。「拳理即生理」，練拳是要符合身體的運作。師父講解拳理非常細心，綱舉目張，親自手把手帶學生黐手、過手，從中讓學生感受詠春拳簡單又直接的拳理，並時時調整學生的手法及動作。</p>
  </div>
</section>

<section class="sec sec--dark">
  <div class="wrap">
    <p class="kicker">師承</p>
    <h2 class="sec__t">一脈相承</h2>
    <ol class="tree">
      <li><b>宗師　葉問</b><span>詠春一代宗師</span></li>
      <li><b>講手王　黃淳樑</b><span>葉問在香港的大弟子</span></li>
      <li><b>師公　林海龍</b><span>與其兄長林文學（Gary Lam）共創香港迪暉詠春搏擊拳館，培養優秀拳手無數；現居台灣。</span></li>
      <li class="on"><b>師父　黃英哲</b><span>鷹捷詠春．台北文山</span></li>
    </ol>
  </div>
</section>

<section class="sec">
  <div class="wrap split split--rev">
    <div class="split__img"><img src="/assets/img/dummy-train.jpg" alt="鷹捷詠春拳館內打木人樁" loading="lazy" width="1080" height="1920"></div>
    <div class="split__txt">
      <p class="kicker kicker--dark">教學</p>
      <h2>教拳其實是教育工作</h2>
      <p>跟做事業不太一樣。當然它也算一個事業，可是跟商業市場上不一樣，它跟人的身心靈連結得更緊密。</p>
      <p>學生來來去去，都視為緣分的聚合。當了師傅，其實正是學習的開始，後面的路還長得不得了。</p>
      <a class="btn btn--ink" href="/writings/">讀師父的手記</a>
    </div>
  </div>
</section>

${ctaBand()}
`;
  return layout({ title: '關於師父', desc: '鷹捷詠春黃英哲師父，師承葉問—黃淳樑—林海龍一脈，以實用為目的，重視傳統功力訓練，授予完整的詠春觀念。', url: '/about/', image: '/assets/img/sifu-form.jpg', body });
}

function pageClasses() {
  const items = SYLLABUS;
  const body = `
${hero({ img: 'team-01.jpg', kicker: '課程', title: '<span class="nb">每週二、五</span>　<span class="nb">橋下見</span>', sub: clauses('上課以實戰對練方式進行，讓觀念、功力同時進步。'), pos: 'center 55%' })}

<section class="sec">
  <div class="wrap">
    ${facts()}
  </div>
</section>

<section class="sec sec--paper2">
  <div class="wrap">
    <p class="kicker kicker--dark">授課內容</p>
    <h2 class="sec__t sec__t--dark"><span class="nb">套路、</span><span class="nb">手法、</span><span class="nb">步法、</span><span class="nb">結構、</span><span class="nb">刀棍</span></h2>
    <div class="course">
      ${items
        .map(
          ([n, t, d, img]) => `<article class="course__i">
        <div class="course__bg" style="background-image:url('/assets/img/${img}')"></div>
        <div class="course__veil"></div>
        <div class="course__in"><span class="course__n">${n}</span><h3>${t}</h3><p>${d}</p></div>
      </article>`
        )
        .join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap prose">
    <h2>上課方式</h2>
    <p class="lead">教法著重詠春的基本觀念以及身體上的開發，並根據學生的個性及身材給予不同的調整。</p>
    <p>上課以實戰對練方式進行，讓觀念、功力同時進步，強調實用、意志及體能。</p>
    <p>${clauses('師父黃英哲以實用為目的，重視傳統功力訓練，授予完整的詠春觀念，並且透過實戰練習讓功夫不只是神祕的蹲馬步、打套路，而是真真實實可以保護自己跟家人的技能！')}</p>
    <p>費用到現場直接諮詢。</p>
  </div>
</section>

${ctaBand()}
`;
  return layout({ title: '課程資訊', desc: '鷹捷詠春課程：每週二、五晚間 20:15–22:15，台北市文山區萬壽橋下。套路教學、手法線位、朝型步法、身體結構、刀棍隨機教化。', url: '/classes/', image: '/assets/img/team-01.jpg', body });
}

function pageWritings(arts) {
  const body = `
${hero({ img: 'bridge-empty.jpg', kicker: '師父手記', title: '武道若夢', sub: clauses('這些都是隨意寫寫的  跟自己徒弟說說心情而已......'), pos: 'center 55%' })}
<section class="sec sec--paper2">
  <div class="wrap">
    <div class="cards cards--list">${arts.map(card).join('')}</div>
  </div>
</section>
${ctaBand()}
`;
  return layout({ title: '師父手記', desc: '黃英哲師父的練功隨筆與教學心得：三合印、信心、放下、三種放鬆、標指與鞭法。', url: '/writings/', image: '/assets/img/bridge-empty.jpg', body });
}

function pageArticle(a, prev, next) {
  const body = `
<article class="art">
  <header class="art__hero">
    <div class="art__bg" style="background-image:url('/assets/img/${a.image}')"></div>
    <div class="art__veil"></div>
    <div class="wrap art__head">
      <p class="kicker"><a href="/writings/">師父手記</a></p>
      <h1>${esc(a.title)}</h1>
      <p class="art__date"><time datetime="${a.date}">${fmtDate(a.date)}</time></p>
    </div>
  </header>
  ${a.quote ? `<blockquote class="pull"><p>${rhythm(a.quote, 16)}</p></blockquote>` : ''}
  <div class="wrap art__body">
    ${renderBody(a.body)}
    <p class="art__sig">— 黃英哲</p>
  </div>
  <nav class="wrap art__nav">
    ${prev ? `<a class="art__nav-i" href="/writings/${prev.slug}/"><span>上一篇</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
    ${next ? `<a class="art__nav-i art__nav-i--r" href="/writings/${next.slug}/"><span>下一篇</span><b>${esc(next.title)}</b></a>` : '<span></span>'}
  </nav>
</article>
${ctaBand()}
`;
  return layout({
    title: a.title,
    desc: a.excerpt,
    url: `/writings/${a.slug}/`,
    image: `/assets/img/${a.image}`,
    body,
  });
}

/* ---------- 執行 ---------- */
const arts = loadArticles();
rm(DIST);
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(ROOT, 'static'), DIST);

write('index.html', pageIntro());
write('home/index.html', pageHome(arts));
write('about/index.html', pageAbout());
write('classes/index.html', pageClasses());
write('writings/index.html', pageWritings(arts));
arts.forEach((a, i) => write(`writings/${a.slug}/index.html`, pageArticle(a, arts[i + 1], arts[i - 1])));

// sitemap
const urls = ['/', '/home/', '/about/', '/classes/', '/writings/', ...arts.map((a) => `/writings/${a.slug}/`)];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}
</urlset>`
);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`✓ 已建置 ${urls.length} 個頁面 → dist/`);
