# 鷹捷詠春官網 — 工作規則

黃英哲師父的詠春教學網站。靜態網頁，`build.mjs` 產生 `dist/`，Cloudflare Pages 部署。

## 最重要的一條

**網站上的文字，一律取自師父自己寫過的話，或舊站原文。不要自己編行銷文案。**

- 師父的原稿在 `content/原稿/`（LINE / FB 貼文，不會出現在網站上）
- 舊站是 `nccu-wing-chun.weebly.com`，「拳理即生理」「哪些才是真功夫？」「最有效的防禦就是攻擊」這類句子都出自那裡
- 需要標題或摘要時，去原稿裡挑一句原句，不要改寫成通順的廣告句
- 不要補他沒說過的事實（器械名稱、入門門檻、費用細節都不要自己加）

## 新增一篇手記

1. 把原稿 txt 放進 `content/原稿/`
2. 在 `content/articles/` 建 `YYYY-MM-DD-英文代號.md`

```markdown
---
slug: fang-xia
title: 放下
date: 2026-08-15
added: 2026-08-24     # 選填，舊文現在才放上網站時填今天，「新」徽章才會亮
image: spar-wide.jpg
tags: 心法、功體
excerpt: 卡片上顯示的摘要，用師父的原句
quote: 文章開頭大字引言，也用原句
series: 接與不接      # 選填，系列文章才要
part: 2               # 選填，系列裡的第幾篇
figure: sketch.jpg    # 選填，要整張完整顯示在正文前的插圖（例如師父手繪），hero 會裁圖時用
figureAlt: 圖片的替代文字
figureCap: 圖下方的小字說明   # 選填
ogImage: sketch-og.jpg  # 選填，分享用的 1200×630 橫版；沒填就用 figure，再沒有就用 image
video: fu-tan-bang.mp4        # 選填，assets/video/ 裡的自架 mp4（h264 + aac），顯示在正文前
videoSub: fu-tan-bang.vtt     # 選填，同目錄的 WebVTT 字幕，會預設開啟
videoW: 1280                  # 影片像素寬，有 video: 就一定要填
videoH: 720                   # 影片像素高
videoDur: 81                  # 選填，長度（秒）
videoDate: 2023-09-13         # 選填，影片原本在 FB 上傳的日期，沒填就用 date
videoSrc: https://www.facebook.com/...   # 選填，原片連結，圖說會出「在 Facebook 觀看原片」
videoLoop: zhong-loop.mp4     # 選填，hero 背景用的循環片（`npm run loop` 剪的）
videoCap: 圖下方的小字說明    # 選填
---
第一段第一行
第一段第二行

第二段…

### 小標題
小標題下的內容

#文末的隨手註記
#會用小字另外呈現
```

`tags:` 固定五種：套路、功體、接手、心法、隨筆，頓號分隔，可複選。會出現在手記列表頁的篩選列，也會顯示在卡片與文章頁上。標籤打錯字或不在這五種裡，建置時會警告。

排版規則（照師父原稿的呼吸來）：

| 寫法 | 結果 |
| --- | --- |
| 空一行 | 換段 |
| 段落內換行 | 硬斷行，維持句子節奏 |
| 連續兩個以上空白 | 師父的停頓，轉成視覺間隔 |
| `### 開頭` | 朱紅小標題 |
| `#` 開頭且整段都是 | 文末註記，小字灰色 |

**原文一個字都不要改。** 只能調整換行與分段。真的太長需要斷句時，依語意斷，不要改字。

## 排版是怎麼運作的

`build.mjs` 在建置時做這些事，所以新文章會自動套用：

### 斷行

原稿用連續空白當標點。`packLines()` 在那些停頓處斷行，再把短句貪婪合併到 **`MAX_W` = 18 個字寬**（全形算 1、半形算 0.5）。

這個數字是算出來的：手機 375px 扣掉左右內距剩 335px，內文字級 17px，容量 19.7 個字寬。行寬控制在 18 以內，**手機版就完全不會折行** —— 句子不會從中間斷掉，每行首字自然對齊。

如果某句連續空白切完仍超過 18，會退而用單一空白切，再不行才用標點切。都不行的話（沒有空白也沒有標點的長句），要**手動在原稿的 md 裡依語意加換行**。

### 不可斷行的詞組

為了避免尾行只剩一兩個字，長標題與段落會被切成 `<span class="nb">` 子句，斷行只能發生在標點或停頓之後。

