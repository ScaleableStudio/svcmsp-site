'use strict';
// Checks the gaps found in Mary's review: 320px header, first-screen CTA, navigation,
// no-JS behavior, local links and concept-form privacy. No external service is contacted.
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { pathToFileURL, fileURLToPath } = require('url');
const root = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.json')));
const qa = JSON.parse(fs.readFileSync(path.join(root, 'qa.json')));
const tools = path.resolve(root, cfg.images._toolsDir);
require(path.join(tools, 'scripts/env'));
const { chromium } = require(path.join(tools, 'node_modules/playwright'));
const url = file => pathToFileURL(path.join(root, 'site', file)).href;

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const check = (name, passed) => { results.push({ name, passed }); assert.ok(passed, name); };
  try {
    for (const width of qa.headerWidths) {
      const page = await browser.newPage({ viewport: { width, height: qa.mobileViewportHeight } });
      await page.goto(url('index.html'), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      check('Header reflow at ' + width, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (width <= 390) {
        const cta = await page.locator('.hero .btn').boundingBox();
        check('Consultation visible on first screen at ' + width, cta.y + cta.height <= qa.mobileViewportHeight);
        await page.screenshot({ path: path.join(root, 'review', 'after-home-' + width + '.png') });
      }
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: qa.mobileViewportHeight } });
    await page.goto(url('index.html'));
    await page.locator('.menu-btn').focus();
    await page.keyboard.press('Enter');
    check('Keyboard opens navigation', await page.isVisible('#site-nav'));
    await page.keyboard.press('Tab');
    check('Tab enters ordinary navigation links', await page.evaluate(() => document.activeElement.closest('#site-nav') !== null));
    await page.keyboard.press('Escape');
    check('Escape closes and returns focus', await page.getAttribute('.menu-btn', 'aria-expanded') === 'false' && await page.locator('.menu-btn').evaluate(e => e === document.activeElement));
    await page.click('.menu-btn');
    await page.mouse.click(380, 850); // below the expanded navigation, in the visible page
    check('Outside click closes navigation', await page.getAttribute('.menu-btn', 'aria-expanded') === 'false');
    await page.click('.menu-btn');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('.menu-btn').getAttribute('aria-expanded') === 'false');
    check('Desktop resize resets menu state', await page.getAttribute('.menu-btn', 'aria-expanded') === 'false');

    for (const pg of cfg.pages) {
      await page.goto(url(pg.file));
      const links = await page.locator('a[href]').evaluateAll(els => els.map(e => e.href));
      for (const href of links.filter(h => h.startsWith('file:'))) {
        const dest = new URL(href); check('File exists: ' + pg.file + ' -> ' + dest.pathname.split('/').pop(), fs.existsSync(fileURLToPath(dest)));
        if (dest.hash) {
          // All generated IDs come from configuration, so no user-controlled markup is evaluated.
          const content = fs.readFileSync(fileURLToPath(dest), 'utf8');
          check('Fragment exists: ' + dest.hash, content.includes('id="' + decodeURIComponent(dest.hash.slice(1)) + '"'));
        }
      }
    }
    await page.goto(url('contact.html'));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    check('Preview warning precedes inputs', await page.locator('#form-preview').evaluate(e => !!(e.compareDocumentPosition(document.querySelector('#enquiry')) & Node.DOCUMENT_POSITION_FOLLOWING)));
    await page.click('#enquiry button');
    check('Empty form focuses first invalid field', await page.locator('#f-name').evaluate(e => e === document.activeElement && e.getAttribute('aria-describedby').includes('f-error')));
    await page.fill('#f-name', 'Sample'); await page.fill('#f-email', 'sample@example.com');
    await page.selectOption('#f-type', { index: 1 }); await page.fill('#f-msg', 'Sample only'); await page.check('#f-ok');
    await page.click('#enquiry button');
    check('Complete preview explicitly says nothing sent', await page.locator('#f-status').isVisible() && /Nothing was sent/.test(await page.locator('#f-status').innerText()));
    check('Preview sends no request and no query string', requests.length === 0 && !new URL(page.url()).search);
    await page.fill('#f-msg', 'Changed sample');
    check('Editing clears old completion message', !await page.locator('#f-status').isVisible());
    await page.close();

    const offline = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
    await offline.goto(url('contact.html'));
    check('No-JS navigation stays usable', await offline.isVisible('#site-nav'));
    check('No-JS form cannot submit personal information', await offline.isDisabled('#f-name') && await offline.locator('#enquiry button').isDisabled());
    check('No-JS reason is visible', await offline.locator('noscript').isVisible());
    await offline.close();
    fs.writeFileSync(path.join(root, qa.regressionReport), JSON.stringify({ date: new Date().toISOString(), results }, null, 2) + '\n');
    console.log(results.length + ' interaction, reflow and local-link checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
