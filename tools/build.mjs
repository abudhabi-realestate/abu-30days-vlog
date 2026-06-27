#!/usr/bin/env node
/** One-shot: convert series markdown → static HTML articles */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, '..', 'articles');
const workspace = path.resolve(root, '..', '..');

const episodes = [
  { day: 1, file: '0622/Day1-阿布扎比区域地图全览.md', tag: 'MAP', title: 'Day 1｜阿布扎比买房，先认地图：一张图搞懂所有核心区域' },
  { day: 2, file: '0622/Day2-阿布扎比vs迪拜对比.md', tag: 'VS', title: 'Day 2｜阿布扎比 vs 迪拜：为什么已经在看迪拜，还要看阿布？' },
  { day: 3, file: '0623/Day3-谁在买阿布房产.md', tag: 'WHO', title: 'Day 3｜谁在买阿布房产？本地 vs 国际，期房占 7 成说明什么' },
  { day: 4, file: '0625/Day4-阿布扎比的三张底牌.md', tag: 'EDGE', title: 'Day 4｜阿布扎比的「底牌」：主权基金、零税、外交政策' },
  { day: 5, file: '0626/Day5-人口多房为何还紧.md', tag: 'SUPPLY', title: 'Day 5｜人口比迪拜还多 20%——为什么房产反而更「紧」？' },
  { day: 6, file: '0627/Day6-阿布核心三岛总览.md', tag: 'ISLANDS', title: 'Day 6｜阿布核心三岛总览：72% 的成交发生在这里' },
];

function extractMeta(md, fallbackTitle) {
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = fallbackTitle || (titleMatch ? titleMatch[1].trim() : 'Untitled');
  let body = md;
  const bodyStart = md.indexOf('## 正文');
  if (bodyStart >= 0) {
    body = md.slice(bodyStart + '## 正文'.length);
  }
  body = body.replace(/^---[\s\S]*?(?=\n###|\n####|\n[^#\s-])/m, '').trim();
  const cutMarkers = ['### 【发布备注】', '### 【结尾引导】', '## 图片', '## 发布', '## 小红书', '### 【系列内部备注'];
  for (const m of cutMarkers) {
    const i = body.indexOf(m);
    if (i > 0) body = body.slice(0, i);
  }
  const teaser = body
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^[-*>\s\d.]+/gm, '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 20) || title;
  return { title, body: body.trim(), teaser: teaser.slice(0, 120) };
}

function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inList = false;
  let listType = 'ul';

  const closeList = () => {
    if (inList) {
      out.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
  };

  for (let raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      closeList();
      out.push('<hr />');
      continue;
    }
    const h4 = line.match(/^####\s+(.+)/);
    if (h4) {
      closeList();
      out.push(`<h4>${inline(h4[1])}</h4>`);
      continue;
    }
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      closeList();
      out.push(`<h3>${inline(h3[1])}</h3>`);
      continue;
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      closeList();
      out.push(`<h2>${inline(h2[1])}</h2>`);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.+)/);
    if (ul) {
      if (!inList || listType !== 'ul') {
        closeList();
        out.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.+)/);
    if (ol) {
      if (!inList || listType !== 'ol') {
        closeList();
        out.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    const bq = line.match(/^>\s*(.*)/);
    if (bq) {
      closeList();
      out.push(`<blockquote>${inline(bq[1])}</blockquote>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line.trim())}</p>`);
  }
  closeList();
  return out.join('\n');
}

function articleHtml(ep, meta, html) {
  const prev = ep.day > 1 ? `day-${ep.day - 1}.html` : null;
  const next = ep.day < 6 ? `day-${ep.day + 1}.html` : null;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title} · 阿布房产30天</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <div class="site-brand-bar">
    <div class="site-brand-inner">
      <a href="../index.html" class="site-name">WilliamXing · Vlog</a>
      <span class="ep-badge">Day ${ep.day}/30</span>
    </div>
  </div>
  <article class="wrap article">
    <header class="article-head">
      <a class="back" href="../index.html">← 系列目录</a>
      <h1>${meta.title.replace(/</g, '&lt;')}</h1>
      <p class="meta">阿布房产30天 · Day ${ep.day} · ADREC 2025 数据系列</p>
    </header>
    <div class="prose">${html}</div>
    <nav class="ep-nav">
      ${prev ? `<a href="${prev}">← Day ${ep.day - 1}</a>` : '<span></span>'}
      ${next ? `<a href="${next}">Day ${ep.day + 1} →</a>` : '<span></span>'}
    </nav>
  </article>
</body>
</html>`;
}

fs.mkdirSync(outDir, { recursive: true });
const catalog = [];

for (const ep of episodes) {
  const src = path.join(workspace, ep.file);
  const md = fs.readFileSync(src, 'utf8');
  const meta = extractMeta(md, ep.title);
  const html = mdToHtml(meta.body);
  fs.writeFileSync(path.join(outDir, `day-${ep.day}.html`), articleHtml(ep, meta, html), 'utf8');
  catalog.push({ ...ep, ...meta });
  console.log('built day-' + ep.day);
}

fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
console.log('catalog.json written');
