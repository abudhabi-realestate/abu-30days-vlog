#!/usr/bin/env node
/** Convert series markdown → reader-facing static HTML (no author / publish notes) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'articles');
const workspace = path.resolve(root, '..', '..');

const episodes = [
  { day: 1, file: '0622/Day1-阿布扎比区域地图全览.md', tag: 'MAP', title: 'Day 1｜阿布扎比买房，先认地图：一张图搞懂所有核心区域' },
  { day: 2, file: '0622/Day2-阿布扎比vs迪拜对比.md', tag: 'VS', title: 'Day 2｜阿布扎比 vs 迪拜：为什么已经在看迪拜，还要看阿布？' },
  { day: 3, file: '0623/Day3-谁在买阿布房产.md', tag: 'WHO', title: 'Day 3｜谁在买阿布房产？本地 vs 国际，期房占 7 成说明什么' },
  { day: 4, file: '0625/Day4-阿布扎比的三张底牌.md', tag: 'EDGE', title: 'Day 4｜阿布扎比的「底牌」：主权基金、零税、外交政策' },
  { day: 5, file: '0626/Day5-人口多房为何还紧.md', tag: 'SUPPLY', title: 'Day 5｜人口比迪拜还多 20%——为什么房产反而更「紧」？' },
  { day: 6, file: '0627/Day6-阿布核心三岛总览.md', tag: 'ISLANDS', title: 'Day 6｜阿布核心三岛总览：72% 的成交发生在这里' },
  { day: 7, file: '0627/Day7-Al Reem岛深聊.md', tag: 'REEM', title: 'Day 7｜Al Reem Island 深聊：配套动线、价位带与选盘逻辑' },
  { day: 8, file: '0627/Day8-Yas岛深聊.md', tag: 'YAS', title: 'Day 8｜Yas Island 深聊：整岛规划、完整社区与公寓别墅怎么选' },
  { day: 9, file: '0627/Day9-Saadiyat岛深聊.md', tag: 'SAADIYAT', title: 'Day 9｜Al Saadiyat Island 深聊：文化顶奢、FDI 配置与三岛价位对照' },
];

const MAX_DAY = episodes.length;

const CUT_SECTIONS = [
  '### 【发布备注】',
  '### 【结尾引导】',
  '### 【封面',
  '### 【口播',
  '### 【系列内部备注',
  '## 小红书发布配置',
];

function extractBody(md) {
  const bodyStart = md.indexOf('## 正文');
  if (bodyStart >= 0) return md.slice(bodyStart + '## 正文'.length);
  return md;
}

function cutAuthorSections(text) {
  let out = text;
  for (const marker of CUT_SECTIONS) {
    const i = out.indexOf(marker);
    if (i >= 0) out = out.slice(0, i);
  }
  return out.trim();
}

function sanitizeForReader(body) {
  const lines = body.split('\n');
  const out = [];

  for (let raw of lines) {
    let line = raw.trimEnd();
    const t = line.trim();

    if (!t) {
      out.push('');
      continue;
    }

    if (/配图建议/.test(t)) continue;
    if (/^>\s*📊/.test(t)) continue;
    if (/^>\s*$/.test(t)) continue;

    if (/^### 【开头/.test(t)) continue;
    if (/^### 【正文结构】/.test(t)) continue;
    if (/^### 【/.test(t)) continue;

    if (/^#{2,6}\s+/.test(t) && /可直接复制/.test(t) && /收尾/.test(t)) {
      out.push('## 总结');
      continue;
    }

    if (/^####\s+/.test(t)) {
      line = t
        .replace(/^####\s+/, '## ')
        .replace(/\s·\s*可直接复制\s*$/, '');
    }

    if (/^#####\s+/.test(t)) {
      line = t.replace(/^#####\s+/, '### ');
    }

    line = line
      .replace(/（非推荐，仅供建立认知）/g, '')
      .replace(/市场上常见的项目类型：/g, '代表项目包括：')
      .replace(/👉\s*\*\*解读：\*\*\s*/g, '')
      .replace(/👉\s*\*\*解读\*\*：\s*/g, '')
      .replace(/👉\s*/g, '');

    if (/^四句话带走：/.test(t)) continue;
    if (/^Day \d+ 只做一件事：/.test(t)) continue;
    if (/^\*\*下一步（Day/i.test(t)) continue;
    if (/Week 2 (先把|后半|进)/.test(t) && /Day [789]/.test(t)) continue;
    if (/欢迎私信聊聊/.test(t)) continue;
    if (/评论区/.test(t)) continue;
    if (/我是迪拜 William/.test(t)) continue;

    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractMeta(md, fallbackTitle) {
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = fallbackTitle || (titleMatch ? titleMatch[1].trim() : 'Untitled');
  let body = sanitizeForReader(cutAuthorSections(extractBody(md)));
  const teaser = body
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/[💬👉📊]/g, '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 24 && !/^[\|>\-`]./.test(l)) || title;
  return { title, body, teaser: teaser.slice(0, 120) };
}

