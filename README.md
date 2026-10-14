# Updraft-Web — the UPDRAFT promo website

Static landing page for the UPDRAFT Android game, built for GitHub Pages (repository name `Updraft-Web`). No build step, no framework, no tracking: plain HTML, CSS and JavaScript, with the fonts and art shipped in the repo.

- `index.html` — the landing page (hero with a playable feather: move to steer, hold / Space / microphone to blow, tap for a Gust, climb from golden hour to the night sky, six skins to try; how it works, flyers, the worlds ascent, Winter Winds, daily progression, privacy strip, download). The Google Play link appears in the header, the hero, after the flyers, in the download section (button, QR code and the written store link), the footer and, on phones, a sticky bar that follows the visitor once the hero scrolls away.
- `privacy.html` — privacy policy (English + Slovenian)
- `support.html` — FAQ and contact (English + Slovenian)
- `404.html` — custom not-found page
- `css/site.css` — all styling; the colour and type tokens come from `design/tokens/design-tokens.json`
- `js/config.js` — **the only file you normally need to edit**: Play Store URL, support e-mail, default language
- `js/strings.js` — all landing-page copy in EN and SL
- `js/biomes.js` — the biome list for the Worlds section (from `design/specs/biomes.json`)
- `js/site.js` — behaviour: language switch, hero flight demo, parallax and scroll animations, scroll-progress feather in the nav, worlds ascent, snow, menu
- `assets/` — logos, flyer sprites, biome art, store screenshots, app screens, fonts (OFL), QR code

## Animation and parallax

- **Parallax:** any element with `data-px="k"` moves at (1 − k)× the page speed while scrolling: `k > 0` puts it farther away (sky, stars, far clouds), `k < 0` brings it closer (near clouds, the flying golden feather). `data-pxx` adds sideways drift. Change the numbers in `index.html` to tune the depth.
- **Scroll moments:** the hero sky falls behind as you leave it; headings rise word by word; a feather rides a wind trail through the three "How it works" steps and lights each one; flyer cards tilt up into place; cloud banks bridge the sky changes between sections; clouds slide past the phone during the worlds ascent; the screen marquee follows your scroll; a golden feather flies up into the download section.
- **Accessibility:** with *Reduce motion* turned on in the operating system, all of this is switched off and the page shows its final, still state.

Everything in `assets/` was exported from the design package v1.3; replace it from a newer package instead of editing it by hand. This folder is independent of the Android app — nothing here is used by the app build.

## Publish on GitHub Pages

1. Create a repository named `Updraft-Web` and push the **contents** of this folder to its root (`index.html` must be at the top level). For example: `cd Updraft-Web && git init && git add -A && git commit -m "UPDRAFT website" && git branch -M main && git remote add origin https://github.com/deniskorinsek/Updraft-Web.git && git push -u origin main`.
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. After a minute the site is live at `https://deniskorinsek.github.io/Updraft-Web/`. Every push to `main` republishes it.

`.nojekyll` is included so GitHub serves the files exactly as they are.

### Custom domain (optional)

Add a file named `CNAME` containing the domain (for example `updraft.si`), point the domain's DNS at GitHub Pages (A/AAAA records or a CNAME to `deniskorinsek.github.io`), then enable **Enforce HTTPS** in the Pages settings. The microphone demo needs HTTPS, which GitHub Pages provides on both the default and custom domains.

## Before going live — checklist

| What | Where | Why |
|---|---|---|
| Final site URL | set to `https://deniskorinsek.github.io/Updraft-Web/` in `index.html`, `privacy.html`, `support.html` (canonical link and `og:` tags); change it there if you move to a custom domain | Share previews on WhatsApp, Slack, X and Facebook need absolute URLs |
| Privacy policy URL in the app and Play Console | `https://deniskorinsek.github.io/Updraft-Web/privacy.html` → `PLACEHOLDER_PRIVACY_POLICY_URL` in `updraft-android` (see `LAUNCH_CHECKLIST.md`) and the Play Console store listing | Required for `RECORD_AUDIO`, ads and analytics |
| Play Store link | `js/config.js → playUrl`, and the matching `href`s in the HTML (`grep -n "si.updraft" *.html`) | The app ID `si.updraft` is provisional (GDD DEC-01) and may change before the first upload |
| QR code | regenerate after changing the link: `python3 -c "import segno; segno.make('https://play.google.com/store/apps/details?id=si.updraft', error='m').save('assets/brand/qr-play.svg', scale=6, border=2, dark='#241D14', light=None)"` (`pip install segno`) | The QR on the download section encodes the store URL |
| Support mailbox | `js/config.js → supportEmail` | Shown on the support and privacy pages; the mailbox must exist |
| Publisher identity | `privacy.html`: `[Publisher legal name]` and `[street, postcode and city]` in both the EN and the SL block | GDPR requires the controller's name and address |
| Privacy policy review | `privacy.html` | The text follows the GDD's privacy-by-design rules (§396, §494) and the launch SDK list; have it checked by legal before the Play Console submission and keep it in sync with the Data safety form |
| Official Google Play badge (optional) | download the badge from Google's badge generator (play.google.com/intl/en_us/badges/), save it as `assets/brand/google-play-badge.png` and set `playBadge: "assets/brand/google-play-badge.png"` in `js/config.js`; the hero and download buttons then show the badge automatically | The site ships with its own gold buttons so no Google artwork is redistributed without the licence; Google's brand guidelines apply to the badge |
| "Coming soon" period | until the listing is live, the Play link returns an error page; either keep the site private or change the button copy in `js/strings.js` (`hero.cta`, `cta.btn`, `nav.cta`) | Pre-registration pages can use the same link once the listing exists |

## Editing copy

- Landing page: every text is in `js/strings.js`, once in `en` and once in `sl`. The English text is also written in the HTML as the no-JavaScript fallback, so change both when you edit a sentence.
- Privacy and support pages: the English and Slovenian versions are two blocks in the HTML (`<div data-lang="en">` and `<div data-lang="sl">`); the toggle in the header shows one of them.
- The language opens from the visitor's saved choice, otherwise from the browser language (Slovenian browsers get SL), otherwise English. `js/config.js → defaultLang` can force one.

## Local preview

Open the folder with any static server, for example `python3 -m http.server 8000` and then `http://localhost:8000/`. Opening `index.html` directly from disk also works, except that the microphone demo falls back to "hold to blow" (the microphone needs HTTPS or localhost).

## Credits

Fonts: Cormorant Garamond and Jost, SIL Open Font License (licence texts in `assets/fonts/`). Google Play is a trademark of Google LLC. Art, logo and copy © 2026 UPDRAFT.
