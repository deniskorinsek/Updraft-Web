/* UPDRAFT promo site — behaviour. No dependencies. */
(function () {
  'use strict';

  var cfg = window.UPDRAFT_SITE || {};
  var STR = window.UPDRAFT_STRINGS || { en: {}, sl: {} };
  var BIOMES = window.UPDRAFT_BIOMES || [];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ------------------------------------------------------------ scroll hub */
  /* One requestAnimationFrame per scroll for every scroll-driven effect. Frame handlers get the cached scrollY and
     viewport height and only write transform / opacity / classes; everything that needs layout is read in the
     measure handlers, which run on resize, load, fonts ready, language change and when the body changes size.
     A frame handler returns true to be called again on the next frame (settling animations). */
  var SC = { y: window.scrollY, vh: window.innerHeight, t: 0, raf: 0, mraf: 0, upd: [], mea: [] };
  function onFrame(fn) { SC.upd.push(fn); }
  function onMeasure(fn) { SC.mea.push(fn); }
  function scTick() {
    SC.raf = 0; SC.y = window.scrollY; SC.vh = window.innerHeight; SC.t = performance.now();
    var again = false;
    for (var i = 0; i < SC.upd.length; i++) if (SC.upd[i](SC.y, SC.vh) === true) again = true;
    if (again) scKick();
  }
  function scKick() { if (!SC.raf) SC.raf = requestAnimationFrame(scTick); }
  function scMeasure() {
    SC.mraf = 0; if (SC.raf) { cancelAnimationFrame(SC.raf); SC.raf = 0; }
    for (var i = 0; i < SC.mea.length; i++) SC.mea[i]();
    scTick();                                                  /* same frame: no flash of unpositioned layers */
  }
  function scRemeasure() { if (!SC.mraf) SC.mraf = requestAnimationFrame(scMeasure); }
  window.addEventListener('scroll', scKick, { passive: true });
  window.addEventListener('resize', scRemeasure);
  window.addEventListener('load', scRemeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scRemeasure);
  document.addEventListener('updraft:lang', function () { setTimeout(scRemeasure, 60); });
  if ('ResizeObserver' in window) new ResizeObserver(scRemeasure).observe(document.body);
  setTimeout(scRemeasure, 1500);

  /* ---------------------------------------------------------------- config */
  if (cfg.playUrl) $$('a[data-play]').forEach(function (a) { a.href = cfg.playUrl; });
  if (cfg.supportEmail) $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + cfg.supportEmail; a.textContent = cfg.supportEmail; });
  $$('[data-play-text]').forEach(function (a) { a.textContent = (cfg.playUrl || a.href).replace(/^https?:\/\//, ''); });
  if (cfg.playBadge) {
    var badge = new Image();
    badge.onload = function () {
      $$('[data-play-badge]').forEach(function (a) {
        var im = document.createElement('img'); im.src = cfg.playBadge; im.alt = a.textContent.trim() || 'Google Play';
        a.className = 'play-badge-link'; a.innerHTML = ''; a.appendChild(im);
      });
    };
    badge.src = cfg.playBadge;
  }

  /* ------------------------------------------------------------------ i18n */
  var lang = 'en';
  function detectLang() {
    try { var s = localStorage.getItem('updraft-lang'); if (s === 'en' || s === 'sl') return s; } catch (e) {}
    var h = (location.hash || '').replace('#', '');
    if (h === 'sl' || h === 'en') return h;
    if (cfg.defaultLang === 'en' || cfg.defaultLang === 'sl') return cfg.defaultLang;
    var n = (navigator.language || '').toLowerCase();
    return n.indexOf('sl') === 0 ? 'sl' : 'en';
  }
  function t(key) {
    var d = STR[lang] || {};
    if (d[key] != null) return d[key];
    return STR.en && STR.en[key] != null ? STR.en[key] : null;
  }
  function fmt(n) { try { return Math.round(n).toLocaleString(lang === 'sl' ? 'sl-SI' : 'en-US'); } catch (e) { return String(Math.round(n)); } }
  function applyLang(l, persist) {
    lang = l;
    document.documentElement.lang = l;
    $$('[data-i18n]').forEach(function (el) { var v = t(el.getAttribute('data-i18n')); if (v != null) el.innerHTML = v; });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':'); if (i < 0) return;
        var v = t(pair.slice(i + 1).trim()); if (v != null) el.setAttribute(pair.slice(0, i).trim(), v);
      });
    });
    $$('[data-lang]').forEach(function (el) { el.hidden = el.getAttribute('data-lang') !== l; });
    $$('[data-lang-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === l)); });
    var title = t('meta.title'); if (title) document.title = title;
    var desc = t('meta.description'), m = $('meta[name="description"]'); if (desc && m) m.setAttribute('content', desc);
    if (persist) { try { localStorage.setItem('updraft-lang', l); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('updraft:lang', { detail: l }));
  }
  $$('[data-lang-set]').forEach(function (b) { b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang-set'), true); }); });
  applyLang(detectLang(), false);

  /* ------------------------------------------------------------------- nav */
  var nav = $('#nav');
  if (nav) {
    var navSolid = null;
    onFrame(function (y) { var on = y > 24; if (on !== navSolid) { navSolid = on; nav.classList.toggle('is-solid', on); } });
  }
  var menuBtn = $('#menu-btn'), menu = $('#menu');
  if (menuBtn && menu) {
    var setMenu = function (open) { menu.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ------------------------------------------------- nav: progress feather */
  var npBar = $('#np-bar'), npF = $('#np-feather');
  if (nav && npBar && npF) {
    var npY = window.scrollY, npVel = 0, npAng = -12, npMax = 1, npW = nav.clientWidth;
    onMeasure(function () { npMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); npW = nav.clientWidth; });
    onFrame(function (y) {
      var p = clamp(y / npMax, 0, 1), v = y - npY; npY = y;
      npVel += (v - npVel) * 0.25; if (Math.abs(npVel) < 0.05) npVel = 0;
      var target = reduced ? -12 : -12 + clamp(npVel * 0.9, -30, 30);
      npAng += (target - npAng) * 0.2;
      npBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      npF.style.transform = 'translate3d(' + (p * npW - 16).toFixed(1) + 'px,-50%,0) rotate(' + npAng.toFixed(1) + 'deg)';
      return npVel !== 0 || Math.abs(target - npAng) > 0.2;     /* keep settling after the scroll stops */
    });
  }

  /* ------------------------------------------------------------ sticky bar */
  var sticky = $('#sticky-cta'), heroEl = $('#hero'), dlEl = $('#download');
  if (sticky && heroEl && dlEl && 'IntersectionObserver' in window) {
    var heroOut = false, dlIn = false;
    var applySticky = function () { var on = heroOut && !dlIn; sticky.classList.toggle('is-on', on); sticky.setAttribute('aria-hidden', String(!on)); document.body.classList.toggle('has-sticky', on); };
    new IntersectionObserver(function (es) { es.forEach(function (e) { heroOut = !e.isIntersecting; }); applySticky(); }, { threshold: 0.15 }).observe(heroEl);
    new IntersectionObserver(function (es) { es.forEach(function (e) { dlIn = e.isIntersecting; }); applySticky(); }, { threshold: 0.2 }).observe(dlEl);
  }

  /* ---------------------------------------------------------------- reveal */
  var revealEls = $$('.rv');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) { io.observe(el); });
    /* anything already above the fold on load */
    setTimeout(function () { revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add('in'); }); }, 60);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* visibility helper: run a loop only while an element is on screen */
  function whenVisible(el, onShow, onHide) {
    if (!('IntersectionObserver' in window)) { onShow(); return; }
    var vis = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !vis) { vis = true; onShow(); } else if (!e.isIntersecting && vis) { vis = false; onHide(); } });
    }, { threshold: 0.05 }).observe(el);
  }

  /* ------------------------------------------------------------------ hero */
  /* A free-flying feather over a living sky. Pointer = steering (like tilt), hold / Space / microphone = blow,
     a short tap = Gust. Climbing scrolls the world down and turns the sky from golden hour to night. */
  var heroSec = $('#hero');
  if (heroSec && $('#zone')) initHero(heroSec);

  function initHero(hero) {
    var zone = $('#zone'), zoneTop = $('.zone-top', zone), zoneBottom = $('.zone-bottom', zone);
    var hf = $('#hf'), frames = $$('img', hf), ring = $('#hf-ring'), pulse = $('#hf-pulse'), pop = $('#hf-pop');
    var altEl = $('#hero-alt'), energyEl = $('#hero-energy'), label = $('#hero-label'), bestEl = $('#hero-best'), banner = $('#hero-banner');
    var toast = $('#hero-toast'), toastTitle = $('#hero-toast-title'), toastX = $('#hero-toast-x'), micBtn = $('#hero-mic');
    var canvas = $('#hero-fx'), ctx = canvas.getContext('2d');
    var skyDusk = $('#sky-dusk'), skyNight = $('#sky-night'), skyStars = $('#sky-stars'), sun = $('#sun');
    var clouds = $$('.hero-clouds .cl', hero).map(function (el) { return { el: el, px: parseFloat(el.getAttribute('data-climb')) || 0.4, wrap: !el.hasAttribute('data-nowrap'), top: 0, h: 0, tr: '' }; });
    var touchUI = window.matchMedia('(hover: none)').matches;
    var FEATHER_BIOMES = BIOMES.filter(function (b) { return b.world === 'feather'; });
    /* skin → trail colours from design/assets/manifest.json (trails) */
    var SKINS = {
      white:   { trail: ['#FF9FC6', '#FFE38F', '#8EF0E4', '#B5A3FF'], kind: 'ribbon', glow: 'rgba(255,236,200,.6)' },   /* Rainbow */
      peacock: { trail: ['#7BF2D6', '#B394FF'], kind: 'ribbon', glow: 'rgba(96,220,200,.65)' },                       /* Aurora Mist */
      fire:    { trail: ['#FFB347', '#FF6A3D'], kind: 'ember', glow: 'rgba(255,140,70,.8)' },                          /* Ember */
      ice:     { trail: ['#FFFFFF', '#BFE9FF'], kind: 'frost', glow: 'rgba(170,230,255,.8)' },                         /* Frost Dust */
      golden:  { trail: ['#F2C56B', '#FFE3A3'], kind: 'ribbon', glow: 'rgba(255,210,110,.85)' },                       /* Wind Streak */
      galaxy:  { trail: ['#FFFFFF', '#B5A3FF', '#FF9FC6'], kind: 'sparkle', glow: 'rgba(181,163,255,.85)' }            /* Snow Sparkle */
    };
    var BENDS = ['_bend_m100', '_bend_m050', '', '_bend_p050', '_bend_p100'];
    var PETALS = ['#F7B6C8', '#FFE1EA', '#FF9FC6', '#FFB15C', '#FFE38F'];
    var M_PER_PX = 0.9, TRAIL_T = 0.6;

    function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    function smooth(a, b, v) { var x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
    function mix(a, b, k) { return [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)]; }
    function bname(b) { return (lang === 'sl' && b.name_sl) ? b.name_sl : b.name; }

    var skin = 'white', palette = SKINS.white.trail.map(hexRgb), loaded = { white: true };
    var W = 0, H = 0, dpr = 1, Z = { l: 0, t: 0, w: 1, h: 1 }, fw = 200, fh = 104, rw = 250, rh = 195;
    var band = { l: 0, r: 0, t: 0, b: 0 }, home = { x: 0, y: 0 };
    var fx = 0, fy = 0, vx = 0, vy = 0, ang = 0, bend = 0, cam = 0, energy = 0, held = false, micOn = false, micLevel = 0;
    var time = 0, last = 0, running = false, visible = false, raf = 0, idleT = 0, autoT = 0, nextAuto = 4.5, lastUser = -99, quietT = 0;
    var userFlight = false, peak = 0, biome = 0, gustTime = 0, lastPerfect = -10, toastShown = false, sparkAcc = 0, streakAcc = 0;
    var holdStart = 0, holdX = 0, holdY = 0, holdMoved = 0, kbSteer = 0, noteUntil = 0, toastTimer = 0, placed = false;
    var ptr = { x: 0, y: 0, vx: 0, vy: 0, t: 0, active: false, last: -99, overZone: false };
    var parts = [], sparks = [], streaks = [], trail = [], SPR = {};
    var lastTD = -1, lastTN = -1, lastCam = -1, lastAltTxt = '', lastE = -1, frameN = 0;
    var best = 0; try { best = +localStorage.getItem('updraft-best') || 0; } catch (e) {}

    /* ---------- sprites (pre-rendered once) */
    function sprite(size, draw) { var c = document.createElement('canvas'); c.width = c.height = size * 2; var g = c.getContext('2d'); g.scale(2, 2); draw(g, size); return c; }
    SPR.mote = sprite(32, function (g, s) { var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,248,222,1)'); gr.addColorStop(0.22, 'rgba(255,227,163,.85)'); gr.addColorStop(1, 'rgba(255,177,92,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
    SPR.seed = sprite(40, function (g, s) {
      g.translate(s / 2, s / 2 - 4);
      for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, x = Math.cos(a) * 11, y = Math.sin(a) * 11;
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(x, y); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x, y, 1.1, 0, 6.283); g.fill(); }
      g.strokeStyle = 'rgba(255,246,228,.95)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 15); g.stroke();
      g.fillStyle = 'rgba(176,130,84,.95)'; g.beginPath(); g.ellipse(0, 16.5, 1.4, 2.6, 0, 0, 6.283); g.fill(); });
    SPR.bubble = sprite(48, function (g, s) {
      var c = s / 2, r = s / 2 - 3, gr = g.createLinearGradient(0, 0, s, s);
      gr.addColorStop(0, 'rgba(255,159,198,.95)'); gr.addColorStop(0.35, 'rgba(255,227,143,.9)'); gr.addColorStop(0.65, 'rgba(142,240,228,.95)'); gr.addColorStop(1, 'rgba(181,163,255,.95)');
      var f = g.createRadialGradient(c, c, r * 0.55, c, c, r); f.addColorStop(0, 'rgba(255,255,255,0)'); f.addColorStop(1, 'rgba(255,255,255,.22)');
      g.fillStyle = f; g.beginPath(); g.arc(c, c, r, 0, 6.283); g.fill();
      g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.arc(c, c, r, 0, 6.283); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(c - r * 0.42, c - r * 0.45, r * 0.24, r * 0.12, -0.7, 0, 6.283); g.fill(); });
    SPR.star = sprite(32, function (g, s) {
      var c = s / 2, gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(c, 0); g.quadraticCurveTo(c, c, s, c); g.quadraticCurveTo(c, c, c, s); g.quadraticCurveTo(c, c, 0, c); g.quadraticCurveTo(c, c, c, 0); g.fill(); });

    /* ---------- geometry */
    function measure() {
      var hr = hero.getBoundingClientRect(), zr = zone.getBoundingClientRect();
      if (!hr.width || !zr.width) return;
      W = hr.width; H = hr.height;
      Z = { l: zr.left - hr.left, t: zr.top - hr.top, w: zr.width, h: zr.height };
      fw = hf.offsetWidth || 200; fh = hf.offsetHeight || 104; rw = ring.offsetWidth || fw * 1.25; rh = ring.offsetHeight || rw * 0.78;
      var topB = zoneTop.getBoundingClientRect().bottom - hr.top, botT = zoneBottom.getBoundingClientRect().top - hr.top;
      band.l = Z.l + fw * 0.6; band.r = Z.l + Z.w - fw * 0.6;
      if (band.r < band.l) band.l = band.r = Z.l + Z.w / 2;
      band.t = topB + fh * 0.7; band.b = botT - fh * 0.75;
      if (band.b - band.t < fh * 0.6) { var mid = (topB + botT) / 2; band.t = mid - fh * 0.3; band.b = mid + fh * 0.3; }
      home.x = Z.l + Z.w / 2; home.y = band.t + (band.b - band.t) * 0.55;
      dpr = Math.min(W < 700 ? 1 : 1.25, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clouds.forEach(function (c) { c.el.style.transform = ''; var r = c.el.getBoundingClientRect(); c.top = r.top - hr.top; c.h = r.height; c.el.style.transform = c.tr; });
      if (!parts.length || Math.abs((parts.w || 0) - W) > 120) seedParticles();
      if (!placed) {
        placed = true;
        if (reduced) { fx = home.x; fy = home.y; }
        else { fx = Z.l + Z.w * 0.3; fy = Math.min(H + fh, Z.t + Z.h + fh); vx = Z.w * 0.35; vy = -Z.h * 2.2; }   /* swoop in from below */
      } else { fx = clamp(fx, band.l, band.r); fy = clamp(fy, band.t, Math.max(band.b, fy)); }
      placeToast();
      lastCam = -1;
    }
    var mq = 0;
    function remeasure() { if (!mq) mq = requestAnimationFrame(function () { mq = 0; measure(); if (reduced) drawStatic(); }); }

    /* ---------- ambient wind particles */
    function newPart(kind, anywhere) {
      var p = { kind: kind, x: Math.random() * W, y: anywhere ? Math.random() * H : H + 20 + Math.random() * 60, vx: 0, vy: 0,
        ph: Math.random() * 6.283, f: 0.4 + Math.random() * 0.8, depth: 0.55 + Math.random() * 0.7, rot: Math.random() * 6.283, vr: (Math.random() - 0.5) * 1.6 };
      if (kind === 'mote') { p.size = 6 + Math.random() * 14; p.a = 0.4 + Math.random() * 0.55; }
      else if (kind === 'seed') { p.size = 16 + Math.random() * 12; p.a = 0.8; }
      else if (kind === 'petal') { p.size = 3.5 + Math.random() * 4; p.col = PETALS[(Math.random() * PETALS.length) | 0]; p.a = 0.9; }
      else { p.size = 8 + Math.random() * 16; p.a = 0.75; }
      return p;
    }
    function seedParticles() {
      var small = W < 700, n = { mote: small ? 18 : 36, seed: small ? 5 : 10, petal: small ? 8 : 16, bubble: small ? 4 : 9 };
      parts = []; parts.w = W;
      Object.keys(n).forEach(function (k) { for (var i = 0; i < n[k]; i++) parts.push(newPart(k, true)); });
    }
    function stepParticles(dt, camDelta) {
      var bwx = 16 + Math.sin(time * 0.21) * 12, bwy = -20 - Math.sin(time * 0.13) * 6;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var wx = bwx * p.depth + Math.sin(time * p.f + p.ph) * 14, wy = bwy * p.depth + Math.cos(time * p.f * 0.8 + p.ph) * 9;
        if (p.kind === 'petal' || p.kind === 'seed') wy += 7;
        if (ptr.active) {
          var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 36100) { var fall = 1 - Math.sqrt(d2) / 190; p.vx += ptr.vx * fall * 2.4 * dt; p.vy += ptr.vy * fall * 2.4 * dt; }
        }
        if (energy > 0.1) { var bx = p.x - fx; if (bx > -240 && bx < 240 && p.y > fy - 60) p.vy -= energy * 300 * dt * (1 - Math.abs(bx) / 240); }
        var k = Math.min(1, dt * 0.9);
        p.vx += (wx - p.vx) * k; p.vy += (wy - p.vy) * k;
        p.x += p.vx * dt; p.y += p.vy * dt + camDelta * p.depth; p.rot += p.vr * dt;
        if (p.y < -40) { p.y = H + 30; p.x = Math.random() * W; p.vx = p.vy = 0; }
        else if (p.y > H + 50) { p.y = -30; p.x = Math.random() * W; p.vx = p.vy = 0; }
        if (p.x > W + 40) p.x = -30; else if (p.x < -40) p.x = W + 30;
      }
    }
    function drawParticles() {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], s = p.size;
        if (p.kind === 'mote') { ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(time * 2 + p.ph)); ctx.drawImage(SPR.mote, p.x - s / 2, p.y - s / 2, s, s); }
        else if (p.kind === 'bubble') { ctx.globalAlpha = p.a; ctx.drawImage(SPR.bubble, p.x - s / 2, p.y - s / 2, s, s); }
        else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = p.a;
          if (p.kind === 'seed') { ctx.rotate(Math.sin(time * 0.8 + p.ph) * 0.5); ctx.drawImage(SPR.seed, -s / 2, -s / 2, s, s); }
          else { ctx.rotate(p.rot); ctx.scale(Math.cos(time * 2.2 * p.f + p.ph), 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s, 0, 0, 6.283); ctx.fill(); }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }
    function burst(x, y, str) {
      for (var i = 0; i < parts.length; i++) { var p = parts[i], dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 360) { var f = (1 - d / 360) * str; p.vx += dx / d * f; p.vy += dy / d * f; } }
    }

    /* ---------- trail, sparkles, blow streaks */
    function tailPoint(k) { var a = ang * Math.PI / 180, ox = -fw * (k == null ? 0.3 : k), oy = fh * 0.12; return { x: fx + ox * Math.cos(a) - oy * Math.sin(a), y: fy + ox * Math.sin(a) + oy * Math.cos(a) }; }
    function trailColor(k) {
      var n = palette.length; if (n === 1) return palette[0];
      var pos = (((k * 0.9 + time * 0.35) % 1) + 1) % 1 * n, i = Math.floor(pos);
      return mix(palette[i % n], palette[(i + 1) % n], pos - i);
    }
    function pushTrail(camDelta) {
      for (var i = 0; i < trail.length; i++) trail[i].y += camDelta;
      var tp = tailPoint(); trail.push({ x: tp.x, y: tp.y, t: time });
      while (trail.length && time - trail[0].t > TRAIL_T) trail.shift();
    }
    function drawTrail() {
      var n = trail.length; if (n < 3) return;
      var base = SKINS[skin].kind === 'ribbon' ? fw * 0.08 : fw * 0.045;
      ctx.lineCap = 'round';
      for (var i = 1; i < n; i++) {
        var a = trail[i - 1], b = trail[i], k = i / (n - 1), life = 1 - (time - b.t) / TRAIL_T;
        if (life <= 0) continue;
        var dx = b.x - a.x, dy = b.y - a.y; if (dx * dx + dy * dy < 0.3) continue;
        var c = trailColor(k);
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.78 * life * k + 0.04).toFixed(3) + ')';
        ctx.lineWidth = Math.max(0.6, base * life * (0.3 + 0.7 * k));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    function emitSparks(dt) {
      var sp = Math.sqrt(vx * vx + vy * vy), rate = Math.max(0, (sp - 90) / 600) + energy * 1.5 + 0.06, kind = SKINS[skin].kind;
      sparkAcc += rate * dt * 24;
      while (sparkAcc >= 1) {
        sparkAcc -= 1;
        var tp = tailPoint(0.22), c = palette[(Math.random() * palette.length) | 0];
        sparks.push({ x: tp.x + (Math.random() - 0.5) * fw * 0.3, y: tp.y + (Math.random() - 0.5) * fh * 0.3, vx: -vx * 0.12 + (Math.random() - 0.5) * 50,
          vy: -vy * 0.12 + (Math.random() - 0.5) * 50 + (kind === 'ember' ? -46 : 14), life: 1, decay: 0.7 + Math.random() * 0.8, s: 4 + Math.random() * 7, c: c,
          star: kind === 'sparkle' || kind === 'frost' || Math.random() < 0.35 });
      }
      if (sparks.length > 200) sparks.splice(0, sparks.length - 200);
    }
    function spawnBurst(n) {
      for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = 90 + Math.random() * 260, c = palette[(Math.random() * palette.length) | 0];
        sparks.push({ x: fx, y: fy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 1, decay: 0.55 + Math.random() * 0.6, s: 5 + Math.random() * 10, c: c, star: Math.random() < 0.55, g: 1 }); }
    }
    function stepDrawSparks(dt, camDelta) {
      for (var i = sparks.length - 1; i >= 0; i--) {
        var p = sparks[i], dmp = Math.exp(-1.8 * dt);
        p.x += p.vx * dt; p.y += p.vy * dt + camDelta; p.vx *= dmp; p.vy *= dmp; if (p.g) p.vy += 120 * dt;
        p.life -= p.decay * dt; if (p.life <= 0) { sparks.splice(i, 1); continue; }
        var al = Math.min(1, p.life * 1.6), s = p.s * (0.6 + 0.4 * p.life);
        if (p.star) { ctx.globalAlpha = al; ctx.drawImage(SPR.star, p.x - s, p.y - s, s * 2, s * 2); }
        ctx.globalAlpha = al * 0.9; ctx.fillStyle = 'rgb(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, s * 0.32, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function emitStreaks(dt) {
      streakAcc += energy * 64 * dt;
      while (streakAcc >= 1) {
        streakAcc -= 1;
        streaks.push({ x: fx + (Math.random() - 0.5) * fw * 1.5, y: Math.min(H + 10, fy + fh * (1.1 + Math.random() * 1.8)), vy: -Z.h * (0.9 + Math.random() * 0.9) * (0.5 + energy),
          len: 14 + Math.random() * 36, w: 0.8 + Math.random() * 1.6, life: 1, decay: 1.1 + Math.random() * 0.6 });
      }
      if (streaks.length > 140) streaks.splice(0, streaks.length - 140);
    }
    function stepDrawStreaks(dt, camDelta) {
      ctx.lineCap = 'round';
      for (var i = streaks.length - 1; i >= 0; i--) {
        var s = streaks[i]; s.y += s.vy * dt + camDelta * 0.5; s.life -= s.decay * dt;
        if (s.life <= 0 || s.y < -50) { streaks.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(255,248,234,' + (s.life * 0.7).toFixed(3) + ')'; ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y + s.len); ctx.stroke();
      }
    }

    /* ---------- feedback */
    function popText(txt) { pop.textContent = txt; pop.style.setProperty('--px', fx.toFixed(1) + 'px'); pop.style.setProperty('--py', (fy + fh * 0.75).toFixed(1) + 'px'); pop.classList.remove('go'); void pop.offsetWidth; pop.classList.add('go'); }
    function pulseAt() { pulse.style.setProperty('--px', fx.toFixed(1) + 'px'); pulse.style.setProperty('--py', fy.toFixed(1) + 'px'); pulse.classList.remove('go'); void pulse.offsetWidth; pulse.classList.add('go'); }
    function showBanner(txt) { banner.textContent = txt; banner.classList.remove('is-on'); void banner.offsetWidth; banner.classList.add('is-on'); }
    function setLabel() {
      if (performance.now() < noteUntil) return;
      var blowing = held || (micOn && micLevel > 0.2);
      label.textContent = blowing ? t('hero.blow') : micOn ? t('hero.micOn') : t(touchUI ? 'hero.hintTouch' : 'hero.hintMouse');
      label.classList.toggle('is-live', blowing);
    }
    function note(msg, ms) { ms = ms || 2600; label.textContent = msg; label.classList.add('is-live'); noteUntil = performance.now() + ms; setTimeout(function () { noteUntil = 0; setLabel(); }, ms + 30); }
    function showBest() { if (best > 0) { bestEl.textContent = t('hero.best').replace('{alt}', fmt(best)); bestEl.hidden = false; } }
    function placeToast() {
      /* centred over the flight zone, just above the skin chips */
      var tw = Math.min(380, W - 32), th = toast.offsetHeight || 150;
      var x = clamp(Z.l + Z.w / 2 - tw / 2, 16, W - tw - 16), y = Math.max(Z.t + 8, band.b + fh * 0.75 - th - 8);
      toast.style.setProperty('--tx', x.toFixed(0) + 'px'); toast.style.setProperty('--ty', y.toFixed(0) + 'px');
    }
    function showToast(m) {
      toastTitle.textContent = t('hero.flight').replace('{alt}', fmt(m)); toast.dataset.alt = m;
      placeToast(); toast.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 10000);
    }
    function hideToast() { toast.classList.remove('is-on'); clearTimeout(toastTimer); }
    toastX.addEventListener('click', hideToast);

    function endFlight() {
      if (peak > best + 0.5) { best = Math.round(peak); try { localStorage.setItem('updraft-best', String(best)); } catch (e) {} showBest(); }
      if (peak >= 300 && !toastShown) { toastShown = true; showToast(Math.round(peak)); }
      userFlight = false; peak = 0; biome = 0;
    }
    function userAct() { lastUser = performance.now() / 1000; if (!userFlight) { userFlight = true; peak = 0; biome = 0; } hideToast(); wake(); }

    /* ---------- skins */
    function preload(name, cb) {
      if (loaded[name]) { if (cb) cb(); return; }
      var n = 0;
      BENDS.forEach(function (b) { var im = new Image(); im.onload = im.onerror = function () { if (++n === BENDS.length) { loaded[name] = true; if (cb) cb(); } }; im.src = 'assets/flyers/feather_' + name + b + '.svg'; });
    }
    function setSkin(name) {
      if (!SKINS[name]) return;
      $$('.skin', zone).forEach(function (s) { s.setAttribute('aria-checked', String(s.getAttribute('data-skin') === name)); });
      preload(name, function () {
        skin = name; palette = SKINS[name].trail.map(hexRgb);
        frames.forEach(function (f) { f.src = 'assets/flyers/feather_' + name + BENDS[+f.getAttribute('data-bend') + 2] + '.svg'; });
        hf.style.setProperty('--glow', SKINS[name].glow);
        if (!reduced) { spawnBurst(26); burst(fx, fy, 260); }
        pulseAt(); showBanner(t('skin.' + name)); wake();
      });
    }
    $$('.skin', zone).forEach(function (btn, i, all) {
      btn.addEventListener('click', function () { hideToast(); setSkin(btn.getAttribute('data-skin')); });
      btn.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault(); var nb = all[(i + d + all.length) % all.length]; nb.focus(); setSkin(nb.getAttribute('data-skin'));
      });
      btn.addEventListener('pointerenter', function () { preload(btn.getAttribute('data-skin')); });
    });
    setTimeout(function () { Object.keys(SKINS).forEach(function (k) { preload(k); }); }, 4500);

    /* ---------- input: pointer (steer), hold (blow), tap (gust), keyboard */
    function setHeld(v) { if (held === v) return; held = v; zone.classList.toggle('is-blowing', v); setLabel(); }
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' && !held) return;
      var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now() / 1000;
      if (ptr.active) {
        var dtp = Math.max(0.008, now - ptr.t);
        ptr.vx += (clamp((x - ptr.x) / dtp, -3000, 3000) - ptr.vx) * 0.35; ptr.vy += (clamp((y - ptr.y) / dtp, -3000, 3000) - ptr.vy) * 0.35;
      }
      ptr.x = x; ptr.y = y; ptr.t = now; ptr.active = true; ptr.last = now; lastUser = now;
      ptr.overZone = zone.contains(e.target);
      wake();
    });
    hero.addEventListener('pointerleave', function () { ptr.active = false; ptr.vx = ptr.vy = 0; ptr.overZone = false; });
    zone.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, a')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'mouse') e.preventDefault();
      try { zone.setPointerCapture(e.pointerId); } catch (err) {}
      var r = hero.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.t = performance.now() / 1000; ptr.last = ptr.t; ptr.active = true;
      holdStart = performance.now(); holdX = e.clientX; holdY = e.clientY; holdMoved = 0;
      setHeld(true); userAct();
    });
    zone.addEventListener('pointermove', function (e) { if (held) holdMoved = Math.max(holdMoved, Math.abs(e.clientX - holdX) + Math.abs(e.clientY - holdY)); });
    zone.addEventListener('pointerup', function (e) {
      if (!held) return;
      var quick = performance.now() - holdStart < 220 && holdMoved < 10;
      setHeld(false);
      if (quick) { vy -= Z.h * 1.25; if (!reduced) { burst(fx, fy, 420); spawnBurst(16); } pulseAt(); popText(t('hero.gust')); }
      if (e.pointerType === 'touch') ptr.active = false;
    });
    zone.addEventListener('pointercancel', function () { setHeld(false); ptr.active = false; });
    zone.addEventListener('lostpointercapture', function () { setHeld(false); });
    zone.addEventListener('keydown', function (e) {
      if (e.target !== zone) return;
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (!held) { setHeld(true); userAct(); } }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); kbSteer = e.key === 'ArrowLeft' ? -1 : 1; userAct(); }
    });
    zone.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp') setHeld(false);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') kbSteer = 0;
    });
    window.addEventListener('blur', function () { setHeld(false); kbSteer = 0; });

    /* ---------- microphone: analysed in the browser only, never recorded or sent anywhere */
    var stream = null, actx = null, analyser = null, buf = null, floor = null, calibUntil = 0;
    function stopMic() {
      micOn = false; micLevel = 0;
      if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
      if (actx) { try { actx.close(); } catch (e) {} }
      stream = actx = analyser = null; micBtn.setAttribute('aria-pressed', 'false'); setLabel();
    }
    function startMic() {
      if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { note(t('hero.micUnsupported'), 3200); return; }
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
        stream = s; var AC = window.AudioContext || window.webkitAudioContext; actx = new AC();
        var src = actx.createMediaStreamSource(s); analyser = actx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.3; src.connect(analyser);
        buf = new Float32Array(analyser.fftSize); floor = null; calibUntil = performance.now() + 1200; micOn = true;
        micBtn.setAttribute('aria-pressed', 'true'); note(t('hero.micCalib'), 1500); userAct();
        s.getTracks()[0].addEventListener('ended', stopMic);
      }).catch(function () { note(t('hero.micDenied'), 3200); });
    }
    function readMic(now) {
      if (!analyser) return 0;
      analyser.getFloatTimeDomainData(buf);
      var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      var rms = Math.sqrt(s / buf.length);
      if (now < calibUntil) { floor = floor == null ? rms : floor * 0.85 + rms * 0.15; return 0; }
      var lvl = clamp((rms - Math.max(0.012, (floor || 0) * 2.6 + 0.006)) / 0.11, 0, 1);
      micLevel += (lvl - micLevel) * (lvl > micLevel ? 0.5 : 0.18);
      if (micLevel > 0.2) lastUser = now / 1000;
      return micLevel;
    }
    micBtn.addEventListener('click', function () { if (micOn) stopMic(); else startMic(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && micOn) stopMic(); });

    /* ---------- the loop */
    function frame(nowMs) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (nowMs - SC.t < 160 && (++frameN & 1)) return;        /* while the page scrolls, run at half rate */
      var dt = last ? Math.min(0.05, (nowMs - last) / 1000) : 0.016; last = nowMs; time += dt;
      var nowS = nowMs / 1000;

      /* input → energy (touch ramps to full lift in ~250 ms, like Touch Mode) */
      var blow = held ? 1 : micOn ? readMic(nowMs) : 0;
      if (!reduced && !held && !micOn && time > nextAuto) {
        if (nowS - lastUser > 6 && !ptr.overZone) autoT = 0.7;           /* idle demo puff */
        nextAuto = time + 7.5 + Math.random() * 4;
      }
      if (autoT > 0) { autoT -= dt; blow = Math.max(blow, 0.62); }
      energy += (blow - energy) * Math.min(1, dt * (blow > energy ? 8 : 3));
      if (energy < 0.003) energy = 0;
      if (micOn) setLabel();

      /* steering target */
      var de = Math.exp(-5 * dt); ptr.vx *= de; ptr.vy *= de;
      if (kbSteer) { ptr.x = clamp(fx + kbSteer * 80, band.l, band.r); ptr.y = fy; ptr.last = nowS; ptr.active = true; }
      var steering = ptr.active && nowS - ptr.last < 2.5;
      var amp = reduced ? 0 : 1;
      var idleX = home.x + (band.r - band.l) * 0.32 * Math.sin(time * 0.36) * amp;
      var idleY = home.y + (band.b - band.t) * 0.3 * Math.sin(time * 0.69 + 1.2) * amp;
      var tx = clamp(steering ? ptr.x : idleX, band.l, band.r);
      var ax = (tx - fx) * (steering ? 5.5 : 1.5) - vx * (steering ? 3.3 : 1.6), ay;
      if (energy > 0.04) { ay = (1.15 - energy * 3.0) * Z.h; }
      else {
        var ty = clamp(steering && !touchUI ? home.y + (ptr.y - home.y) * 0.3 : idleY, band.t, band.b);
        ay = (ty - fy) * 1.9 - vy * 1.8;
      }
      vx += ax * dt; vy += ay * dt;
      if (energy > 0.04) vy *= Math.exp(-1.6 * dt);
      fx += vx * dt; fy += vy * dt;

      /* camera: rising past the top of the band climbs the world */
      var camDelta = 0;
      if (fy < band.t) { camDelta = band.t - fy; cam += camDelta; fy = band.t; }
      idleT = energy < 0.05 ? idleT + dt : 0;
      if (idleT > 1.1 && cam > 0) { var dc = Math.min(cam, (Z.h * 0.75 + cam * 0.6) * dt); cam -= dc; camDelta -= dc; }

      /* altitude, biome banners, best, end of flight */
      var alt = (userFlight || cam > 0) ? (cam + Math.max(0, home.y - fy)) * M_PER_PX : 0;
      if (userFlight) {
        if (alt > peak) peak = alt;
        var bi = 0; for (var i = 0; i < FEATHER_BIOMES.length; i++) if (alt >= FEATHER_BIOMES[i].alt[0]) bi = i;
        if (bi > biome) { biome = bi; showBanner(bname(FEATHER_BIOMES[bi])); }
        if (cam <= 0 && idleT > 1.6) endFlight();
      }
      var txt = fmt(alt); if (txt !== lastAltTxt) { altEl.textContent = txt; lastAltTxt = txt; }
      if (Math.abs(energy - lastE) > 0.004) { energyEl.style.transform = 'scaleX(' + energy.toFixed(3) + ')'; lastE = energy; }

      /* sky: golden hour → dusk → high-sky night with stars */
      var tD = smooth(1200, 3000, alt), tN = smooth(3500, 5000, alt);
      if (Math.abs(tD - lastTD) > 0.004 || Math.abs(tN - lastTN) > 0.004) {
        skyDusk.style.opacity = tD.toFixed(3); skyNight.style.opacity = tN.toFixed(3); skyStars.style.opacity = tN.toFixed(3);
        sun.style.opacity = (1 - 0.9 * tN).toFixed(3);
        sun.style.transform = 'translate(-50%, calc(-50% + ' + ((tD * 0.06 + tN * 0.22) * H).toFixed(1) + 'px))';
        lastTD = tD; lastTN = tN;
      }
      if (cam !== lastCam) {
        for (var c = 0; c < clouds.length; c++) {
          var cl = clouds[c], off = cam * cl.px;
          if (cl.wrap) { var span = H + cl.h + 40; off = off % span; if (cl.top + off > H + 10) off -= span; }
          else off = Math.min(off, H * 0.85);
          cl.tr = 'translate3d(0,' + off.toFixed(1) + 'px,0)'; cl.el.style.transform = cl.tr;
        }
        lastCam = cam;
      }

      /* Gust window → Perfect Gust */
      if (userFlight && energy > 0.82) gustTime += dt; else gustTime = Math.max(0, gustTime - dt * 2);
      ring.classList.toggle('is-on', gustTime > 0.45);
      if (gustTime > 1.15 && time - lastPerfect > 3.2) { lastPerfect = time; gustTime = 0.2; popText(t('hero.perfect')); pulseAt(); if (!reduced) { burst(fx, fy, 380); spawnBurst(30); } }

      /* the feather: sway, flutter, bank with speed, bend frames from vertical speed */
      var sway = reduced ? 0 : Math.sin(time * 1.2) * 5 + Math.sin(time * 2.7) * 1.5;
      var flutter = (!reduced && energy > 0.25) ? Math.sin(time * 24) * 1.8 * energy : 0;
      var target = clamp(vx * 0.03, -20, 20) + clamp(vy * 0.012, -10, 10) + sway + flutter;
      ang += (target - ang) * Math.min(1, dt * 6);
      var up = -vy / Z.h, nb = up > 0.55 ? 2 : up > 0.16 ? 1 : up < -0.42 ? -2 : up < -0.14 ? -1 : 0;
      if (nb !== bend) { bend = nb; for (var f = 0; f < frames.length; f++) frames[f].classList.toggle('is-on', +frames[f].getAttribute('data-bend') === bend); }
      hf.style.transform = 'translate3d(' + (fx - fw / 2).toFixed(1) + 'px,' + (fy - fh / 2).toFixed(1) + 'px,0) rotate(' + ang.toFixed(2) + 'deg)';
      ring.style.transform = 'translate3d(' + (fx - rw / 2).toFixed(1) + 'px,' + (fy - rh / 2).toFixed(1) + 'px,0)';

      /* canvas */
      ctx.clearRect(0, 0, W, H);
      var animate = !reduced || held || micOn || energy > 0;
      if (animate) stepParticles(dt, camDelta);
      drawParticles();
      if (!reduced) {
        pushTrail(camDelta); drawTrail();
        emitSparks(dt);
        if (energy > 0.15) emitStreaks(dt);
      }
      stepDrawStreaks(dt, camDelta); stepDrawSparks(dt, camDelta);

      /* with reduced motion, stop the loop once everything has settled */
      if (reduced) {
        var calm = !held && !micOn && energy === 0 && cam === 0 && Math.abs(vx) + Math.abs(vy) < 2 && !sparks.length && !streaks.length;
        quietT = calm ? quietT + dt : 0;
        if (quietT > 0.6) { running = false; cancelAnimationFrame(raf); }
      }
    }
    function drawStatic() { if (!W) return; ctx.clearRect(0, 0, W, H); drawParticles(); hf.style.transform = 'translate3d(' + (fx - fw / 2).toFixed(1) + 'px,' + (fy - fh / 2).toFixed(1) + 'px,0)'; }
    function start() { if (running) return; running = true; last = 0; quietT = 0; raf = requestAnimationFrame(frame); }
    function wake() { if (visible && !running) start(); }
    function stop() { running = false; cancelAnimationFrame(raf); setHeld(false); if (micOn) stopMic(); }

    measure(); showBest(); setLabel();
    if (reduced) drawStatic();
    else setTimeout(function () { pulseAt(); spawnBurst(18); }, 1000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    window.addEventListener('resize', remeasure);
    if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(hero);
    setTimeout(remeasure, 1300);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.intersectionRatio >= 0.25; if (visible) start(); else stop(); }); }, { threshold: [0, 0.25, 0.5] }).observe(hero);
    } else { visible = true; start(); }
    document.addEventListener('updraft:lang', function () {
      setLabel(); showBest();
      if (toast.classList.contains('is-on')) toastTitle.textContent = t('hero.flight').replace('{alt}', fmt(+toast.dataset.alt || 0));
      remeasure();
    });
  }

  /* ======================================================================
     motion layer: parallax, word-by-word headings, wind trail, marquee
     ====================================================================== */

  /* ------------------------------------------------------- split headings */
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          if (!ch.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'), i = document.createElement('span');
            o.className = 'sw'; o.setAttribute('aria-hidden', 'true'); i.className = 'sw-i'; i.textContent = w;
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !ch.classList.contains('sw')) walk(ch);
      });
    })(el);
    $$('.sw-i', el).forEach(function (s, n) { s.style.transitionDelay = (0.08 + n * 0.06).toFixed(2) + 's'; });
  }
  if (!reduced) {
    var splitAll = function () { $$('.split').forEach(splitWords); };
    splitAll();
    document.addEventListener('updraft:lang', splitAll);
  }

  /* ------------------------------------------------------------- parallax */
  /* data-px = k: the layer moves (1 − k)× the page speed (k > 0 = farther away, k < 0 = closer). data-pxx adds sideways drift. */
  var pxItems = [], heroEl2 = $('#hero'), heroSky = $('#hero-sky'), heroClouds = $('#hero-clouds'), heroCopy = $('#hero-copy'), copyIsBox = true, heroH = 0;
  function pxMeasure() {
    var els = $$('[data-px], [data-pxx]'), sy = window.scrollY;
    els.forEach(function (el) { el.style.transform = 'none'; });          /* measure untransformed: one layout for all of them */
    pxItems = els.map(function (el) {
      var r = el.getBoundingClientRect();
      return { el: el, top: r.top + sy, h: r.height, k: parseFloat(el.getAttribute('data-px')) || 0, kx: parseFloat(el.getAttribute('data-pxx')) || 0, max: parseFloat(el.getAttribute('data-pxmax')) || 1e4, tr: '' };
    });
    heroH = heroEl2 ? heroEl2.offsetHeight : 0;
    copyIsBox = !!heroCopy && getComputedStyle(heroCopy).display !== 'contents';
    if (heroCopy && !copyIsBox) { heroCopy.style.transform = ''; heroCopy.style.opacity = ''; }
  }
  function pxUpdate(sy, vh) {
    var mid = sy + vh / 2;
    for (var i = 0; i < pxItems.length; i++) {
      var p = pxItems[i];
      if (p.top + p.h < sy - vh * 0.6 || p.top > sy + vh * 1.6) continue;
      var d = p.top + p.h / 2 - mid, ty = clamp(-d * p.k, -p.max, p.max), tx = -d * p.kx;
      var tr = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      if (tr !== p.tr) { p.tr = tr; p.el.style.transform = tr; }
    }
    /* hero exit: the sky falls behind, the cloud floor rushes past, the words drift away */
    if (heroEl2 && sy < heroH + 120) {
      if (heroSky) heroSky.style.transform = 'translate3d(0,' + (sy * 0.42).toFixed(1) + 'px,0)';
      if (heroClouds) heroClouds.style.transform = 'translate3d(0,' + (-sy * 0.14).toFixed(1) + 'px,0)';
      if (heroCopy && copyIsBox) { heroCopy.style.transform = 'translate3d(0,' + (sy * 0.22).toFixed(1) + 'px,0)'; heroCopy.style.opacity = clamp(1 - sy / (heroH * 0.85), 0, 1).toFixed(3); }
    }
  }
  if (!reduced) { onMeasure(pxMeasure); onFrame(pxUpdate); pxMeasure(); pxUpdate(window.scrollY, window.innerHeight); }

  /* ------------------------------------------- how it works: the wind trail */
  var trailBox = $('#wind-trail');
  if (trailBox) initTrail(trailBox);

  function initTrail(box) {
    var svg = $('svg', box), base = $('.wt-base', box), draw = $('.wt-draw', box), rings = $$('.wt-ring', box), fea = $('.wt-feather', box);
    var steps = $$('#how .step'), len = 0, ringT = [], boxTop = 0, samples = [], N = 160, lastP = -1, lit = [];
    function fracAtX(x) { var lo = 0, hi = len; for (var k = 0; k < 22; k++) { var m = (lo + hi) / 2; if (draw.getPointAtLength(m).x < x) lo = m; else hi = m; } return lo / len; }
    function build() {
      len = 0; samples = []; lastP = -1;
      if (getComputedStyle(box).display === 'none') return;
      var r = box.getBoundingClientRect(); if (!r.width) return;
      var W = r.width, H = r.height; boxTop = r.top + window.scrollY;
      svg.setAttribute('viewBox', '0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0));
      var xs = steps.map(function (s) { var b = s.getBoundingClientRect(); return b.left - r.left + b.width / 2; });
      if (xs.length < 3) return;
      var pts = [[-14, H * 0.84], [xs[0], H * 0.6], [xs[1], H * 0.28], [xs[2], H * 0.56], [W + 14, H * 0.1]];
      var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
      for (var i = 0; i < pts.length - 1; i++) {                         /* Catmull-Rom through the rings */
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
             (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
      }
      base.setAttribute('d', d); draw.setAttribute('d', d);
      len = draw.getTotalLength(); draw.style.strokeDasharray = len.toFixed(1);
      for (var s = 0; s <= N; s++) { var q = draw.getPointAtLength(len * s / N); samples.push(q.x, q.y); }
      ringT = rings.map(function (rg, i) { rg.style.setProperty('--x', pts[i + 1][0].toFixed(1) + 'px'); rg.style.setProperty('--y', pts[i + 1][1].toFixed(1) + 'px'); return fracAtX(pts[i + 1][0]); });
      update(window.scrollY, window.innerHeight);
    }
    function update(y, vh) {
      if (!len) return;
      var p = reduced ? 1 : clamp((vh * 0.84 - (boxTop - y)) / (vh * 0.56), 0, 1);
      if (p === lastP) return; lastP = p;
      draw.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
      var f = p * (N - 1), i = Math.floor(f), k = f - i, j = 2 * i;
      var ax = samples[j] + (samples[j + 2] - samples[j]) * k, ay = samples[j + 1] + (samples[j + 3] - samples[j + 1]) * k;
      var ang = Math.atan2(samples[j + 3] - samples[j + 1], samples[j + 2] - samples[j]) * 180 / Math.PI;
      fea.style.transform = 'translate(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px) rotate(' + (ang + 22).toFixed(1) + 'deg)';
      for (var n = 0; n < rings.length; n++) { var on = p >= ringT[n] - 0.005; if (on !== lit[n]) { lit[n] = on; rings[n].classList.toggle('lit', on); if (steps[n]) steps[n].classList.toggle('lit', on); } }
    }
    onMeasure(build); onFrame(update); build();
  }

  /* --------------------------------------- daily: marquee follows the scroll */
  var mqBox = $('.marquee'), mqTrack = $('#marquee-track');
  if (mqBox && mqTrack && !reduced) {
    mqBox.classList.add('js-on');
    var mqX = 0, mqLast = 0, mqRun = false, mqHover = false, mqSy = window.scrollY, mqHalf = 0, mqRaf = 0;
    var mqMeasure = function () { mqHalf = mqTrack.scrollWidth / 2; };
    var mqFrame = function (now) {
      if (!mqRun) return;
      mqRaf = requestAnimationFrame(mqFrame);
      var dt = mqLast ? Math.min(0.05, (now - mqLast) / 1000) : 0.016; mqLast = now;
      var sy = window.scrollY, dy = sy - mqSy; mqSy = sy;
      mqX += (mqHover ? 0 : 36 * dt) + dy * 0.6;
      if (mqHalf > 0) mqX = ((mqX % mqHalf) + mqHalf) % mqHalf;
      mqTrack.style.transform = 'translate3d(' + (-mqX).toFixed(1) + 'px,0,0)';
    };
    mqBox.addEventListener('pointerenter', function () { mqHover = true; });
    mqBox.addEventListener('pointerleave', function () { mqHover = false; });
    mqMeasure(); window.addEventListener('resize', mqMeasure); window.addEventListener('load', mqMeasure);
    whenVisible(mqBox, function () { mqRun = true; mqLast = 0; mqSy = window.scrollY; mqRaf = requestAnimationFrame(mqFrame); }, function () { mqRun = false; cancelAnimationFrame(mqRaf); });
  }

  /* ----------------------------------------------------------- flyer cards */
  if (canHover && !reduced) {
    $$('[data-tilt]').forEach(function (card) {
      var art = $('.flyer-art.has-frames', card), fr = art ? $$('.fr', art) : [];
      card.addEventListener('pointerenter', function () { card.style.transition = 'transform .35s cubic-bezier(.2,0,0,1), box-shadow .5s cubic-bezier(.2,0,0,1)'; });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + (dx * 7).toFixed(2) + 'deg) rotateX(' + (-dy * 5).toFixed(2) + 'deg) translateY(-4px)';
        if (fr.length) { var b = dx < -0.3 ? -2 : dx < -0.1 ? -1 : dx < 0.1 ? 0 : dx < 0.3 ? 1 : 2; fr.forEach(function (f) { f.classList.toggle('is-on', +f.getAttribute('data-bend') === b); }); }
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; fr.forEach(function (f) { f.classList.toggle('is-on', f.getAttribute('data-bend') === '0'); }); });
    });
  }

  /* ----------------------------------------------------- worlds: the ascent */
  var track = $('#journey');
  if (track && BIOMES.length) initJourney(track);

  function initJourney(track) {
    var section = $('#worlds'), list = $('#journey-list'), layers = [$('#journey-a'), $('#journey-b')], altEl = $('#journey-alt');
    var worldEl = $('#journey-world'), biomeEl = $('#journey-biome'), kEl = $('#journey-k'), tabs = $$('.wtab', section);
    var world = 'feather', items = [], idx = -1, active = 0, trackTop = 0, trackH = 0, lastAlt = '', swapId = 0;
    var WORLD_KEY = { feather: 'worlds.tab.feather', bubble: 'worlds.tab.bubble', winter: 'worlds.tab.winter' };
    var jClouds = $$('.journey-clouds img', section).map(function (im) { return { el: im, k: parseFloat(im.getAttribute('data-jk')) || 0.5, y0: parseFloat(im.getAttribute('data-jy')) || 0, h: 80, tr: '' }; });
    var K_KEY = { feather: 'worlds.k.feather', bubble: 'worlds.k.bubble', winter: 'worlds.k.winter' };

    function name(b) { return (lang === 'sl' && b.name_sl) ? b.name_sl : b.name; }
    function altText(b) { var a = b.alt[0], z = b.alt[1]; return z > 50000 ? fmt(a) + ' m +' : fmt(a) + '–' + fmt(z) + ' m'; }
    function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; }

    function buildList() {
      items = BIOMES.filter(function (b) { return b.world === world; });
      list.innerHTML = items.map(function (b) { return '<li><span>' + name(b) + '</span><span class="alt num">' + altText(b) + '</span></li>'; }).join('');
      items.forEach(function (b) { var im = new Image(); im.src = 'assets/biomes/' + b.id + '@2x.webp'; });
      if (worldEl) worldEl.textContent = t(WORLD_KEY[world]);
      if (kEl) { var k = t(K_KEY[world]); if (k) kEl.innerHTML = k; }
    }
    function setBiome(i, force) {
      if (i === idx && !force) return;
      var b = items[i]; if (!b) return;
      var next = layers[1 - active], cur = layers[active], src = 'assets/biomes/' + b.id + '@2x.webp', id = ++swapId;
      idx = i;
      var show = function () {                                   /* crossfade only once the image is decoded */
        if (id !== swapId) return;                               /* a newer biome has taken over */
        next.classList.add('is-on'); cur.classList.remove('is-on'); active = 1 - active;
      };
      if (next.getAttribute('src') !== src) { next.src = src; if (next.decode) next.decode().then(show, show); else show(); }
      else show();
      if (biomeEl) biomeEl.textContent = name(b);
      $$('li', list).forEach(function (li, j) { li.classList.toggle('is-on', j === i); });
      var s = b.sky, a = s[0], bb = s[1] || s[0], c = s[s.length - 2] || s[0], d = s[s.length - 1];
      section.style.setProperty('--sky-a', a); section.style.setProperty('--sky-b', bb); section.style.setProperty('--sky-c', c); section.style.setProperty('--sky-d', d);
      var dark = (lum(a) + lum(d)) / 2 < 0.5;
      section.classList.toggle('is-dark', dark); section.classList.toggle('light', !dark);
    }
    function measure() {
      var r = track.getBoundingClientRect(); trackTop = r.top + window.scrollY; trackH = track.offsetHeight;
      jClouds.forEach(function (c) { c.h = c.el.offsetHeight || 80; });
    }
    function update(y, vh) {
      var top = trackTop - y, total = trackH - vh;
      if (total <= 0 || top > vh * 1.5 || top + trackH < -vh * 0.5) return;        /* far off screen */
      var p = clamp(-top / total, 0, 1), n = items.length, f = p * n, i = Math.min(n - 1, Math.floor(f)), seg = clamp(f - i, 0, 1);
      setBiome(i);
      if (!reduced) {
        for (var c = 0; c < jClouds.length; c++) {
          var cl = jClouds[c], span = vh + cl.h, cy = ((cl.y0 * vh - top * cl.k) % span + span) % span - cl.h;
          var tr = 'translate3d(0,' + cy.toFixed(1) + 'px,0)'; if (tr !== cl.tr) { cl.tr = tr; cl.el.style.transform = tr; }
        }
      }
      var b = items[i], a0 = b.alt[0], a1 = b.alt[1] > 50000 ? a0 + 2500 : b.alt[1];
      var txt = fmt(Math.round((a0 + seg * (a1 - a0)) / 10) * 10);
      if (altEl && txt !== lastAlt) { lastAlt = txt; altEl.textContent = txt; }
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        world = tab.getAttribute('data-world');
        tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === tab)); });
        buildList(); idx = -1; measure(); update(window.scrollY, window.innerHeight);
        if (window.scrollY > trackTop) window.scrollTo({ top: trackTop + 2, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
    document.addEventListener('updraft:lang', function () { buildList(); setBiome(Math.max(0, idx), true); lastAlt = ''; measure(); update(window.scrollY, window.innerHeight); });
    buildList(); setBiome(0, true); measure(); update(window.scrollY, window.innerHeight);
    onMeasure(measure); onFrame(update);
  }

  /* ----------------------------------------------------------- winter snow */
  var snow = $('#winter-snow');
  if (snow && !reduced) initSnow(snow);

  function initSnow(canvas) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, flakes = [], running = false, raf = 0, last = 0;
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = []; for (var i = 0; i < 90; i++) flakes.push(make(true));
    }
    function make(any) { return { x: Math.random() * W, y: any ? Math.random() * H : -6, r: 0.8 + Math.random() * 2.2, v: 14 + Math.random() * 30, ph: Math.random() * 6.28, a: 0.45 + Math.random() * 0.5 }; }
    function frame(now) {
      if (!running) return; raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#FFFFFF';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i]; f.y += f.v * dt; f.ph += dt * 0.9; f.x += Math.sin(f.ph) * 10 * dt + 4 * dt;
        if (f.y > H + 6) flakes[i] = f = make(false);
        ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    resize(); window.addEventListener('resize', resize);
    whenVisible(canvas, function () { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } }, function () { running = false; cancelAnimationFrame(raf); });
  }

  scTick();                                                  /* first frame of the scroll-driven effects */
})();
