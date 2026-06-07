import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const DEMOS_ROOT = 'C:\\Users\\zby\\Desktop\\iGEM\\软件\\demos';
const SHOTS = path.join(DEMOS_ROOT, '_shared', '_test', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const fileUrl = (rel) => pathToFileURL(path.join(DEMOS_ROOT, rel)).href;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const report = {};

async function newPage(browser, id) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!/favicon/i.test(t)) errors.push('console.error: ' + t);
    }
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e && e.message ? e.message : String(e))));
  report[id] = { errors, shots: [], steps: [] };
  return page;
}

async function shoot(page, id, name) {
  const f = path.join(SHOTS, id + '_' + name + '.png');
  await page.screenshot({ path: f, fullPage: true });
  report[id].shots.push(path.basename(f));
}

async function safe(id, label, fn) {
  try { await fn(); report[id].steps.push('OK  ' + label); }
  catch (e) { report[id].steps.push('ERR ' + label + ' :: ' + (e.message || e)); }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ---------------- DEMO 3 ----------------
  {
    const id = 'demo3';
    const page = await newPage(browser, id);
    await page.goto(fileUrl('demo3-通用平台\\index.html'), { waitUntil: 'load' });
    await sleep(800);
    await shoot(page, id, '01_initial');
    await safe(id, 'preset: 五输入多重污染', async () => {
      const b = page.getByText('五输入', { exact: false }).first();
      await b.click({ timeout: 2000 }); await sleep(700); await shoot(page, id, '02_preset_5');
    });
    await safe(id, 'preset: 双输入协同', async () => {
      const b = page.getByText('双输入', { exact: false }).first();
      await b.click({ timeout: 2000 }); await sleep(600); await shoot(page, id, '03_preset_dual');
    });
    await safe(id, 'restore defaults', async () => {
      const b = page.getByText('还原默认', { exact: false }).first();
      await b.click({ timeout: 2000 }); await sleep(500); await shoot(page, id, '04_defaults');
    });
    await safe(id, 'playback (signal flow + sweep)', async () => { await page.click('#playBtn'); await sleep(1800); await shoot(page, id, '05_playback'); });
    await safe(id, 'about modal', async () => { await page.click('#aboutBtn'); await sleep(300); await shoot(page, id, '06_about'); await page.keyboard.press('Escape'); });
    await page.close();
  }

  await browser.close();

  console.log('\n================ SMOKE TEST REPORT ================');
  let totalErr = 0;
  for (const id of Object.keys(report)) {
    const r = report[id];
    totalErr += r.errors.length;
    console.log('\n#### ' + id + ' ####');
    console.log('  screenshots: ' + r.shots.length + ' -> ' + r.shots.join(', '));
    console.log('  steps:');
    r.steps.forEach(s => console.log('    ' + s));
    console.log('  runtime errors: ' + r.errors.length);
    r.errors.forEach(e => console.log('    !! ' + e));
  }
  console.log('\n================ TOTAL RUNTIME ERRORS: ' + totalErr + ' ================');
  process.exit(0);
}

run().catch(e => { console.error('FATAL', e); process.exit(1); });
