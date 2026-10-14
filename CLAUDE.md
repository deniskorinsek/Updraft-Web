# Updraft-Web — instructions for Claude Code

Promo website for the UPDRAFT Android game: landing page, privacy policy and support/FAQ, in English and Slovenian. A static site for GitHub Pages: plain HTML, CSS and JavaScript. No framework, no bundler, no npm, no build step, no tracking. **Edit the files in this folder directly; they are the source.** The generator scripts used for v1.0–v1.2 are not part of the repo and are not needed. `../Claude outputs/Updraft-Web_v1.2.zip` is an older copy: ignore it.

Everything in this folder is published (GitHub Pages serves every file, this one included). Keep secrets, private notes, test scripts and `node_modules` out of it; put tooling outside the repo, e.g. `../web-tools/`.

## Repository and deployment

- Own git repo: `github.com/deniskorinsek/Updraft-Web` (public, because free GitHub Pages needs a public repo), branch `main`. The "no git" rule in `../CLAUDE.md` applies to the Android project only.
- GitHub Pages: deploy from branch `main`, folder `/ (root)` → **https://deniskorinsek.github.io/Updraft-Web/**. Every push to `main` republishes within about a minute.
- Pages status: `~/bin/gh api repos/deniskorinsek/Updraft-Web/pages --jq '.status, .html_url'` (expect `built`). If Pages is not enabled: `~/bin/gh api --method POST repos/deniskorinsek/Updraft-Web/pages -f "source[branch]=main" -f "source[path]=/"`.
- Git and gh are authenticated machine-wide (macOS Keychain; `~/bin/gh` is logged in as deniskorinsek). Never ask for tokens. Never write tokens, keystores, service-account keys or `.env` files into the repo. Keep `.gitignore`.

## Files

| Path | Contents |
|---|---|
| `index.html` | landing page: inline icon sprite, nav with scroll-progress feather, `#hero` (playable feather), `#how` (+ wind trail), `#flyers`, `#worlds` (+ sticky `#journey`), `#winter` (inline village SVG + snow canvas), `#daily` (+ screen marquee), `#privacy` strip, `#download` (button, QR, store link), sticky CTA on phones, footer |
| `privacy.html`, `support.html` | EN and SL as two blocks: `<div data-lang="en">` and `<div data-lang="sl" hidden>` |
| `404.html` | not-found page; fixes the base path for the `/Updraft-Web/` project URL at runtime |
| `css/site.css` | all styles, in this order: tokens (`:root`) → base → buttons → nav → hero → scroll reveal → sections → inner pages → motion layer → reduced motion (last block) |
| `js/config.js` | Play Store URL, optional official badge image, support e-mail, default language |
| `js/strings.js` | all landing-page copy: `window.UPDRAFT_STRINGS = { en: {…}, sl: {…} }` |
| `js/biomes.js` | biome list for the Worlds section (from `../design/specs/biomes.json`) |
| `js/site.js` | all behaviour, one IIFE (map below) |
| `assets/` | `brand/` (logo, icons, `og.jpg`, `qr-play.svg`), `flyers/` + `skins/`, `world/` (clouds, stars), `biomes/` (SVG + WebP), `screens/` (app screenshots), `fonts/` (Cormorant Garamond + Jost, OFL), `icons.svg` |
| `README.md` | human docs: publishing, go-live checklist, editing copy |

`site.js`, top to bottom: config wiring → i18n (`t()`, `fmt()`, `applyLang()`; fires the `updraft:lang` event) → nav (solid on scroll, mobile menu) → nav progress feather → sticky CTA (phones) → reveal (`.rv` gets `.in`) and `whenVisible()` → hero engine `initHero()` (canvas wind particles, feather physics, skins, microphone, altitude and sky, toast) → motion layer (`splitWords`, `pxMeasure`/`pxUpdate`, `initTrail`, marquee) → flyer card tilt → `initJourney()` → `initSnow()`.

