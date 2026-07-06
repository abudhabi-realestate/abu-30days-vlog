#!/usr/bin/env node
/** Convert series markdown → reader-facing static HTML (zh + en) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const seriesRoot = path.resolve(root, '..');
const sourceDir = path.join(seriesRoot, 'source');
const sourceEnDir = path.join(sourceDir, 'en');

const episodes = [
  {
    day: 1,
    file: 'Day1-阿布扎比区域地图全览.md',
    fileEn: 'Day1-area-map-overview.md',
    tag: 'MAP',
    title: 'Day 1｜阿布扎比买房，先认地图：一张图搞懂所有核心区域',
    titleEn: 'Day 1 | Buying in Abu Dhabi? Start with the Map: One Guide to Every Core Area',
  },
  {
    day: 2,
    file: 'Day2-阿布扎比vs迪拜对比.md',
    fileEn: 'Day2-abu-dhabi-vs-dubai.md',
    tag: 'VS',
    title: 'Day 2｜阿布扎比 vs 迪拜：为什么已经在看迪拜，还要看阿布？',
    titleEn: 'Day 2 | Abu Dhabi vs Dubai: Already Looking at Dubai — Why Abu Dhabi Too?',
  },
  {
    day: 3,
    file: 'Day3-谁在买阿布房产.md',
    fileEn: 'Day3-who-is-buying.md',
    tag: 'WHO',
    title: 'Day 3｜谁在买阿布房产？本地 vs 国际，期房占 7 成说明什么',
    titleEn: 'Day 3 | Who Is Buying Abu Dhabi Property? Locals vs International, 71% Off-Plan',
  },
  {
    day: 4,
    file: 'Day4-阿布扎比的三张底牌.md',
    fileEn: 'Day4-three-structural-edges.md',
    tag: 'EDGE',
    title: 'Day 4｜阿布扎比的「底牌」：主权基金、零税、外交政策',
    titleEn: 'Day 4 | Abu Dhabi\'s Structural Edges: Sovereign Wealth, Zero Tax, Diplomacy',
  },
  {
    day: 5,
    file: 'Day5-人口多房为何还紧.md',
    fileEn: 'Day5-population-vs-supply.md',
    tag: 'SUPPLY',
    title: 'Day 5｜人口比迪拜还多 20%——为什么房产反而更「紧」？',
    titleEn: 'Day 5 | 20% More People Than Dubai — Why Is Housing Tighter?',
  },
  {
    day: 6,
    file: 'Day6-阿布核心三岛总览.md',
    fileEn: 'Day6-three-islands-overview.md',
    tag: 'ISLANDS',
    title: 'Day 6｜阿布核心三岛总览：72% 的成交发生在这里',
    titleEn: 'Day 6 | The Three Core Islands: 72% of Apartment Deals Happen Here',
  },
  {
    day: 7,
    file: 'Day7-Al Reem岛深聊.md',
    fileEn: 'Day7-al-reem-deep-dive.md',
    tag: 'REEM',
    title: 'Day 7｜Al Reem Island 深聊：配套动线、价位带与选盘逻辑',
    titleEn: 'Day 7 | Al Reem Island Deep Dive: Amenities, Price Bands & Selection Logic',
  },
  {
    day: 8,
    file: 'Day8-Yas岛深聊.md',
    fileEn: 'Day8-yas-island-deep-dive.md',
    tag: 'YAS',
    title: 'Day 8｜Yas Island 深聊：整岛规划、完整社区与公寓别墅怎么选',
    titleEn: 'Day 8 | Yas Island Deep Dive: Master Plan, Communities & Apt vs Villa',
  },
  {
    day: 9,
    file: 'Day9-Saadiyat岛深聊.md',
    fileEn: 'Day9-saadiyat-island-deep-dive.md',
    tag: 'SAADIYAT',
    title: 'Day 9｜Al Saadiyat Island 深聊：文化顶奢、FDI 配置与三岛价位对照',
    titleEn: 'Day 9 | Saadiyat Island Deep Dive: Culture, FDI & Three-Island Price Compare',
  },
  {
    day: 10,
    file: 'Day10-三岛租房市场2025.md',
    fileEn: 'Day10-rental-market-2025.md',
    tag: 'RENT',
    title: 'Day 10｜三岛租房市场：2025 租金、收益率与怎么选',
    titleEn: 'Day 10 | Three-Island Rental Market: 2025 Rents, Yields & How to Choose',
  },
  {
    day: 11,
    file: 'Day11-阿布买房全流程.md',
    fileEn: 'Day11-buying-process.md',
    tag: 'FLOW',
    title: 'Day 11｜阿布买房全流程（外国人版）：从选房到 Title Deed',
    titleEn: 'Day 11 | Abu Dhabi Buying Process (Foreign Buyers): Selection to Title Deed',
  },
];

const MAX_DAY = episodes.length;

const LANG = {
  zh: {
    bodyMarker: '## 正文',
    cutSections: [
      '### 【发布备注】',
      '### 【结尾引导】',
      '### 【封面',
      '### 【口播',
      '### 【系列内部备注',
      '## 小红书发布配置',
    ],
    seriesName: '阿布房产30天',
    metaSuffix: '基于 ADREC 2025 公开数据',
    backLabel: '← 系列目录',
    footer: '交流咨询：<a href="../../">William Xing · 主页</a>',
    langSwitch: '<a class="lang-link" href="en/day-{day}.html">English</a>',
    htmlLang: 'zh-CN',
    cssHref: '../styles.css',
    indexHref: '../index.html',
    hubHref: '../../',
    prevNextBase: '',
  },
  en: {
    bodyMarker: '## Body',
    cutSections: [
      '### [Publishing Notes]',
      '### [Closing CTA]',
      '### [Cover',
      '### [Script',
      '### [Internal Notes',
      '## Xiaohongshu Post Settings',
      '## Publishing Configuration',
    ],
    seriesName: 'Abu Dhabi Real Estate 30 Days',
    metaSuffix: 'Based on ADREC 2025 public data',
    backLabel: '← Series Index',
    footer: 'Contact: <a href="../../">William Xing · Home</a>',
    langSwitch: '<a class="lang-link" href="../day-{day}.html">中文</a>',
    htmlLang: 'en',
    cssHref: '../../styles.css',
    indexHref: '../../en/index.html',
    hubHref: '../../../',
    prevNextBase: '',
  },
};

function extractBody(md, bodyMarker) {
  const bodyStart = md.indexOf(bodyMarker);
  if (bodyStart >= 0) return md.slice(bodyStart + bodyMarker.length);
  return md;
}

function cutAuthorSections(text, cutSections) {
  let out = text;
  for (const marker of cutSections) {
    const i = out.indexOf(marker);
    if (i >= 0) out = out.slice(0, i);
  }
  return out.trim();
}

function sanitizeForReader(body, lang) {
  const lines = body.split('\n');
  const out = [];

  for (let raw of lines) {
    let line = raw.trimEnd();
    const t = line.trim();

    if (!t) {
      out.push('');
      continue;
    }

    if (/配图建议|Image suggestion/i.test(t)) continue;
    if (/^>\s*📊/.test(t)) continue;
    if (/^>\s*$/.test(t)) continue;

    if (/^### 【开头/.test(t)) continue;
    if (/^### 【正文结构】/.test(t)) continue;
    if (/^### 【/.test(t)) continue;
    if (/^### \[Opening/i.test(t)) continue;
    if (/^### \[Body Structure\]/i.test(t)) continue;

    if (/^#{2,6}\s+/.test(t) && /可直接复制|Ready to Copy/i.test(t) && /收尾|Closing/i.test(t)) {
      out.push(lang === 'zh' ? '## 总结' : '## Summary');
      continue;
    }

    if (/^####\s+/.test(t)) {
      line = t
        .replace(/^####\s+/, '## ')
        .replace(/\s·\s*可直接复制\s*$/, '')
        .replace(/\s·\s*Ready to Copy\s*$/i, '');
    }

    if (/^#####\s+/.test(t)) {
      line = t.replace(/^#####\s+/, '### ');
    }

    if (lang === 'zh') {
      line = line
        .replace(/（非推荐，仅供建立认知）/g, '')
        .replace(/市场上常见的项目类型：/g, '代表项目包括：')
        .replace(/👉\s*\*\*解读：\*\*\s*/g, '')
        .replace(/👉\s*\*\*解读\*\*：\s*/g, '')
        .replace(/👉\s*/g, '');
    } else {
      line = line
        .replace(/\(not recommendations, for context only\)/gi, '')
        .replace(/👉\s*\*\*Takeaway:\*\*\s*/gi, '')
        .replace(/👉\s*/g, '');
    }

    if (/^四句话带走：|^Four takeaways:/i.test(t)) continue;
    if (/^Day \d+ 只做一件事：|^Day \d+ has one job:/i.test(t)) continue;
    if (/^\*\*下一步（Day/i.test(t) || /^\*\*Next \(Day/i.test(t)) continue;
    if (/Week 2 (先把|后半|进|first|second)/i.test(t) && /Day [789]/.test(t)) continue;
    if (/欢迎私信聊聊|DM me|欢迎私信/i.test(t)) continue;
    if (/评论区|comment section/i.test(t)) continue;
    if (/我是阿联酋 William|I'm William/i.test(t)) continue;

    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractMeta(md, fallbackTitle, lang) {
  const cfg = LANG[lang];
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = fallbackTitle || (titleMatch ? titleMatch[1].trim() : 'Untitled');
  let body = sanitizeForReader(cutAuthorSections(extractBody(md, cfg.bodyMarker), cfg.cutSections), lang);
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

function articleHtml(ep, meta, html, lang) {
  const cfg = LANG[lang];
  const isEn = lang === 'en';
  const prev = ep.day > 1 ? `day-${ep.day - 1}.html` : null;
  const next = ep.day < MAX_DAY ? `day-${ep.day + 1}.html` : null;
  const langSwitch = cfg.langSwitch.replace('{day}', ep.day);
  const indexLink = isEn ? '../../en/index.html' : '../index.html';

  return `<!DOCTYPE html>
<html lang="${cfg.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title} · ${cfg.seriesName}</title>
  <link rel="stylesheet" href="${cfg.cssHref}" />
</head>
<body>
  <div class="site-brand-bar">
    <div class="site-brand-inner">
      <a href="${indexLink}" class="site-name">WilliamXing · Blog</a>
      <span class="lang-switch">${langSwitch}</span>
      <span class="ep-badge">Day ${ep.day}/30</span>
    </div>
  </div>
  <article class="wrap article">
    <header class="article-head">
      <a class="back" href="${indexLink}">${cfg.backLabel}</a>
      <h1>${meta.title.replace(/</g, '&lt;')}</h1>
      <p class="meta">${cfg.seriesName} · Day ${ep.day} · ${cfg.metaSuffix}</p>
    </header>
    <div class="prose">${html}</div>
    <footer class="article-foot">
      <p>${cfg.footer}</p>
    </footer>
    <nav class="ep-nav">
      ${prev ? `<a href="${prev}">← Day ${ep.day - 1}</a>` : '<span></span>'}
      ${next ? `<a href="${next}">Day ${ep.day + 1} →</a>` : '<span></span>'}
    </nav>
  </article>
</body>
</html>`;
}

function buildLang(lang) {
  const isEn = lang === 'en';
  const outDir = isEn ? path.join(root, 'articles', 'en') : path.join(root, 'articles');
  const srcBase = isEn ? sourceEnDir : sourceDir;
  fs.mkdirSync(outDir, { recursive: true });
  const catalog = [];

  for (const ep of episodes) {
    const filename = isEn ? ep.fileEn : ep.file;
    const fallbackTitle = isEn ? ep.titleEn : ep.title;
    const src = path.join(srcBase, filename);
    const md = fs.readFileSync(src, 'utf8');
    const meta = extractMeta(md, fallbackTitle, lang);
    const html = mdToHtml(meta.body);
    fs.writeFileSync(path.join(outDir, `day-${ep.day}.html`), articleHtml(ep, meta, html, lang), 'utf8');
    catalog.push({ day: ep.day, tag: ep.tag, title: meta.title, teaser: meta.teaser });
    console.log(`built ${isEn ? 'en/' : ''}day-${ep.day}`);
  }

  const catalogName = isEn ? 'catalog-en.json' : 'catalog.json';
  fs.writeFileSync(path.join(root, catalogName), JSON.stringify(catalog, null, 2), 'utf8');
  console.log(catalogName + ' written');
  return catalog;
}

buildLang('zh');
buildLang('en');
console.log('done');
