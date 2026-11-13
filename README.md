# svcmsp-site

Website for **Sovereign Vanguard Concierge MSP**, a Scalable Studio company. It is published by GitHub Pages at **https://svcmsp.scalablestudio.online**.

- **Concept preview:** banner, noindex and robots disallow until Ken, Ann or Marty says go live (LIVE RULE; `build.js` refuses a live build without `liveApproval`).
- `site.json`: everything the site says (8 pages), the palette, fonts, navigation and image list.
- `styles.css`: the look; colours are filled in from `site.json`.
- `build.js`: turns the two into `site/` (no packages). `.github/workflows/pages.yml` runs it and publishes on every push to `main`.
- `assets/img/`: web images (WebP, plus a JPEG social card) made from the vision board "The Lit Keystone" by `node tools/make-images.js`. Run it again only when the art changes, then commit.
- `tools/check.js`: every page at 1440, 768 and 390 px. It checks for sideways overflow, failed requests and console errors, runs axe-core WCAG 2.2 AA (contrast included) and the form test, and measures the home page against the 1.5 MB budget. Screenshots go to `review/` (git-ignored).

Local tools come from Scriptorium's `Workshop/Bezalel/web-tools` (Playwright, sharp, axe-core). The Pages build needs only Node.

```
node build.js
node tools/check.js
```

Planning, blueprints, the vision board and the punch list live in the private repo `ScaleableStudio/Sovereign-Vanguard-Concierge-MSP` (project #7).
