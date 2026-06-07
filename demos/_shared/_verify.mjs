import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';

const ROOT = 'C:\\Users\\zby\\Desktop\\iGEM\\软件\\demos';
const SHARED = path.join(ROOT, '_shared');
const norm = s => s.replace(/\r\n/g, '\n');
const kernelSrc = norm(fs.readFileSync(path.join(SHARED, 'kernel.js'), 'utf8'));
const chartSrc  = norm(fs.readFileSync(path.join(SHARED, 'chart.js'),  'utf8'));
const themeSrc  = norm(fs.readFileSync(path.join(SHARED, 'theme.css'), 'utf8'));

const demos = [
  { id: 'demo3', file: path.join(ROOT, 'demo3-通用平台', 'index.html'), needsKernel: true },
];

let fail = 0;
for (const d of demos) {
  console.log('\n=== ' + d.id + ' ===');
  const html = norm(fs.readFileSync(d.file, 'utf8'));
  console.log('  bytes:', fs.statSync(d.file).size);

  // 1) external resources
  // W3C namespace URIs (xmlns / createElementNS for SVG/xlink/xhtml/MathML) are
  // XML identifiers, NOT network fetches — exclude them from the offline check.
  const NS_OK = /^https?:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink|1999\/xhtml|1998\/Math\/MathML)/;
  const ext = [...html.matchAll(/https?:\/\/[^\s"'`)]+/g)].map(m => m[0]).filter(u => !NS_OK.test(u));
  console.log('  external http(s) refs:', ext.length, ext.slice(0, 5));
  if (ext.length) fail++;
  const srcAttr = [...html.matchAll(/<script[^>]*\bsrc=/g)].length + [...html.matchAll(/<link[^>]*\bhref=/g)].length;
  console.log('  <script src>/<link href> count:', srcAttr, srcAttr === 0 ? 'OK' : 'EXTERNAL!');
  if (srcAttr) fail++;

  // 2) doctype + script balance
  console.log('  starts with doctype:', /^\s*<!doctype html>/i.test(html));
  const opens = [...html.matchAll(/<script\b[^>]*>/g)].length;
  const closes = [...html.matchAll(/<\/script>/g)].length;
  console.log('  <script> open/close:', opens, '/', closes, opens === closes ? 'balanced' : 'UNBALANCED!');
  if (opens !== closes) fail++;

  // 3) verbatim shared inclusion
  console.log('  theme.css inlined verbatim:', html.includes(themeSrc.trim()));
  if (!html.includes(themeSrc.trim())) fail++;
  if (d.needsKernel) {
    const kOk = html.includes(kernelSrc.trim());
    const cOk = html.includes(chartSrc.trim());
    console.log('  kernel.js inlined verbatim:', kOk, ' chart.js inlined verbatim:', cOk);
    if (!kOk || !cOk) fail++;
  }

  // 4) syntax-check every <script> block under node --check
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  blocks.forEach((code, i) => {
    if (!code.trim()) return;
    const tmp = path.join(os.tmpdir(), `${d.id}_block${i}.js`);
    fs.writeFileSync(tmp, code, 'utf8');
    try {
      execSync(`node --check "${tmp}"`, { stdio: 'pipe' });
      console.log(`  script[${i}] (${code.length} chars): syntax OK`);
    } catch (e) {
      console.log(`  script[${i}] (${code.length} chars): SYNTAX ERROR\n`, String(e.stderr || e).slice(0, 600));
      fail++;
    } finally { fs.unlinkSync(tmp); }
  });
}
console.log('\n==== ' + (fail ? ('FAILURES: ' + fail) : 'ALL CHECKS PASSED') + ' ====');
process.exit(fail ? 1 : 0);
