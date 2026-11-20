/* ==========================================================================
   Hangjie Lin — site script
   1. Hero entrance (after the opening sequence)
   2. Navigation
   3. Research core
   4. Publications: filter and "Cite" buttons
   5. Cut 1: papers as sediment layers
   6. Cuts 2 and 3: tide wipe and sunset, driven by scroll
   7. Field: footprint map, transect, justified gallery
   8. Videos
   9. Lightbox
   10. Cite this website
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (t) => t * t * (3 - 2 * t);
  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  /* ------------------------------------------------------------------------
     1. HERO ENTRANCE: name and portrait fade in on load
     ------------------------------------------------------------------------ */
  function initHero() {
    const hero = $('.hero');
    if (hero) requestAnimationFrame(() => hero.classList.add('is-in'));
  }

  /* ------------------------------------------------------------------------
     2. NAVIGATION
     ------------------------------------------------------------------------ */
  function initNav() {
    const nav = $('#nav');
    const nameEl = $('.name');
    if (nav && nameEl) {
      new IntersectionObserver(([e]) => nav.classList.toggle('is-scrolled', !e.isIntersecting),
        { rootMargin: '-60px 0px 0px 0px' }).observe(nameEl);
    }
    const dusk = $('.dusk');
    if (nav && dusk) {
      new IntersectionObserver(([e]) => nav.classList.toggle('is-dusk', e.isIntersecting),
        { rootMargin: '0px 0px -100% 0px' }).observe(dusk);
    }
    const links = new Map($$('.nav ul a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a, id) => a.setAttribute('aria-current', String(id === e.target.id)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    const top = document.getElementById('top');
    if (top) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', 'false'));
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(top);
    }
  }

  /* ------------------------------------------------------------------------
     3. RESEARCH CORE: highlight the stratum being read
     ------------------------------------------------------------------------ */
  function initCore() {
    const rows = $$('.core-row');
    if (!rows.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        rows.forEach((r) => r.classList.toggle('is-active', r.dataset.target === e.target.id));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    $$('.theme').forEach((t) => io.observe(t));
  }

  /* ------------------------------------------------------------------------
     4. PUBLICATIONS
     ------------------------------------------------------------------------ */
  function initPubs() {
    const list = $('.pub-list');
    if (!list) return;
    const pubs = $$('.pub', list);
    const groups = $$('.pub-group', list);
    const count = (k) => (k === 'all' ? pubs.length : pubs.filter((p) => p.dataset.kind === k).length);
    const buttons = $$('.pub-filter button');
    buttons.forEach((b) => {
      const n = $('.n', b);
      if (n) n.textContent = `\u2009${count(b.dataset.filter)}`;
      b.addEventListener('click', () => {
        const f = b.dataset.filter;
        buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        pubs.forEach((p) => { p.hidden = !(f === 'all' || p.dataset.kind === f); });
        groups.forEach((g) => { g.hidden = $$('.pub', g).every((p) => p.hidden); });
        list.classList.remove('is-filtering');
        void list.offsetWidth;
        list.classList.add('is-filtering');
      });
    });
    addCiteButtons(pubs);
  }

  // A small "Cite" button that copies a plain-text reference.
  function addCiteButtons(pubs) {
    pubs.forEach((p) => {
      const doi = $('.doi', p);
      const group = p.closest('.pub-group');
      const yearText = group ? (group.dataset.year || $('h3', group).textContent.trim()) : '';
      const year = /^\d{4}$/.test(yearText) ? yearText : 'n.d.';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cite';
      btn.textContent = 'Cite';
      btn.setAttribute('aria-label', 'Copy citation');
      btn.addEventListener('click', async () => {
        const au = $('.au', p)?.textContent.trim() || '';
        const t = $('.t', p)?.textContent.trim() || '';
        const v = $('.v', p)?.textContent.trim() || `${$('.note', p)?.textContent.trim() || ''}.`;
        const ref = `${au} (${year}). ${t} ${v}${doi ? ` https://doi.org/${doi.textContent.trim()}` : ''}`.replace(/\s+/g, ' ').trim();
        const ok = await copyText(ref);
        btn.textContent = ok ? 'Copied' : 'Copy failed';
        setTimeout(() => { btn.textContent = 'Cite'; }, 1600);
      });
      (doi || $('.t', p)).after(btn);
      btn.before(document.createTextNode(' '));
    });
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------------
     5. CUT 1: PAPERS AS SEDIMENT
     One layer per year, thickness proportional to the number of
     peer-reviewed papers; the darker band in each layer is first-author
     work. Layers settle from the bottom up, oldest first, as a core forms.
     ------------------------------------------------------------------------ */
  const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
    'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
    'Twenty-one', 'Twenty-two', 'Twenty-three', 'Twenty-four', 'Twenty-five', 'Twenty-six', 'Twenty-seven',
    'Twenty-eight', 'Twenty-nine', 'Thirty'];

  function initStrata() {
    const host = $('#strata');
    if (!host) return;
    const years = [];
    $$('.pub-group').forEach((g) => {
      const y = parseInt($('h3', g).textContent, 10);
      if (!y) return;
      const ps = $$('.pub', g);
      years.push({ y, first: ps.filter((p) => p.dataset.kind === 'first').length, collab: ps.filter((p) => p.dataset.kind === 'collab').length });
    });
    if (!years.length) return;
    years.sort((a, b) => b.y - a.y);                      // newest on top
    const total = years.reduce((s, d) => s + d.first + d.collab, 0);
    const n = $('#strata-n');
    if (n) n.textContent = NUMBER_WORDS[total] || String(total);
    const unit = 15;                                      // px per paper
    const tex = ['lith-dots', 'lith-mud', 'lith-water', 'lith-marsh'];
    years.forEach((d, i) => {
      const count = d.first + d.collab;
      const layer = document.createElement('div');
      layer.className = 'stratum';
      layer.style.setProperty('--h', `${12 + unit * count}px`);
      layer.style.setProperty('--f', String(count ? d.first / count : 0));
      layer.style.setProperty('--i', String(years.length - 1 - i)); // deposition order: oldest first
      layer.innerHTML = `<span class="stratum-fill ${tex[d.y % tex.length]}"><span class="stratum-first"></span></span>` +
        `<span class="stratum-label"><b>${d.y}</b> ${count} paper${count === 1 ? '' : 's'}` +
        `${d.first ? `, ${d.first} first-author` : ''}</span>`;
      host.appendChild(layer);
    });
    host.setAttribute('aria-label', 'Peer-reviewed papers per year, newest on top: ' +
      years.map((d) => `${d.y}, ${d.first + d.collab}`).join('; ') + '.');
    if (reduced()) { host.classList.add('is-in'); return; }
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { host.classList.add('is-in'); obs.disconnect(); }
    }, { threshold: 0.25 }).observe(host);
  }

  /* ------------------------------------------------------------------------
     6. SCROLL-DRIVEN CUTS
     Each element gets --p from 0 (entering) to 1 (leaving its scroll
     range). The tide cut floods a photo from the bottom with a wavy edge;
     the sunset cut lowers the sun below the horizon.
     ------------------------------------------------------------------------ */
  function initCuts() {
    const tide = $('.cut-tide');
    const sunset = $('.cut-sunset');
    const tideImg = tide ? $('img', tide) : null;
    if (!tide && !sunset) return;
    if (reduced()) {
      tide?.style.setProperty('--p', '1');
      sunset?.style.setProperty('--p', '0.6');
      return;
    }
    // 0 when the element's top reaches the bottom of the viewport,
    // 1 when its bottom leaves the top.
    const progress = (el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      return clamp((vh - r.top) / (vh + r.height), 0, 1);
    };
    // For the sticky tide cut: 0 just before the photo pins, 1 as it unpins.
    const pinned = (el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      return clamp((vh * 0.3 - r.top) / (r.height - vh + vh * 0.3), 0, 1);
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      if (tide) {
        const p = pinned(tide);
        // The photo is uncovered below a rising, gently moving waterline.
        const k = smooth(clamp(p / 0.75, 0, 1));
        const w = tide.clientWidth, h = tideImg ? tideImg.clientHeight : tide.clientHeight;
        const level = h * (1 - k);
        const pts = [];
        const ph = p * 14;
        for (let x = 0; x <= w + 30; x += 30) pts.push(`${x}px ${(level + 9 * Math.sin(x / 85 + ph) + 5 * Math.sin(x / 31 - ph * 1.7)).toFixed(1)}px`);
        if (tideImg) tideImg.style.clipPath = k >= 0.999 ? 'none' : `polygon(${pts.join(',')}, ${w}px ${h + 20}px, 0px ${h + 20}px)`;
        tide.style.setProperty('--p', k.toFixed(3));
      }
      if (sunset) sunset.style.setProperty('--p', progress(sunset).toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ------------------------------------------------------------------------
     7. FIELD
     ------------------------------------------------------------------------ */
  // Hovering a name in the site list highlights it on the map, and back.
  function initFootprint() {
    const fig = $('.footprint');
    if (!fig) return;
    const all = $$('[data-site]', fig);
    const set = (id) => all.forEach((el) => el.classList.toggle('is-on', el.dataset.site === id));
    all.forEach((el) => {
      el.addEventListener('pointerenter', () => set(el.dataset.site));
      el.addEventListener('pointerleave', () => set(null));
    });
  }

  function initTransect() {
    const svg = $('.transect svg');
    if (!svg) return;
    const marker = $('.tr-marker', svg);
    const zoneRects = new Map($$('.tr-zone', svg).map((r) => [r.dataset.zone, r]));
    const tabs = new Map($$('.zone-tabs a').map((a) => [a.dataset.zone, a]));
    const centers = {};
    zoneRects.forEach((r, z) => { centers[z] = +r.getAttribute('x') + +r.getAttribute('width') / 2; });

    let scrollZone = null, hoverZone = null;
    const show = () => {
      const z = hoverZone || scrollZone;
      zoneRects.forEach((r, k) => r.classList.toggle('is-on', k === z));
      tabs.forEach((a, k) => a.classList.toggle('is-on', k === z));
      if (z) { marker.classList.add('is-on'); marker.style.transform = `translate(${centers[z]}px, 0px)`; }
      else marker.classList.remove('is-on');
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) scrollZone = e.target.dataset.zone; });
      show();
    }, { rootMargin: '-45% 0px -45% 0px' });
    $$('.zone').forEach((z) => io.observe(z));
    const field = $('#field');
    if (field) new IntersectionObserver(([e]) => { if (!e.isIntersecting) { scrollZone = null; show(); } }).observe(field);
    $$('.zone').forEach((zone) => {
      $$('.photo', zone).forEach((p) => {
        p.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hoverZone = zone.dataset.zone; show(); } });
        p.addEventListener('pointerleave', () => { hoverZone = null; show(); });
      });
    });
  }

  /* Justified rows: try every way of splitting a zone's photos into
     consecutive rows and keep the split whose row heights sit closest to
     the target height. Zones are small, so brute force is instant. */
  function layoutPhotos(box) {
    const figs = $$('.photo', box);
    if (!figs.length) return;
    const W = box.clientWidth;
    if (!W) return;
    const gap = parseFloat(getComputedStyle(box).columnGap) || 10;
    const ars = figs.map((f) => parseFloat(f.style.getPropertyValue('--ar')) || 1.33);
    const target = W < 560 ? 160 : W < 900 ? 210 : 245;
    const n = ars.length;
    let best = null;
    for (let mask = 0; mask < (1 << (n - 1)); mask++) {
      const rows = [];
      let row = [0];
      for (let i = 1; i < n; i++) {
        if (mask & (1 << (i - 1))) { rows.push(row); row = [i]; } else row.push(i);
      }
      rows.push(row);
      let cost = 0;
      const heights = rows.map((r) => {
        const sum = r.reduce((a, i) => a + ars[i], 0);
        const h = (W - gap * (r.length - 1)) / sum;
        const over = h > target * 1.45 ? (h - target * 1.45) * 6 : 0;
        cost += Math.pow(h - target, 2) * r.length + Math.pow(over, 2);
        return h;
      });
      if (!best || cost < best.cost) best = { cost, rows, heights };
    }
    $$('.photo-break', box).forEach((b) => b.remove());
    best.rows.forEach((r, ri) => {
      const h = best.heights[ri];
      r.forEach((i) => { figs[i].style.width = `${Math.floor(ars[i] * h * 100) / 100 - 0.1}px`; });
      if (ri < best.rows.length - 1) {
        const br = document.createElement('div');
        br.className = 'photo-break';
        figs[r[r.length - 1]].after(br);
      }
    });
    box.classList.add('is-justified');
  }

  function initGallery() {
    const boxes = $$('.photos');
    if (!boxes.length) return;
    const ro = new ResizeObserver((entries) => entries.forEach((e) => layoutPhotos(e.target)));
    boxes.forEach((b) => { layoutPhotos(b); ro.observe(b); });
  }

  /* ------------------------------------------------------------------------
     8. VIDEOS: silent loops that play while on screen, unless the visitor
     prefers reduced motion or pressed pause.
     ------------------------------------------------------------------------ */
  function initVideos() {
    const boxes = $$('.movie-box');
    if (!boxes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = $('video', e.target);
        if (!v) return;
        if (e.isIntersecting && !reduced() && !e.target.dataset.userPaused) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.5 });
    boxes.forEach((box) => {
      const v = $('video', box);
      const btn = $('.movie-toggle', box);
      if (!v || !btn) return;
      const sync = () => {
        btn.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
        btn.classList.toggle('is-playing', !v.paused);
      };
      v.addEventListener('play', sync);
      v.addEventListener('pause', sync);
      btn.addEventListener('click', () => {
        if (v.paused) { delete box.dataset.userPaused; v.play().catch(() => {}); }
        else { box.dataset.userPaused = '1'; v.pause(); }
      });
      sync();
      io.observe(box);
    });
  }

  /* ------------------------------------------------------------------------
     9. LIGHTBOX
     ------------------------------------------------------------------------ */
  function initLightbox() {
    const dlg = $('#lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const img = $('img', dlg);
    const cap = $('.lb-caption', dlg);
    const cnt = $('.lb-count', dlg);
    const prev = $('.lb-prev', dlg);
    const next = $('.lb-next', dlg);
    let items = [];
    let idx = 0;

    const show = (i) => {
      idx = (i + items.length) % items.length;
      const a = items[idx];
      const thumb = $('img', a);
      img.src = a.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = a.dataset.caption || '';
      cnt.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : '';
      prev.hidden = next.hidden = items.length < 2;
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = '';
      if (items.length > 1) { const n = new Image(); n.src = items[(idx + 1) % items.length].getAttribute('href'); }
    };

    const all = $$('a.zoom-link, .photo a');
    all.forEach((a) => {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        const g = a.dataset.group;
        items = g ? all.filter((o) => o.dataset.group === g) : [a];
        show(items.indexOf(a));
        dlg.showModal();
      });
    });

    prev.addEventListener('click', () => show(idx - 1));
    next.addEventListener('click', () => show(idx + 1));
    $('.lb-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', (e) => {
      if (items.length < 2) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    });
    dlg.addEventListener('close', () => { img.removeAttribute('src'); });

    let sx = null;
    img.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    img.addEventListener('pointerup', (e) => {
      if (sx === null || items.length < 2) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* ------------------------------------------------------------------------
     10. CITE THIS WEBSITE
     ------------------------------------------------------------------------ */
  function initCiteSite() {
    const btn = $('#cite-site');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.ref || '');
      const label = btn.textContent;
      btn.textContent = ok ? 'Copied to clipboard' : 'Copy failed';
      setTimeout(() => { btn.textContent = label; }, 1800);
    });
  }

  /* ------------------------------------------------------------------------ */
  function init() {
    initHero();
    initNav();
    initCore();
    initPubs();
    initStrata();
    initCuts();
    initFootprint();
    initTransect();
    initGallery();
    initVideos();
    initLightbox();
    initCiteSite();
    console.log('%cHello, curious reader. Everything here is plain HTML, CSS and JavaScript.',
                'font-family: Georgia, serif; font-size: 13px; color: #1E5A77;');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
