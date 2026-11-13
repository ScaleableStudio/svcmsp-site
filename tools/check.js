// Concept checks for site/ (run after node build.js): every page at 1440, 768 and 390 px in the Playwright Chromium of
// Scriptorium's Workshop/Bezalel/web-tools. Fails on horizontal overflow, failed requests, console errors or any axe-core
// WCAG 2.2 A/AA violation (contrast included). Also tests the enquiry form and measures home-page weight.
// Writes screenshots and review/checks.json (review/ is git-ignored). Usage: node tools/check.js
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '..');
const s = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8'));
const tools = path.resolve(root, s.images._toolsDir);
require(path.join(tools, 'scripts/env'));
const { chromium } = require(path.join(tools, 'node_modules/playwright'));
const axeSource = fs.readFileSync(path.join(tools, 'node_modules/axe-core/axe.min.js'), 'utf8');
const site = path.join(root, 'site');
const review = path.join(root, 'review');
fs.mkdirSync(review, { recursive: true });
const qa = JSON.parse(fs.readFileSync(path.join(root, 'qa.json'), 'utf8'));
const widths = qa.widths;
const budget = qa.pageBudgetBytes;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = []; let failures = 0;
  const fail = (msg) => { failures++; console.log('  FAIL ' + msg); };
  try {
    for (const pg of s.pages.map(x => x.file).concat('404.html')) {
      for (const w of widths) {
        const page = await browser.newPage({ viewport: { width: w, height: 900 } });
        const failed = [], errors = [], aborted = [], transfers = []; let bytes = 0;
        page.on('requestfailed', r => { const why = (r.failure() || {}).errorText || ''; if (/ERR_ABORTED/.test(why) && r.url().startsWith('file:') && fs.existsSync(require('url').fileURLToPath(r.url()))) aborted.push(r.url()); else failed.push(r.url() + ' ' + why); });
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('response', r => { transfers.push(r.body().then(body => { bytes += body.length; }).catch(() => {})); });
        await page.goto(pathToFileURL(path.join(site, pg)).href, { waitUntil: 'networkidle' });
        await page.evaluate(async () => { await document.fonts.ready; for (const i of document.images) { i.loading = 'eager'; await i.decode().catch(() => {}); } });
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300); await page.evaluate(() => window.scrollTo(0, 0));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        const brokenImages = await page.evaluate(() => Array.from(document.images).filter(i => !i.complete || !i.naturalWidth).map(i => i.currentSrc));
        await Promise.all(transfers);
        await page.addScriptTag({ content: axeSource });
        const axe = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })).violations
          .map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target.join(' ') + ' | ' + (n.failureSummary || '').split('\n')[1]).slice(0, 4) })));
        const shot = `${pg.replace('.html', '')}-${w}.png`;
        await page.screenshot({ path: path.join(review, shot), fullPage: true });
        const r = { page: pg, width: w, overflow, failed, aborted, errors, brokenImages, axe, screenshot: shot, bytes };
        console.log(`${pg} @${w}: overflow=${overflow} failed=${failed.length} console=${errors.length} axe=${axe.length} ${(bytes / 1024).toFixed(0)} KB`);
        if (overflow) fail('horizontal overflow');
        if (brokenImages.length) fail('broken images ' + brokenImages.join(', '));
        if (failed.length) fail('failed requests ' + failed.join(', '));
        if (errors.length) fail('console errors ' + errors.join(' / '));
        for (const v of axe) fail(`axe ${v.id} (${v.impact}): ${v.nodes.join(' ; ')}`);
        if (pg === 'index.html' && bytes > budget) fail(`home page ${(bytes / 1048576).toFixed(2)} MB over the 1.5 MB budget`);
        results.push(r);
        await page.close();
      }
    }
    // enquiry form: empty submit shows an error; a complete submit shows the concept message and sends nothing
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const posts = []; page.on('request', r => { if (r.method() !== 'GET') posts.push(r.url()); });
    await page.goto(pathToFileURL(path.join(site, 'contact.html')).href);
    await page.click('#enquiry button[type=submit]');
    const errShown = await page.isVisible('#f-error');
    await page.fill('#f-name', 'Test'); await page.fill('#f-email', 'test@example.com');
    await page.selectOption('#f-type', { index: 1 }); await page.fill('#f-msg', 'Test'); await page.check('#f-ok');
    await page.click('#enquiry button[type=submit]');
    const okShown = await page.isVisible('#f-status');
    console.log(`form: error on empty=${errShown}, message on complete=${okShown}, requests sent=${posts.length}`);
    if (!errShown || !okShown || posts.length) fail('enquiry form behaviour');
    await page.close();
    fs.writeFileSync(path.join(root, qa.report), JSON.stringify({ date: new Date().toISOString(), widths, failures, results }, null, 2) + '\n');
  } finally { await browser.close(); }
  console.log(failures ? `${failures} problem(s)` : 'all checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