**`NB_MAX` = 15 個字寬是上限**，超過就不包 —— 包了會在手機上撐破畫面（曾經踩過這個坑）。建置時會掃過所有輸出，發現過寬的詞組就警告。

### 標點正規化

`typo()` 會處理，不用在原稿裡先改：

- `?` `!` 轉全形；貼著中文的 `,` `;` `:` `(` `)` 也轉，`08:15` 這種時間不動
- 中文與英數之間補半形空格：`2D 的狀態`、`大概 3.5 年`、`15 年了`
- 刪掉師父手機打字留下的**單獨句點**
- 連續的點一律改成**六個半形點**（半形的點落在基線上，位置偏下；全形的 `…` 在中文字型裡是垂直置中的，不是師父要的樣子）
- 超過五個的驚嘆號保留原樣（轉全形會變兩倍寬塞不下）

### 孤字

- 全站 `text-wrap: pretty` / 標題 `balance`
- 舊版 iOS Safari 沒有 `text-wrap`，靠上面的 `.nb` 子句當保險
- 停頓間隔一定收在前一個詞組**裡面**，斷行時才不會把內距留在行首

## 配圖

`assets/img/` 的圖是從 `照片/` 與 `影片/` 處理過的。文章的 `image:` 填檔名就好，會自動當成大圖背景（壓半透明黑、字疊上去）。

**要注意裁切位置。** hero 又寬又矮，`cover` 會從上下裁掉不少，人的頭很容易被切掉。文章可以用 `pos:` 逐篇指定（預設 `center 22%`）：

```markdown
image: class-line.jpg
pos: center 15%
```

數字越小＝顯示越靠照片上方。

`pos:` 只管文章頁的 hero。列表上的卡片是另一個形狀（手機上約 371×300，接近方形），同一張圖裁出來的範圍不一樣，所以卡片有自己的 `posCard:`（預設 `center 38%`）：

```markdown
image: dummy-train.jpg
pos: center 25%        # 文章頁的大圖
posCard: center 19%    # 卡片，直式照片在這裡要再往上一點才不會切到頭
```

要一次檢查全部文章的裁切結果，可以用同樣的幾何算出縮圖再拼成一張看：

```bash
# hero 在 1920 寬時高約 498px；把圖縮到 1920 寬再依 pos 裁出那一段
ffmpeg -i assets/img/X.jpg -vf "scale=1920:H1,crop=1920:498:0:Y" out.jpg
```

## 師父手繪的圖（固定做法）

**一般照片不做特殊設計。師父自己畫的圖，每一張都走這套裱框設計**（2026-09-10 起，
第一張是〈詠春打鬥的四個階段〉的 `four-stages`）。要讓人覺得有質感、想收藏：

1. **裁邊**：把桌面、切割墊、黑邊裁掉，只留紙。`ffmpeg -i 原圖.jpg -vf "crop=W:H:X:Y" tools/sketch-crop.jpg`
   （這個裁好的檔不進 git）。畫的內容一筆都不動，只能裁與微調亮度。
2. **裱框**：`tools/sketch-mount.html` 是版型 —— 暖紙底、細框加浮起陰影、
   左下角二字箝羊馬剪影當記號、右下角「鷹捷詠春」朱印（2×2，右欄鷹捷、左欄詠春）、
   中間題款一行。依裁後的長寬比改 `.ph` 的高度與 `.band` 的 top，用 Edge 無頭模式渲染成
   1600×2000 的 png（指令在檔案開頭）。
3. **題款只能用師父的字**：標題用文章標題、落款「黃英哲　手繪」，不要自己加句子。
4. **兩個檔一起放進 `assets/img/`**：`X.png`（原檔，給人收藏）與 `X.jpg`（頁面顯示用，
   PIL quality 92）。有同名 png 的 jpg，`npm run img` 不會出 webp，讀者長按存圖拿到的是 jpg。
5. **另外做一張素圖給 hero 與卡片**：`X-sketch.jpg`，只裁邊、不裱框。
   手機上 hero 幾乎會露出整張圖，用裱框版的話題款會透到標題後面。
6. 文章 frontmatter：`image: X-sketch.jpg`（hero、卡片）、`figure: X.jpg`（正文前完整顯示，
   點圖與「原圖 PNG」連到 png，分享的 OG 圖也用它）、`figureAlt:` 寫清楚畫了什麼、`figureCap: 黃英哲　手繪`。
