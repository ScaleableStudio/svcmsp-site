# svcmsp-site

Website for **Sovereign Vanguard Concierge MSP**, a Scalable Studio company. GitHub Pages serves **https://svcmsp.scalablestudio.online** from `main`.

**Review state, 2026-11-13:** the public URL still serves the earlier placeholder. Peter-Simon held the eight-page concept in local commit `c65fb3f` for Ken's review. Mary's refinements are on `mary/vision-concept-review-2026-11-13`; pushing that branch does not deploy it. Merge only after review. Open locally with `node build.js`, then `site/index.html`.

- **Concept preview:** banner, noindex and robots disallow until Ken, Ann or Marty says go live (LIVE RULE; `build.js` refuses a live build without `liveApproval`).
- `site.json`: everything the site says (8 pages), the palette, fonts, navigation and image list.
- `styles.css`: the look; colours are filled in from `site.json`.
- `build.js`: turns the two into `site/` (no packages). `.github/workflows/pages.yml` runs it and publishes on every push to `main`.
- `assets/img/`: web images (WebP, plus a JPEG social card) made from the vision board "The Lit Keystone" by `node tools/make-images.js`. Run it again only when the art changes, then commit.
- `tools/check.js`: every page at 1440, 768, 390 and 320 px. It checks for sideways overflow, broken images, failed requests and console errors, runs axe-core WCAG 2.2 AA rules (contrast included) and the form test, and measures local resource bodies against the 1.5 MB home-page budget. Screenshots go to `review/` (git-ignored). Automated checks do not certify full accessibility or real-user Core Web Vitals.
- `client.js`: progressively enhanced navigation and local form demonstration. Without JavaScript the links remain visible and the form stays disabled. Escape closes the mobile navigation and restores focus.
- `qa.json`: viewport lists, byte budget and report paths. Checks now include **320px**.
- `tools/check-interactions.js`: navigation keyboard behavior, first-screen mobile consultation button, local links/fragments, preview disclosure and no-JavaScript privacy checks.
- The consultation form explicitly says it sends nothing before fields are enabled. It is not an enquiry service. A production build remains blocked until a real route is implemented and verified, in addition to the existing go-live approval gate.

Local tools come from Scriptorium's `Workshop/Bezalel/web-tools` (Playwright, sharp, axe-core). The Pages build needs only Node.

```
node build.js
node tools/check.js
node tools/check-interactions.js
```

Planning, blueprints, the vision board and the punch list live in the private repo `ScaleableStudio/Sovereign-Vanguard-Concierge-MSP` (project #7).