## Rules

- **Copy lives in three places**: the English fallback in the HTML (`data-i18n="key"` replaces innerHTML; `data-i18n-attr="aria-label:key;alt:key2"` sets attributes) and the `en` and `sl` entries in `js/strings.js`. Change all three. Both languages keep the same keys.
- **Facts must match the game.** Sources: the GDD (`../documentation/UPDRAFT_Master_Game_Design_Physics_Art_Marketing_v7.md`, content v9: Part I and the §504 decisions) and the Android project. Claims on the site today:
  - free to play;
  - no banner ads, no interstitials; rewarded ads optional and capped;
  - small cosmetic-only shop;
  - microphone analysed on the device, never recorded, stored or sent;
  - Google Play Games leaderboards and achievements;
  - Winter Winds is seasonal;
  - minimum Android version = `minSdk` in `../updraft-android/gradle/libs.versions.toml` (29 = Android 10, DEC-19).

  When the game changes, update the site.
- **Visuals** come from the design package (`../design/`). Colour and type tokens come from `design/tokens/design-tokens.json`. Replace assets from a newer package instead of editing them by hand. `design/` and `documentation/` are read-only for website work.
- **Paths stay relative** (the site lives under `/Updraft-Web/`). Use absolute URLs only in the canonical and `og:` tags.
- **Motion hooks**:
  - `data-px="k"` is parallax: the element moves at (1 − k)× the scroll speed (k > 0 is farther, k < 0 is closer).
  - `data-pxx` adds sideways drift; `data-pxmax` clamps the offset (px).
  - Positions are cached in `pxMeasure()` and re-measured on resize, load, fonts ready and language change.
  - Hero clouds use `data-climb` (the camera climb of the hero game), not `data-px`.
  - `h2.split` headings are split into word spans and rise when their `.rv` parent gets `.in`.
- **Reduced motion**: every animation needs a still final state. Use the CSS block at the end of `site.css` and the `reduced` flag in `site.js`.
- **App ID** `si.updraft` is provisional (DEC-01). If it changes, update:
  - `js/config.js → playUrl`;
  - every `si.updraft` link in the HTML (`grep -n "si.updraft" *.html`);
  - the QR code (regenerate it with the command in README).

## Check after every change

1. Preview: `python3 -m http.server 8000` → http://localhost:8000/ (the microphone demo needs localhost or HTTPS).
2. Check widths 1440, 1280, 768 and 390, in EN and SL. The header toggle saves the language in localStorage `updraft-lang`, which wins over `#sl` in the URL and over the browser language. Also check `privacy.html`, `support.html` and `404.html`.
3. No console errors, no failed requests, no horizontal scroll (`scrollWidth === clientWidth`).
4. With reduced motion on, the page is still and complete.
5. Hero:
   - steer with the pointer;
   - hold or press Space to blow, tap for a Gust;
   - switch skins;
   - the altitude climbs;
   - a toast with the Play button appears after a flight above 300 m.
6. Commit, `git push`, then check the live URL.

## Open work (handover, 14 Oct 2026)

### 1. Deployment — check first
- Pushed: `main` = `f716f3a` "UPDRAFT website". It was **not verified** whether Pages is enabled and live. Run the Pages status command, then open the live URL, `privacy.html`, `support.html` and a missing page.
- Not committed yet:
  - this file;
  - `node_modules/` in `.gitignore`;
  - a copy fix: the site said "Android 8.0 and newer" but the app's minSdk is 29, so it now says "Android 10" in `index.html`, `support.html` and `js/strings.js`.

  Review `git diff`, commit, push.

### 2. Scroll smoothness — the owner says scrolling is not smooth
Measure first, then fix in this order and re-measure after each step. Keep the look: compare screenshots before and after.