7. **分享圖另做橫版**：手繪不能裁，直式圖丟給 FB / LINE 會只剩中間一段。用 `tools/sketch-og.html`
   渲染 1200×630 的 `X-og.jpg`（整張手繪原樣放左邊，右邊標題、剪影、印章），frontmatter 填 `ogImage: X-og.jpg`。
   一般照片沒有這個問題，OG 直接用 `image:` 那張，由平台自己裁。
8. 驗證時用 Edge 無頭模式在真實視窗尺寸截圖（1280×720 與 390×844），看手機版 hero 有沒有鬼影、
   圖說有沒有斷行。

首頁 hero 是直式照片，另外準備了橫幅裁切版給桌機（`imgTall` 參數在窄畫面切換回直式原圖）。

沒有合適照片時才畫的示意圖（第一張是〈九宮縱橫〉的 `nine-palaces`），版型放 `tools/`，
渲染指令寫在檔案開頭。這種圖**不是師父手繪，所以不裱框、不落款、不放 `figure:`**，
就只當 `image:` 的暗底背景用，圖上不寫任何字，站上也就不會多出師父沒說過的說法。

從影片截圖：

```bash
ffmpeg -ss 52 -i "影片/檔名.mp4" -frames:v 1 -q:v 3 assets/img/新檔名.jpg
```

`-ss 52` 是第 52 秒。影片側躺的話加 `-vf "transpose=2"`。照片縮到 1920 寬：`-vf "scale=1920:-2"`。

## 授課內容

課程頁與首頁共用 `build.mjs` 裡的 `SYLLABUS`。五個項目的標題與說明出自舊站；每一項可以再掛一段師父手記的原文與連結：

```js
{
  n: '一', t: '套路教學', d: '小念頭、尋橋、標指、木人樁', img: 'dummy.jpg',
  note: '手記裡對應的原文（保留原稿的空白停頓）',
  ref: { slug: '文章代號', title: '文章標題' },
}
```

有 `note` 的項目，課程頁會多一段引文與「師父手記〈…〉」的連結；首頁只顯示標題與說明。

**手記裡沒提到的項目就不要硬湊。**

## 手記裡的影片

師父 FB 上的示範影片，轉成自架的 mp4 放 `assets/video/`（不走 FB 內嵌，讀者不必登入、
也不會被追蹤），文章 frontmatter 填 `video:` 那組欄位，影片就出現在正文前、插圖之前。
`figure:` 與 `video:` 可以同一篇並存（先影片，後插圖）。

```bash
# FB 下載的檔多半已經是 h264+aac，要轉再轉；順便把寬高印出來填 videoW / videoH
ffmpeg -i 原片.mp4 -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart assets/video/X.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration assets/video/X.mp4
```

- **`-movflags +faststart` 不要漏**，不然瀏覽器要下載完整支才能開始播。
- **`videoW` / `videoH` 一定要填**：CSS 用它算 `aspect-ratio`，播放器載入前就佔好位置，
  版面不會跳。沒填建置會警告。
- poster 一律用文章的 `image:`（hero 那張），不另外開欄位。
- 字幕是 WebVTT（`X.vtt`，UTF-8），`videoSub:` 填檔名，`<track default>` 會讓它預設開啟。
- 直式影片不會撐滿 760px：CSS 依比例把寬度收到「高度不超過 80vh」，橫式維持 760px。
- 影片跟 mp4 都會被 `VideoObject` 結構化資料與 `og:video` 帶出去，網址與時間直接從欄位來。
- 有影片的文章，手記列表的卡片會多一個朱色「影片」小標記。
- 有影片的文章，頁尾的「上一部／下一部」只在有影片的文章之間走（讀者多半從 `/videos/` 進來）；
  純文字手記維持依日期的上一篇／下一篇。
- `npm run img` 不管影片，影片不需要另外產格式，但檔案會進 git，先壓到合理大小再放。
- **Cloudflare Pages 的靜態檔不支援 Range 請求**，影片會不能拖時間軸、不能快轉（2026-09-18 上線後才發現）。
  `functions/assets/video/[[path]].js` 是專門補這件事的 Pages Function：接 `/assets/video/*`，
  把檔案切成 206 回去。跟 Git 連動一起部署，不用改儀表板。要本機模擬 Pages 測它，
  用 `npx wrangler pages dev dist --port 8788 --compatibility-date=2026-05-01`（日期不能比本機 runtime 新），
  `npm run dev` 的 serve.mjs 自己就支援 Range，測不出這個問題。
