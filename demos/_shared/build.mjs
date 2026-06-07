/* =========================================================================
   build.mjs —— 把 _shared 里的共用资源(fonts.css + theme.css + chart.js)
   确定性地重新内联进三个 demo 的 index.html。
   ─────────────────────────────────────────────────────────────────────────
   设计:幂等。第一次运行用唯一 banner + 花括号配对定位区域,并写入显式标记
   (@@SHARED-CSS-START/END、@@SHARED-CHART-START/END);之后运行直接在标记
   之间替换。每个 demo 的「局部样式 / 局部脚本」一律保留不动。
   用法:  node _shared/build.mjs        (在 demos/ 目录或任意目录均可,路径已写死相对本文件)
   ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));        // .../demos/_shared
const ROOT = path.resolve(HERE, '..');                           // .../demos

const fontsCss = fs.readFileSync(path.join(HERE, 'fonts.css'), 'utf8').trim();
const themeCss = fs.readFileSync(path.join(HERE, 'theme.css'), 'utf8').trim();
const chartJs  = fs.readFileSync(path.join(HERE, 'chart.js'),  'utf8').trim();

const SHARED_CSS = fontsCss + '\n\n' + themeCss;

const CSS_S = '/* @@SHARED-CSS-START (generated) */';
const CSS_E = '/* @@SHARED-CSS-END */';
const CHT_S = '/* @@SHARED-CHART-START (generated) */';
const CHT_E = '/* @@SHARED-CHART-END */';

// guard: shared payloads must never contain a tag that would break the host block
for (const [name, body] of [['SHARED_CSS', SHARED_CSS], ['chart.js', chartJs]]) {
  if (/<\/style>/i.test(body) && name === 'SHARED_CSS') throw new Error(name + ' contains </style>');
  if (/<\/script>/i.test(body) && name === 'chart.js') throw new Error(name + ' contains </script>');
}

const demos = [
  'demo3-通用平台/index.html',
];

/** find the index just past the matching close brace for the first `{` at/after `from` */
function matchBrace(s, from) {
  const open = s.indexOf('{', from);
  if (open < 0) return -1;
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

function replaceShared(content) {
  // ---- CSS ----
  if (content.includes(CSS_S) && content.includes(CSS_E)) {
    const a = content.indexOf(CSS_S);
    const b = content.indexOf(CSS_E) + CSS_E.length;
    content = content.slice(0, a) + CSS_S + '\n' + SHARED_CSS + '\n' + CSS_E + content.slice(b);
  } else {
    const banner = content.indexOf('iGEM 软件组 · 共用设计系统');
    if (banner < 0) throw new Error('CSS banner not found');
    const styleOpen = content.lastIndexOf('<style>', banner);
    const openEnd = content.indexOf('>', styleOpen) + 1;
    const rm = content.indexOf('@media (prefers-reduced-motion: reduce)', openEnd);
    if (rm < 0) throw new Error('reduced-motion anchor not found');
    const end = matchBrace(content, rm);
    if (end < 0) throw new Error('could not brace-match reduced-motion block');
    const block = CSS_S + '\n' + SHARED_CSS + '\n' + CSS_E;
    content = content.slice(0, openEnd) + '\n' + block + content.slice(end);
  }

  // ---- chart.js (demo3) ----
  const hasChart = content.includes('轻量折线图') || content.includes(CHT_S);
  if (hasChart) {
    if (content.includes(CHT_S) && content.includes(CHT_E)) {
      const a = content.indexOf(CHT_S);
      const b = content.indexOf(CHT_E) + CHT_E.length;
      content = content.slice(0, a) + CHT_S + '\n' + chartJs + '\n' + CHT_E + content.slice(b);
    } else {
      const banner = content.indexOf('轻量折线图');
      const scriptOpen = content.lastIndexOf('<script>', banner);
      const openEnd = content.indexOf('>', scriptOpen) + 1;
      const scriptClose = content.indexOf('</script>', banner);
      if (scriptOpen < 0 || scriptClose < 0) throw new Error('chart <script> bounds not found');
      const block = '\n' + CHT_S + '\n' + chartJs + '\n' + CHT_E + '\n';
      content = content.slice(0, openEnd) + block + content.slice(scriptClose);
    }
  }
  return content;
}

let ok = 0;
for (const rel of demos) {
  const fp = path.join(ROOT, rel);
  const before = fs.readFileSync(fp, 'utf8');
  const after = replaceShared(before);
  // sanity
  const faces = (after.match(/@font-face/g) || []).length;
  const styleTags = (after.match(/<style>/g) || []).length;
  const styleClose = (after.match(/<\/style>/g) || []).length;
  if (faces !== 3) throw new Error(rel + ': expected 3 @font-face, got ' + faces);
  if (styleTags !== styleClose) throw new Error(rel + ': <style> / </style> mismatch');
  fs.writeFileSync(fp, after);
  const delta = after.length - before.length;
  console.log(`✓ ${rel}  (${before.length} → ${after.length}, ${delta >= 0 ? '+' : ''}${delta} bytes, ${faces} font-face)`);
  ok++;
}
console.log(`\nbuild done: ${ok}/${demos.length} demos re-inlined.`);
