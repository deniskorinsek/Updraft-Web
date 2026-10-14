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
| `index.html` | landing page: inline icon sprite, nav with scroll-progress feather, `#hero` (playable feather), `#how` (+ wind trail), `#flyers`, `#worlds` (+ sticky `#journey`), `#winter` (pre-rendered village + sleigh + snow canvas), `#daily` (+ screen marquee), `#privacy` strip, `#download` (button, QR, store link), sticky CTA on phones, footer |
| `privacy.html`, `support.html` | EN and SL as two blocks: `<div data-lang="en">` and `<div data-lang="sl" hidden>` |
| `404.html` | not-found page; fixes the base path for the `/Updraft-Web/` project URL at runtime |
| `css/site.css` | all styles, in this order: tokens (`:root`) → base → buttons → nav → hero → scroll reveal → sections → inner pages → motion layer → reduced motion (last block) |
| `js/config.js` | Play Store URL, optional official badge image, support e-mail, default language |
| `js/strings.js` | all landing-page copy: `window.UPDRAFT_STRINGS = { en: {…}, sl: {…} }` |
| `js/biomes.js` | biome list for the Worlds section (from `../design/specs/biomes.json`) |
| `js/site.js` | all behaviour, one IIFE (map below) |
| `assets/` | `brand/` (logo, icons, `og.jpg`, `qr-play.svg`), `flyers/` + `skins/`, `world/` (clouds, stars, `village_sleigh.svg`), `biomes/` (SVG reference, 1x WebP for the no-JS grid, `@2x.webp` for the journey phone, `village_scene@2x.webp`), `screens/` (app screenshots), `fonts/` (Cormorant Garamond + Jost, OFL), `icons.svg` |
| `README.md` | human docs: publishing, go-live checklist, editing copy |

`site.js`, top to bottom: config wiring → scroll hub (`onMeasure`, `onFrame`, one rAF per scroll) → i18n (`t()`, `fmt()`, `applyLang()`; fires the `updraft:lang` event) → nav (solid on scroll, mobile menu) → nav progress feather → sticky CTA (phones) → reveal (`.rv` gets `.in`) and `whenVisible()` → hero engine `initHero()` (canvas wind particles, feather physics, skins, microphone, altitude and sky, toast) → motion layer (`splitWords`, `pxMeasure`/`pxUpdate`, `initTrail`, marquee) → flyer card tilt → `initJourney()` → `initSnow()` → first `scTick()`.

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
  - Positions are cached in `pxMeasure()` (an `onMeasure` handler) and re-measured on resize, load, fonts ready, language change and body resize.
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

## Performance

Scrolling was measured and tuned on 14 Oct 2026 (see `../web-tools/`, outside the repo: `scrollbench.py` scrolls the page at a fixed speed in Playwright Chromium and records rAF frame intervals, long tasks, CDP metrics and a trace with dropped compositor frames; `shots.py` takes before/after section screenshots; `results/*.json` keeps every run). Rules that came out of it:

- **No `backdrop-filter`** except on `.nav.is-solid` under `@media (hover: hover)`. Glass surfaces are semi-opaque colours.
- **No `mix-blend-mode`.** The hero light leaks are four discs painted into one `.leaks` layer.
- **One scroll loop.** Every scroll-driven effect registers `onMeasure(fn)` (layout reads, cached) and `onFrame(fn)` (writes only: transform, opacity, classes) with the scroll hub at the top of `site.js`. Never add a second `scroll` listener or read layout in a frame handler. Measures re-run on resize, load, fonts ready, `updraft:lang` and when the body resizes.
- **Finite decorative animations** in the hero (shimmer and sheen run 3 times); the button glow fades a pseudo-element's shadow. Infinite animations must only touch transform or opacity.
- **Pre-rendered heavy art**: the winter village is `assets/biomes/village_scene@2x.webp` with the sleigh as `assets/world/village_sleigh.svg` moved by a transform (`cqw` units; without container-query support it stays still). The journey phone shows `assets/biomes/<id>@2x.webp` (from `../design/reference/biomes/*.png`, quality 80) and waits for `img.decode()` before the crossfade. The 1x `.webp` files serve the no-JS grid; the biome `.svg` files are kept for reference only.
- Canvas DPR caps: hero 1.25 (1 under 700 px wide), snow 1.5. The hero loop stops below 25 % visibility. Canvases are resized only when their size really changes (phones fire `resize` when the address bar moves, and resizing clears a canvas). A half-rate hero loop while scrolling was tried and removed: the particles stuttered.
- **Fast-scroll flicker** (fixed 14 Oct 2026, found in WebKit with `../web-tools/wkflick.py`): the Worlds sky colours are registered with `@property` and transition, so a fast scroll eases the background instead of strobing it through every biome; the journey phone crossfades at most every 600 ms and skips the biomes in between, and its caption follows the image shown; the marquee's scroll-linked drift is capped per frame. Keep any per-section colour change transitioned the same way.
- Tried and rejected: pausing CSS animations in off-screen sections (`animation-play-state`) caused layer churn and more dropped frames on desktop.

To re-measure: `cd ../web-tools && ./venv/bin/python scrollbench.py --label <name>` (add `--headed` for the real GPU), then compare with `results/baseline.json` / `results/gpu-baseline.json`.

## Open work (handover, 14 Oct 2026)

### Before launch (owner and legal)
- `privacy.html`: fill `[Publisher legal name]` and `[street, postcode and city]` in both the EN and SL blocks (ask the owner). Get a legal review, and keep the page in line with the Play Data safety form.
- The mailbox `support@updraft.si` must exist (or change `js/config.js → supportEmail`).
- When the privacy page is live and final:
  - set `PLACEHOLDER_PRIVACY_POLICY_URL` (now `null`) in `../updraft-android/app/src/main/kotlin/si/updraft/app/meta/ui/MetaInfoComponents.kt` to `https://deniskorinsek.github.io/Updraft-Web/privacy.html`;
  - use the same URL in the Play Console;
  - update `../LAUNCH_CHECKLIST.md`.
- Until the Play listing exists, the Play links open an error page. Keep the site unannounced, or switch the button copy to "coming soon" (`hero.cta`, `cta.btn`, `nav.cta`, both languages).
- Optional: the official Google Play badge and a custom domain (`CNAME`); see README.

Remove items here when they are done.