- **`/videos/` 頁是自動生的**：`build.mjs` 的 `pageVideos()` 撈出所有有 `video:` 的文章，
  依日期排成跟手記列表一樣的卡片，點進去看文章頁的影片，不用另外維護名單。
  導覽列的「影片」與首頁「看示範影片」都指這裡。
- 手記列表的篩選列多一顆「影片」，那是**偽標籤**：`card()` 在有 `video:` 的卡片的
  `data-tags` 補上「影片」兩個字，site.js 現成的篩選就能用，`/writings/#tag=影片` 也能分享。
  它**不在 `TAGS` 名單裡，不能寫進 frontmatter 的 `tags:`**（寫了建置會警告）。

### 從 FB 抓片到上字幕（2026-09-18 定下來的流程，第一支是〈伏攤膀不是三個動作〉）

1. **抓片**：`yt-dlp -f "hd/best" --merge-output-format mp4 -o src.mp4 <FB 影片網址>`。
   師父的影片是公開的，不用 cookie。同時 `yt-dlp -J` 把貼文文字存下來（UTF-8），
   那段貼文就是文章正文——跟手記一樣，一個字都不改，只調換行；結尾的 `#鷹捷詠春` 標籤不放。
   `upload_date` 填 `date:` 與 `videoDate:`，今天填 `added:`。
2. **轉檔**：FB 給的多半是 vp9，iOS 不吃，一定要轉 h264。夜拍雜訊多，
   `-crf 27 -b:a 96k` 才壓得到 12MB 左右（crf 23 會到 20MB）。
3. **poster**：從影片抽一張兩人正臉、動作清楚的畫面當 `image:`（`ffmpeg -vf "select='eq(n\,幀數)'" -vsync vfr`），
   跑 `npm run img`。注意 `npm run img` 偶爾會順手重寫某張舊 webp，commit 前 `git status` 看一下，
   無關的 webp 用 `git checkout` 還原。
4. **逐字稿**：`faster-whisper` 的 `large-v3`，CPU int8 就跑得動（81 秒的片約 2 分鐘）。
   這台 Windows 沒開開發者模式，要先設 `HF_HUB_DISABLE_SYMLINKS=1` 不然模型下載會失敗。
   `initial_prompt` 餵貼文文字加「以下是繁體中文。」，輸出再過 OpenCC `s2twp`。
   拿 `word_timestamps=True` 的逐字時間戳來切字幕。
5. **校對是人做的，不是模型做的**。詠春術語它一定會錯：伏攤膀聽成「反攤輔」「擋攤斧」「攤綁」，
   日字衝拳聽成「日充熊架」，制式聽成「自私」「姿勢」。對不出來的字**問使用者**，
   他能聽原片；不要自己猜一個通順的詞填上去。
   師父念完「伏攤膀」常會再用廣東話念一次，那段不上字幕。
6. **字幕格式**：WebVTT，一個 cue 一行，不超過 16 個全形字，句尾不加標點，
   句中停頓用全形空格（跟手記排版同一個呼吸）。cue 的起訖取逐字時間戳，
   同一句話說兩次就切成兩個 cue。
7. **另外燒一份**：`tools/` 沒有腳本，用 ffmpeg `subtitles=` 濾鏡把 vtt（先轉 ass）燒進畫面，
   出 `X-sub.mp4` 交給使用者重傳 FB / LINE 用。這個檔不進 git。
8. **剪一段循環片**：`npm run loop src.mp4 起秒 迄秒 <slug>`，frontmatter 填
   `videoLoop: <slug>-loop.mp4`，`/videos/` 的 hero 就自動換成這一支（見下一節）。
   **挑接點要看首尾幀**：兩人都在畫面中、姿勢與景框相近，循環回頭才不會跳；
   先 `ffmpeg -ss T -frames:v 1` 抽首尾幀比一比（或用 `psnr` 濾鏡對），不要只看秒數順眼。

### hero 的背景影片

首頁（`/home/`）、課程頁（`/classes/`）與影片頁（`/videos/`）的 hero 照片上面疊一段靜音、
自動循環、沒有控制列的影片。`hero()` 傳 `video: { src, sm }` 就會掛上，影片的
`object-position` 跟著該頁的 `pos` 走（`--vpos`）。照片**全部留著**：它是第一眼、也是備援，
影片載好才淡入蓋上去。`/`（進站頁）沒有影片。

