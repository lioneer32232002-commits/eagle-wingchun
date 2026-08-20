# 鷹捷詠春 — 黃英哲師父親授

台北文山．萬壽橋下。詠春教學網站，靜態網頁，部署於 Cloudflare Pages。

## 頁面

| 網址 | 內容 |
| --- | --- |
| `/` | 進站頁：三段大圖大字（`build.mjs` 的 `pageIntro`） |
| `/home/` | 完整首頁 |
| `/about/` | 關於師父、師承 |
| `/classes/` | 課程資訊、授課內容 |
| `/writings/` | 師父手記列表 |
| `/writings/<slug>/` | 單篇手記 |

網站上的介紹文字都取自師父原話或舊站（nccu-wing-chun.weebly.com）原文，新增文案時請沿用這個原則。

## 資料夾

```
content/articles/   師父手記（每篇一個 .md，改這裡就能改網站文章）
content/原稿/        LINE / FB 原始文字稿（不會出現在網站上）
assets/img/         網站用圖（從照片與影片截圖處理過）
assets/css|js/      樣式與前端腳本
static/             會原樣複製到網站根目錄（favicon、404、_headers、_redirects）
build.mjs           產生器：把上面的東西編成 dist/
serve.mjs           本機預覽用的小伺服器
dist/               產生出來的網站（不進版控，由 Cloudflare 自己建）
```

## 本機預覽

```bash
npm run dev
```

開 http://localhost:4321 。改完內容後重跑一次即可。

## 新增一篇手記

在 `content/articles/` 新增 `YYYY-MM-DD-英文代號.md`：

```markdown
---
slug: fang-xia
title: 放下
date: 2026-08-15
image: spar-wide.jpg
excerpt: 列表卡片上顯示的一兩句摘要。
quote: 想放大顯示的那一句
---
第一段第一行
第一段第二行

第二段…

### 小標題
小標題下的內容
```

排版規則（照師父原稿的呼吸來）：

- **空一行** = 換段
- **段落內換行** = 軟斷行，維持原本的句子節奏
- **連續兩個以上的空白** = 保留成視覺上的停頓
- `### 開頭` = 朱紅色小標題

`image` 填 `assets/img/` 裡的檔名，會變成文章頁的大圖與列表卡片背景（自動壓半透明黑、字疊在上面）。

## 換圖 / 從影片截圖

影片原檔沒有進版控（太大），放在本機的 `影片/`。要再截圖：

```bash
ffmpeg -ss 52 -i "影片/檔名.mp4" -frames:v 1 -q:v 3 assets/img/新檔名.jpg
```

`-ss 52` 是第 52 秒。如果影片是側躺的，加 `-vf "transpose=2"`。

## 授課內容

課程頁與首頁共用 `build.mjs` 裡的 `SYLLABUS`。每一項可以掛一段師父手記的原文與連結：

```js
{
  n: '一', t: '套路教學', d: '小念頭、尋橋、標指、木人樁', img: 'dummy.jpg',
  note: '手記裡對應的原文（保留原稿的空白停頓）',
  ref: { slug: '文章代號', title: '文章標題' },
}
```

有 `note` 的項目會在課程頁多一段引文與「師父手記〈…〉」的連結；首頁只顯示標題與說明。

## 改網站基本資料

電話、FB、上課時間地點、網址等，都在 `build.mjs` 最上面的 `SITE` 物件。

> 網域確定後，記得把 `SITE.url` 改成正式網址，OG 分享圖與 sitemap 才會指對地方。

## 部署（Cloudflare Pages）

Cloudflare Pages 連到這個 GitHub repo，設定：

| 項目 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |

第一次連接：Cloudflare 後台 → Workers & Pages → Create → Pages → Connect to Git → 選 `eagle-wingchun`。

之後 push 到 `main` 就會自動重新部署。
