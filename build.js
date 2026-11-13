// Builds the Sovereign Vanguard concept site from site.json into site/ (static HTML, no packages).
// Usage: node build.js     (GitHub Actions publishes site/ to Pages; see .github/workflows/pages.yml)
// Images: assets/img/ (made by tools/make-images.js from the vision board). Checks: tools/check.js.
'use strict';
const fs = require('fs');
const path = require('path');
const s = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8'));
if (s.concept === false) {
  const a = s.liveApproval || {};
  if (!/^(Ken|Ann|Marty)$/.test(a.by || '') || !a.date || !a.where) throw new Error('Live build refused: record liveApproval { by, date, where } first (LIVE RULE).');
  throw new Error('Live build refused: implement and verify the real enquiry route first (planning issue #19). The current form is a local preview only.');
}
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const p = s.palette;
const img = s.images.set;
const out = path.join(__dirname, 'site');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(__dirname, 'assets/img'))) fs.copyFileSync(path.join(__dirname, 'assets/img', f), path.join(out, 'img', f));
const baseUrl = `https://${s.host}/`;

// ---------- pieces ----------
// Placeholder SV mark until the real monogram exists (punch list #10): two strokes in a keystone frame.
const markSvg = (cls, label) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 72 72"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><path d="M10 6h52v38L36 66 10 44z" fill="none" stroke="${p.champagne}" stroke-width="2"/><path d="M27 22c-6 0-8 7-1 9l6 2c7 2 5 10-2 10" fill="none" stroke="${p.ivory}" stroke-width="2.4" stroke-linecap="round"/><path d="M38 22l7 21 7-21" fill="none" stroke="${p.champagne}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const srcset = key => img[key].widths.map(w => `img/${key}-${w}.webp ${w}w`).join(', ');
const pic = (key, sizes, cls = '', eager = false) => {
  const i = img[key], w = i.widths[i.widths.length - 1];
  return `<img class="${cls}" src="img/${key}-${w}.webp" srcset="${srcset(key)}" sizes="${sizes}" width="${i.w}" height="${i.h}" alt="${esc(i.alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};
const btn = (l, h, cls = 'btn') => `<a class="${cls}" href="${esc(h)}">${esc(l)}</a>`;
const textLink = l => l ? `<p class="more"><a href="${esc(l.href)}">${esc(l.label)} <span aria-hidden="true">→</span></a></p>` : '';
const head = (eyebrow, h2, intro) => `${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h2>${esc(h2)}</h2>${intro ? `<p class="lead">${esc(intro)}</p>` : ''}`;
const ul = list => `<ul class="ticks">${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
const cards = (items, cols) => `<div class="grid c${cols || items.length}">${items.map(c => `<div class="card">${c.label ? `<p class="label">${esc(c.label)}</p>` : ''}<h3>${c.href ? `<a href="${esc(c.href)}">${esc(c.title)} <span aria-hidden="true">↗</span></a>` : esc(c.title)}</h3>${c.body ? `<p>${esc(c.body)}</p>` : ''}${c.list ? ul(c.list) : ''}</div>`).join('')}</div>`;
const draft = t => t && s.concept ? `<p class="draft">${esc(t)}</p>` : '';

const sections = {
  intro: x => `<section class="band"><div class="wrap"><div class="intro-copy">${head(x.eyebrow, x.h2)}${x.paras.map(t => `<p class="lead">${esc(t)}</p>`).join('')}</div>${x.cards ? cards(x.cards) : ''}${textLink(x.link)}</div></section>`,
  responsibility: x => `<section class="band alt"><div class="wrap split experience"><div class="split-img">${pic(x.image, '(max-width: 820px) 90vw, 440px')}</div><div>${head(x.eyebrow, x.h2, x.intro)}<dl class="responsibilities">${x.items.map(i => `<div><dt>${esc(i.title)}</dt><dd>${esc(i.body)}</dd></div>`).join('')}</dl>${textLink(x.link)}</div></div></section>`,
  cards: x => `<section class="band${x.dark ? ' dark' : ''}"><div class="wrap">${head(x.eyebrow, x.h2, x.intro)}${draft(x.draft)}${cards(x.cards, x.cols)}${textLink(x.link)}</div></section>`,
  families: x => `<section class="band"><div class="wrap">${head(x.eyebrow, x.h2, x.intro)}${cards(x.items, 2)}</div></section>`,
  steps: x => `<section class="band alt"><div class="wrap">${head(x.eyebrow, x.h2)}<ol class="steps">${x.steps.map((st, i) => `<li><span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${esc(st.title)}</h3><p>${esc(st.body)}</p></li>`).join('')}</ol></div></section>`,
  split: x => `<section class="band dark"><div class="wrap split${x.reverse ? ' rev' : ''}"><div class="split-img">${pic(x.image, '(max-width: 820px) 90vw, 480px')}</div><div>${head(x.eyebrow, x.h2)}${x.paras.map(t => `<p>${esc(t)}</p>`).join('')}${textLink(x.link)}</div></div></section>`,
  note: x => `<section class="band"><div class="wrap narrow"><aside class="note"><h2 class="h3">${esc(x.title)}</h2><p>${esc(x.body)}</p></aside></div></section>`,
  packages: x => `<section class="band alt"><div class="wrap">${head(x.eyebrow, x.h2, x.intro)}<div class="grid c4 pkgs">${x.items.map(k => `<div class="card pkg"><h3>${esc(k.name)}</h3><p class="label">${esc(k.sub)}</p><p>${esc(k.for)}</p>${ul(k.list)}</div>`).join('')}</div><p class="small">No prices are shown: fees, service hours and response times are set in each agreement.</p></div></section>`,
  two: x => `<section class="band"><div class="wrap">${head(x.eyebrow, x.h2)}<div class="grid c2">${x.cols.map(c => `<div class="card"><h3>${esc(c.title)}</h3>${ul(c.list)}</div>`).join('')}</div></div></section>`,
  audience: x => `<section class="band aud"${x.id ? ` id="${esc(x.id)}"` : ''}><div class="wrap split-text"><div>${head(x.eyebrow, x.h2)}${x.paras.map(t => `<p>${esc(t)}</p>`).join('')}</div><div class="card">${ul(x.list)}</div></div></section>`,
  values: x => `<section class="band dark"><div class="wrap">${head(x.eyebrow, x.h2)}<ul class="values">${x.list.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div></section>`,
  cta: () => `<section class="band dark cta-band"><div class="wrap narrow center">${markSvg('cta-mark')}<h2>A private conversation is the first step.</h2><p class="lead">Tell us what you are responsible for. We will listen, and if we can serve you well, we will say exactly how.</p><p>${btn(s.cta.label, s.cta.href, 'btn btn-light')}</p><p class="next">A short, confidential conversation about your needs. No obligation.</p></div></section>`,
  form: x => `<section class="band"><div class="wrap split-text form-wrap"><div><h2>${esc(x.h2)}</h2>
<aside class="preview-notice" id="form-preview"><h3>${esc(s.enquiry.noticeTitle)}</h3><p>${esc(s.enquiry.notice)}</p></aside>
<noscript><p class="draft">${esc(s.enquiry.noScript)}</p></noscript>
<form id="enquiry" class="enquiry" novalidate aria-describedby="form-preview">
<fieldset disabled><legend class="sr-only">${esc(x.h2)}</legend>
<div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
<div class="field"><label for="f-org">Organization or office <span class="opt">(optional)</span></label><input id="f-org" name="organization" type="text" autocomplete="organization"></div>
<div class="field"><label for="f-type">I am enquiring for</label><select id="f-type" name="type" required><option value="">Choose one</option>${x.options.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>
<div class="field"><label for="f-msg">How can we help?</label><textarea id="f-msg" name="message" rows="5" required aria-describedby="f-privacy"></textarea><p class="hint" id="f-privacy">${esc(x.privacy)}</p></div>
<div class="field check"><input id="f-ok" name="consent" type="checkbox" required><label for="f-ok">I agree to be contacted about this enquiry.</label></div>
<p class="error" id="f-error" role="alert" hidden></p>
<button class="btn btn-dark" type="submit">${esc(s.enquiry.button)}</button>
<p class="status" id="f-status" role="status" hidden>${esc(s.concept ? x.conceptMessage : '')}</p>
</fieldset>
</form></div>
<aside><h2 class="h3">What happens next</h2><ol class="next-steps">${x.next.map(n => `<li><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></li>`).join('')}</ol></aside></div></section>`,
  legal: x => `<section class="band"><div class="wrap narrow">${draft(x.draft)}${x.parts.map(pt => `<div class="legal" id="${pt.id}"><h2>${esc(pt.h2)}</h2>${pt.paras.map(t => `<p>${esc(t)}</p>`).join('')}</div>`).join('')}</div></section>`
};

const hero = pg => {
  const h = pg.hero;
  if (h.type === 'home') return `<section class="hero home"><picture><source media="(max-width: 760px)" srcset="${srcset('hero-m')}" sizes="100vw">${pic('hero', '100vw', 'hero-img', true)}</picture>
<div class="wrap hero-copy"><p class="eyebrow">${esc(h.eyebrow)}</p><h1>${h.headlineLines ? h.headlineLines.map(t => `<span>${esc(t)}</span>`).join(' ') : esc(h.h1)}</h1><p class="lead">${esc(h.lede)}</p>
<p class="actions">${btn(s.cta.label, s.cta.href, 'btn btn-light')} ${btn(h.secondary.label, h.secondary.href, 'link-light')}</p><p class="next">${esc(h.next)}</p></div></section>`;
  return `<section class="hero inner${h.image ? ' has-img' : ''}"><div class="wrap${h.image ? ' split' : ''}"><div><p class="eyebrow">${esc(h.eyebrow)}</p><h1>${esc(h.h1)}</h1>${h.lede ? `<p class="lead">${esc(h.lede)}</p>` : ''}</div>${h.image ? `<div class="split-img">${pic(h.image, '(max-width: 820px) 70vw, 420px', '', true)}</div>` : ''}</div></section>`;
};

const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8')
  .replace(/var\(--(midnight|champagne|ivory|slate|sage|ink|mist|paper)\)/g, (m, k) => p[k]);

const script = fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8');

const page = pg => {
  const isHome = pg.file === 'index.html';
  const navHtml = s.nav.map(n => `<li><a href="${n.href}"${n.href === pg.file ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pg.title)}</title>
<meta name="description" content="${esc(pg.description)}">
${s.concept ? '<meta name="robots" content="noindex, nofollow">\n' : `<link rel="canonical" href="${baseUrl}${isHome ? '' : pg.file}">\n`}<meta name="theme-color" content="${p.midnight}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(s.name)}"><meta property="og:title" content="${esc(pg.title)}"><meta property="og:description" content="${esc(pg.description)}">
<meta property="og:image" content="${baseUrl}img/og-1200.jpg"><meta property="og:image:alt" content="${esc(img.og.alt)}"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(s.fonts.googleCss)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<style>${css}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${s.concept ? `<div class="concept">${esc(s.conceptBanner)}</div>\n` : ''}<header class="site-head"><div class="wrap head-row">
<a class="brand" href="index.html">${markSvg('mark', '')}<span>${esc(s.name)}</span></a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
<nav id="site-nav" aria-label="Main"><ul>${navHtml}</ul></nav>
<a class="mobile-contact" href="${esc(s.cta.href)}">${esc(s.cta.mobileLabel)} <span aria-hidden="true">↗</span></a>
${btn(s.cta.label, s.cta.href, 'btn btn-light head-cta')}
</div></header>
<main id="main">
${hero(pg)}
${pg.sections.map(x => sections[x.type](x)).join('\n')}
</main>
<footer class="site-foot"><div class="wrap foot-grid">
<div><p class="foot-brand">${markSvg('mark', '')}<span>${esc(s.fullName)}</span></p><p>${esc(s.descriptor)}</p><p class="tag">${esc(s.tagline)}</p></div>
<nav aria-label="Footer"><ul>${s.nav.concat(s.footerLinks).filter(n => n.href !== 'index.html').map(n => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('')}</ul></nav>
<div><p><a href="${esc(s.parent.url)}">${esc(s.parent.label)}</a></p>${s.concept ? `<p class="small">${esc(s.conceptFooter)}</p>` : ''}</div>
</div></footer>
<script>${script}</script>
</body>
</html>
`;
};

for (const pg of s.pages) fs.writeFileSync(path.join(out, pg.file), page(pg));
fs.writeFileSync(path.join(out, '404.html'), page({ file: '404.html', title: `Page not found · ${s.name}`, description: 'This page could not be found.',
  hero: { eyebrow: 'Not found', h1: 'This page could not be found.', lede: 'It may have moved. The links above will take you where you need to go.' }, sections: [{ type: 'cta' }] }));
fs.writeFileSync(path.join(out, 'favicon.svg'), markSvg('', '').replace(' aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"').replace('<path d="M10', `<rect width="72" height="72" fill="${p.midnight}"/><path d="M10`));
fs.writeFileSync(path.join(out, 'CNAME'), s.host + '\n');
fs.writeFileSync(path.join(out, 'robots.txt'), s.concept ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${baseUrl}sitemap.xml\n`);
if (!s.concept) fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${s.pages.map(pg => `<url><loc>${baseUrl}${pg.file === 'index.html' ? '' : pg.file}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`built site/ (${s.pages.length} pages + 404) for ${s.host} (concept=${s.concept})`);
