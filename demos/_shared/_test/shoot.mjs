import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import fs from 'fs';

const ROOT = 'C:/Users/zby/Desktop/iGEM/软件/demos';
const OUT = ROOT + '/_screenshots_v3';
fs.mkdirSync(OUT, { recursive: true });

const only = process.argv[2] || 'all';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 1.5 });
page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

async function shot(name) { await page.screenshot({ path: OUT + '/' + name + '.png', fullPage: true }); console.log('  shot', name); }
async function go(file) { await page.goto(pathToFileURL(ROOT + '/' + file).href, { waitUntil: 'load' }); await page.evaluate(() => { if (window.ASSAY) ASSAY.setTheme('light'); }); await page.waitForTimeout(750); }
async function setSliders(vals) {
  await page.evaluate((v) => {
    Object.keys(v).forEach(id => { const e = document.getElementById(id); if (e) { e.value = v[id]; e.dispatchEvent(new Event('input', { bubbles: true })); } });
  }, vals);
  await page.waitForTimeout(450);
}

if (only === 'all' || only === 'demo3') {
  console.log('DEMO3');
  await go('demo3-通用平台/index.html');
  await shot('demo3_light_initial');
  await page.click('[data-preset="five"]').catch(e => console.log('  five preset', e.message)); await page.waitForTimeout(500);
  console.log('  demo3 five-preset verdict =', await page.evaluate(() => (document.getElementById('verdictMain') || {}).textContent));
  await shot('demo3_light_five');
  await page.click('#themeBtn').catch(() => {}); await page.waitForTimeout(500);
  await shot('demo3_dark_initial');
}

console.log('\nERRORS:', errors.length);
errors.forEach(e => console.log('  -', e));
await browser.close();
process.exit(errors.length ? 1 : 0);
