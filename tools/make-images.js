// Makes the site's web images from the vision board masters (private repo, sibling folder) into assets/img/.
// Run locally when the vision art changes, then commit assets/img/ (GitHub Actions only runs build.js).
// Uses sharp from Scriptorium's Workshop/Bezalel/web-tools. Never upscales; strips metadata.
// Usage (from the repo root): node tools/make-images.js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8')).images;
const tools = path.resolve(root, cfg._toolsDir);
const sharp = require(path.join(tools, 'node_modules/sharp'));
const src = path.resolve(root, cfg._masterDir);
const out = path.join(root, 'assets/img');
fs.mkdirSync(out, { recursive: true });
sharp.cache(false);

(async () => {
  for (const [key, img] of Object.entries(cfg.set)) {
    const master = path.join(src, img.master);
    const meta = await sharp(master).metadata();
    for (const w of img.widths) {
      if (w > meta.width) throw new Error(`${img.master}: ${w} px would upscale (master ${meta.width})`);
      const fmt = img.format || 'webp';
      const file = path.join(out, `${key}-${w}.${fmt === 'jpeg' ? 'jpg' : fmt}`);
      let s = sharp(master).resize({ width: w });
      s = fmt === 'jpeg' ? s.jpeg({ quality: img.quality || 82, mozjpeg: true }) : s.webp({ quality: img.quality || 78 });
      await s.toFile(file);
      console.log(`${path.relative(root, file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
    }
  }
})().catch(e => { console.error(e.message); process.exit(1); });