function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function isTableRow(line) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function isTableSep(line) {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTableRow(line) {
  return line.trim().slice(1, -1).split('|').map((c) => c.trim());
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const t = line.trim();

    if (!t) {
      closeList();
      continue;
    }

    if (isTableRow(t)) {
      closeList();
      const rows = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        if (!isTableSep(lines[i].trim())) rows.push(parseTableRow(lines[i]));
        i++;
      }
      i--;
      if (rows.length) {
        out.push('<div class="table-wrap"><table class="data-table">');
        rows.forEach((cells, ri) => {
          const tag = ri === 0 ? 'th' : 'td';
          out.push('<tr>' + cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>');
        });
        out.push('</table></div>');
      }
      continue;
    }

    if (/^```/.test(t)) {
      closeList();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        code.push(lines[i]);
        i++;
      }
      out.push(`<pre class="code-block">${code.join('\n').replace(/</g, '&lt;')}</pre>`);
      continue;
    }

    if (/^---+$/.test(t)) {
      closeList();
      continue;
    }

    const h3 = t.match(/^###\s+(.+)/);
    if (h3) {
      closeList();
      out.push(`<h3>${inline(h3[1])}</h3>`);
      continue;
    }
    const h2 = t.match(/^##\s+(.+)/);
    if (h2) {
      closeList();
      out.push(`<h2>${inline(h2[1])}</h2>`);
      continue;
    }

    const ul = t.match(/^[-*]\s+(.+)/);
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

    const ol = t.match(/^\d+\.\s+(.+)/);
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

    const bq = t.match(/^>\s*(.+)/);
    if (bq && bq[1].trim()) {
      closeList();
      out.push(`<blockquote>${inline(bq[1])}</blockquote>`);
      continue;
    }

    if (/^[✅❌]/.test(t)) {
      closeList();
      out.push(`<p class="fit-line">${inline(t)}</p>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(t)}</p>`);
  }
  closeList();
  return out.join('\n');
}

function articleHtml(ep, meta, html) {
  const prev = ep.day > 1 ? `day-${ep.day - 1}.html` : null;
  const next = ep.day < MAX_DAY ? `day-${ep.day + 1}.html` : null;
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
      <a href="../index.html" class="site-name">WilliamXing · Blog</a>
      <span class="ep-badge">Day ${ep.day}/30</span>
    </div>
  </div>
  <article class="wrap article">
    <header class="article-head">
      <a class="back" href="../index.html">← 系列目录</a>
      <h1>${meta.title.replace(/</g, '&lt;')}</h1>
      <p class="meta">阿布房产30天 · Day ${ep.day} · 基于 ADREC 2025 公开数据</p>
    </header>
    <div class="prose">${html}</div>
    <footer class="article-foot">
      <p>交流咨询：<a href="https://sobhazanyan.github.io/william-xing-hub/" target="_blank" rel="noopener">William Xing · 主页</a></p>
    </footer>
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
  catalog.push({ day: ep.day, tag: ep.tag, title: meta.title, teaser: meta.teaser });
  console.log('built day-' + ep.day);
}

fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
console.log('catalog.json written');