**Benchmark** (Playwright + Chromium, script outside the repo):
- scroll top to bottom at a fixed speed with `page.mouse.wheel`;
- record rAF frame intervals (p50, p95, share > 20 ms), long tasks (`PerformanceObserver` type `longtask`) and CDP `Performance.getMetrics` (LayoutDuration, RecalcStyleDuration, ScriptDuration);
- run at 1440×900, and at 390×844 with 4× CPU throttling.

**Suspects and fixes, biggest first:**
1. **`backdrop-filter` over moving content** is re-blurred every frame. It is on `.btn-ghost`, `.lang`, `.hero-trust li`, `.skins`, `.hud-mic`, `.hero-toast`, mobile `.hero .hc-lead`, `.step`, `.wtab`, `.journey-caption`, `.daily-card`, `.nav.is-solid`, `.nav-sheet` and `.sticky-cta`. → Use semi-opaque backgrounds. Keep a blur only on the nav, and only under `@media (hover: hover)`.
2. **`#winter`**: the inline village SVG (9 SVG filters) repaints every frame because of the CSS-animated sleigh `#village-santa`. → Render the village as a WebP @2x and the sleigh as a separate small image moved with `transform`. Lower the snow canvas DPR from 2 to 1.5.
3. **Five separate scroll handlers**, several reading layout every frame:
   - nav;
   - nav progress (`scrollHeight`);
   - parallax + hero exit (`offsetHeight`);
   - wind trail (`getBoundingClientRect`, `getPointAtLength`);
   - journey (`getBoundingClientRect`, `offsetHeight`, plus each cloud's `offsetHeight` read between transform writes, which thrashes layout).

   → Use one rAF loop driven by `scrollY`. Cache sizes and offsets on resize, load, fonts ready and `updraft:lang`. Write only `transform` and `opacity` per frame.
4. **Hero**:
   - Drop `mix-blend-mode: screen` on the four `.leak` layers and `.sun-rays`; merge them into one layer without blending.
   - Endless repaint animations: `.hc-title` shimmer (background-position + drop-shadow), `.hero-word::after` sheen, `.hero-cta .btn-primary` glow (box-shadow). → Run them for a few iterations only, or animate the opacity of a pseudo-element.
   - Lower the hero canvas DPR from 1.5 to 1.25 (1 on phones).
   - Lighten the hero loop while scrolling, and stop it when less than ~25 % of the hero is visible (the IntersectionObserver threshold is 0.02 now).
5. **`will-change`**: add `will-change: transform` to `[data-px], [data-pxx]`, and transform + opacity to `#hero-copy`.
6. **Journey**: the biome SVGs have heavy filters. → Switch to WebP made from `../design/reference/biomes/*.png` (780×1688), and call `img.decode()` before the crossfade.
7. **Small fixes**:
   - drop the `drift` animation on the seam clouds (`.cdl img`), since parallax already moves them;
   - remove the no-op `transition: background 1.2s` on `.s-worlds`;
   - pause infinite CSS animations outside the viewport (an IntersectionObserver class + `animation-play-state: paused`).

### 3. Before launch (owner and legal)
- `privacy.html`: fill `[Publisher legal name]` and `[street, postcode and city]` in both the EN and SL blocks (ask the owner). Get a legal review, and keep the page in line with the Play Data safety form.
- The mailbox `support@updraft.si` must exist (or change `js/config.js → supportEmail`).
- When the privacy page is live and final:
  - set `PLACEHOLDER_PRIVACY_POLICY_URL` (now `null`) in `../updraft-android/app/src/main/kotlin/si/updraft/app/meta/ui/MetaInfoComponents.kt` to `https://deniskorinsek.github.io/Updraft-Web/privacy.html`;
  - use the same URL in the Play Console;
  - update `../LAUNCH_CHECKLIST.md`.
- Until the Play listing exists, the Play links open an error page. Keep the site unannounced, or switch the button copy to "coming soon" (`hero.cta`, `cta.btn`, `nav.cta`, both languages).
- Optional: the official Google Play badge and a custom domain (`CNAME`); see README.

Remove items here when they are done.