**檔名跟文章綁定**：`assets/video/<slug>-loop.mp4` 與 `<slug>-loop-sm.mp4`。
文章 frontmatter 只填 `videoLoop: <slug>-loop.mp4`，`-sm` 那份由檔名推導（`loopOf()`），
不另開欄位。兩份少一份，建置會警告。

| 檔案 | 規格 | 用在 |
| --- | --- | --- |
| `assets/video/<slug>-loop.mp4` | 1280×720、30fps、crf 28、無音軌、+faststart | 視窗寬 ≥ 768px |
| `assets/video/<slug>-loop-sm.mp4` | 640×360、crf 30 | 視窗寬 < 768px |

目標大小 3MB / 1MB 以內（現在 `fu-tan-bang-loop` 2.3MB / 0.66MB、`zhong-loop` 1.5MB / 0.40MB）。
hero 的壓黑漸層很重，手機版用 640 寬完全看不出來，不要為了畫質把它放大。

哪一頁用哪一支：

- **`/videos/`** 自動取**最新一篇有 `videoLoop:` 的手記**（`pageVideos()`），
  連 hero 照片、`pos:`、OG 圖與 preload 都一起跟著那一篇走。上傳新影片時只要照流程
  放檔案、填 `videoLoop:`，程式不用改。一篇都沒有就退回 `fu-tan-bang.jpg`、不放影片。
- **首頁與課程頁**由 `build.mjs` 最上面的 `HERO_LOOPS = { home: 'fu-tan-bang', classes: 'zhong' }`
  指定，**刻意不自動換** —— 那兩段是比對過首尾幀才挑出來的，新影片未必有同樣適合的段落，
  要人看過再決定。要換就改這個常數。

**`<video>` 的 `src` 故意由 JS 給**（樣板只寫 `data-src` / `data-src-sm`）。
`site.js` 會先擋掉三種情況、直接把整個元素 `remove()`：`prefers-reduced-motion: reduce`、
`navigator.connection.saveData`、`effectiveType` 是 `2g` / `slow-2g`。
其餘才在 `window` 的 `load` 之後（`requestIdleCallback`）設 src，不跟 hero 照片的 preload 搶頻寬；
`play()` 的 promise 一定要 catch，淡入的 `is-on` 只在 `playing` 事件才加：自動播放被擋就維持照片，不會露出影片的靜止首幀。
**沒有 JS 就沒有影片**，只看到照片，這是刻意的。

剪片用 `npm run loop`，不要自己敲 ffmpeg（規格、`-an`、`+faststart` 都在腳本裡）：

```bash
npm run loop <來源.mp4> <起秒> <迄秒> <slug>
npm run loop src.mp4 62.5 75.5 zhong     # → assets/video/zhong-loop.mp4 與 -sm
```

來源是 `yt-dlp` 抓下來的原片（`src.mp4`）。直式來源會自動改以高度為準（`-2:1280` / `-2:640`），
跑完印出兩個檔的大小，超過 3MB / 1MB 會警告。

`fu-tan-bang-loop` 取的是那支夜間橋下示範的 **29.5 – 46.0 秒**、`zhong-loop` 是 **62.5 – 75.5 秒**。
這些起訖都是比對首尾幀挑的 —— 兩人都在畫面中央搭手、姿勢與景框接近，循環接點才不會跳。
換段落時先抽首尾幀比一下（`ffmpeg -ss T -frames:v 1`，再用 `psnr` 濾鏡對一對），
不要只看秒數順眼。

`.hero__vid` 的 `object-position` 桌機是 `center 35%`（跟照片的 `pos:` 一致），
手機改 `center center` —— 手機的照片是直式、影片是橫式，cover 之後上下不裁、左右裁很多，
兩人剛好在正中間。

## 配圖要先跑 `npm run img`

放進 `assets/img/` 的新 jpg，要跑一次：

```bash
npm run img
```

它用 ffmpeg 產生兩份 webp：原尺寸的 `X.webp`，和 960px 的 `X-sm.webp`（手機用）。
jpg 原檔不會被動到，webp 要一起 commit —— Cloudflare 的建置環境沒有 ffmpeg，不能在那邊產。

`build.mjs` 的 `img()` 會包成 `<picture>`，背景圖的 `bg()` 會寫成 `--bg-j / --bg-w / --bg-s`
三個自訂屬性，由 `style.css` 的 `.bgimg` 決定實際用哪一張。忘了跑的話建置會警告，
網站還是能動，只是手機要扛 1920px 的原圖（首頁曾經因此吃掉 1.2MB）。

