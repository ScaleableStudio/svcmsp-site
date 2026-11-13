// Builds the Sovereign Vanguard concept page from site.json into site/ (static HTML, no packages).
// Usage: node build.js     (GitHub Actions publishes site/ to Pages; see .github/workflows/pages.yml)
'use strict';
const fs = require('fs');
const path = require('path');
const s = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8'));
if (s.concept === false) {
  const a = s.liveApproval || {};
  if (!/^(Ken|Ann|Marty)$/.test(a.by || '') || !a.date || !a.where) throw new Error('Live build refused: record liveApproval { by, date, where } first (LIVE RULE).');
}
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const p = s.palette;
const out = path.join(__dirname, 'site');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const css = `:root{--navy:${p.navy};--gold:${p.gold};--ivory:${p.ivory};--slate:${p.slate};--muted:${p.muted};
--display:'${s.fonts.display}',Georgia,'Times New Roman',serif;--body:'${s.fonts.body}',system-ui,'Segoe UI',Arial,sans-serif}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--navy);color:var(--ivory);font:400 17px/1.6 var(--body);display:flex;flex-direction:column}
.concept{background:var(--gold);color:var(--navy);text-align:center;font:600 12px/1.4 var(--body);letter-spacing:.08em;padding:6px 12px}
main{flex:1;display:grid;place-items:center;padding:clamp(48px,10vw,120px) 20px}
.card{max-width:760px;text-align:center}
.mark{width:72px;height:72px;margin:0 auto 28px;display:block}
.eyebrow{font:600 12px/1.3 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:0 0 18px}
h1{font:500 clamp(44px,8vw,84px)/1.05 var(--display);letter-spacing:.02em;margin:0}
h1 span{color:var(--gold)}
.rule{width:96px;height:1px;background:var(--gold);margin:30px auto}
.statement{font:400 clamp(19px,2.2vw,22px)/1.55 var(--body);color:var(--ivory);margin:0 0 10px}
.status{color:var(--muted);margin:0}
footer{border-top:1px solid rgba(199,169,107,.35);padding:22px 20px;text-align:center;font-size:13px;color:var(--muted)}
footer a{color:var(--ivory)}
a:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
`;
// Placeholder SV mark until the real monogram exists (punch list #10): two strokes in a keystone frame.
const mark = `<svg class="mark" viewBox="0 0 72 72" role="img" aria-label="SV mark (placeholder)"><path d="M10 6h52v38L36 66 10 44z" fill="none" stroke="${p.gold}" stroke-width="2"/><path d="M27 22c-6 0-8 7-1 9l6 2c7 2 5 10-2 10" fill="none" stroke="${p.ivory}" stroke-width="2.4" stroke-linecap="round"/><path d="M38 22l7 21 7-21" fill="none" stroke="${p.gold}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.fullName)} · ${esc(s.descriptor)}</title>
<meta name="description" content="${esc(s.statement)}">
${s.concept ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(s.fonts.googleCss)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<style>${css}</style>
</head>
<body>
${s.concept ? '<div class="concept">CONCEPT PREVIEW · not the live site</div>\n' : ''}<main><div class="card">
${mark}
<p class="eyebrow">${esc(s.descriptor)}</p>
<h1>Sovereign <span>Vanguard</span></h1>
<div class="rule" aria-hidden="true"></div>
<p class="statement">${esc(s.statement)}</p>
<p class="status">${esc(s.status)}</p>
</div></main>
<footer>${esc(s.fullName)} · <a href="${esc(s.parent.url)}">${esc(s.parent.label)}</a></footer>
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'favicon.svg'), mark.replace('class="mark" ', '').replace('role="img" aria-label="SV mark (placeholder)"', 'xmlns="http://www.w3.org/2000/svg"').replace('<path d="M10', `<rect width="72" height="72" fill="${p.navy}"/><path d="M10`));
fs.writeFileSync(path.join(out, 'CNAME'), s.host + '\n');
fs.writeFileSync(path.join(out, 'robots.txt'), s.concept ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n');
console.log(`built site/ for ${s.host} (concept=${s.concept})`);