**`.bgimg` 的基準一定要留 jpg。** 舊版 Safari 認得 `image-set()` 但不認得裡面的 `type()`，
直接寫 image-set 會讓整條宣告失效，背景變全黑。

## 「新」提示

導覽列的「師父手記」旁邊，發新文章後 60 天內會亮一個「新」徽章（漢堡選單也會有個小紅點）。純前端做法：`site.js` 拿 nav 裡 `.newdot` 的 `data-latest`（最新一篇的日期）跟 `localStorage` 記的「使用者看過的日期」比對，看過或超過 60 天就不亮，逛過手記列表頁也算看過。

`data-latest` 比對的是最近一次「放上網站」的日期（`added:`，沒填就等於 `date:`），不是文章寫作日期，所以補登舊文時記得填 `added:`，徽章才會亮。

## 文字連結

全站文字連結**不畫底線**：內文裡的連結用朱色（深底用亮朱 `--seal-l`）標示，滑過或鍵盤聚焦時
才浮出一條離字有距離的細線（`text-underline-offset`），規則在 `style.css` 最前面 `a { … }` 下方那段。
新的文字連結加 `class="lk"` 就套用，不要再用 `border-bottom` 自己畫線（2026-09-18 統一）。
按鈕、卡片、導覽列不在此列，它們有自己的樣式。

## 四季配色

站的三層是「墨．紙．朱」。四季換的只有「印色」（`--seal` / `--seal-l`）與紙的底色微調（`--paper` / `--paper-2`）；墨色、照片上的壓黑漸層、灰字（`--muted` 系）全部不動。

月份對應：3–5 月春・若竹（綠）、6–8 月夏・竹月（靛）、9–11 月秋・柿赭（橙褐）、12–2 月冬・絳朱（同預設朱色系，紙更暖）。

靠 `headAssets()` 最前面那段 inline script，依當月在 `<html>` 設 `data-season`，`style.css` 的 `:root[data-season="..."]` 覆蓋對應變數。沒有 JS 就沒有 `data-season`，退回 `:root` 預設的朱色。網址加 `?season=summer` 這種可以強制預覽任一季。`static/404.html` 走自己的 `<head>`，同一段 script 手動複製了一份，改動時兩邊要一起改。

改季節色時：

- `style.css` 只能動 `--seal` / `--seal-l`（連同對應的 `-rgb` 版本）與 `--paper` / `--paper-2`，其他變數不要碰
- 同步改 `tools/contrast.mjs` 裡的色表，跑一次 `node tools/contrast.mjs`，五組（預設＋四季）的每一對配色都要過門檻，有 ⚠ 就是新色壓不出可讀的對比，不能直接上

## SEO

改文案時順手要顧的幾件事：

| 東西 | 在哪裡 | 注意 |
| --- | --- | --- |
| `<title>` | `layout()` 的 `titleTag` | 每頁都要不一樣。`/` 與 `/home/` 是兩頁，標題重複的話 Google 會判成重複內容 |
| 結構化資料 | `ldSchool` / `ldSifu` / `ldCourse` / `ldFaq` | 上課時間地點改了，`SITE.seo` 要跟著改，不然 Google 拿到的是舊資訊 |
| 常見問題 | `build.mjs` 的 `FAQ` | 答案只能用站上已經有的事實，跟文案規則一樣，不要自己加 |
| sitemap | `build.mjs` 最下面 | `lastmod` 直接取文章日期，不用手動維護 |

`SITE.seo.googleVerify` 填 Search Console 給的驗證碼，就會自動出現在每一頁的 `<head>`。

## 網站基本資料

電話、FB、上課時間地點、網址，都在 `build.mjs` 最上面的 `SITE`。
`SITE.seo` 是同一份資料拆給搜尋引擎看的版本（地址欄位、24 小時制的上課時段、經緯度）。

## 常用指令

```bash
npm run dev     # 建置 + 本機預覽 http://localhost:4321
npm run build   # 只建置到 dist/
npm run img     # assets/img/ 的新 jpg 產 webp
npm run loop    # 剪 hero 背景循環片：npm run loop src.mp4 起 迄 slug
```

改完 push 到 `main`，Cloudflare Pages 會自動重新部署到 https://eagle-wingchun.pages.dev
