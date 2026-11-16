/* =========================================================
   PROAM BELTS – Redesign v2 interactions (vanilla JS) – v3 fixed
   ========================================================= */
(function () {
  'use strict';
 
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const on = (el, ev, fn, opt) => { if (el) el.addEventListener(ev, fn, opt); };
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let lastFocus = null;
 
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
 
  ready(function () {
 
    /* ---------- missing-image placeholders ---------- */
    function markMissing(img) { const p = img.closest('.ph'); if (p) p.classList.add('is-missing'); }
    $$('.ph img').forEach(img => {
      on(img, 'error', () => markMissing(img));
      if (img.complete && img.naturalWidth === 0) markMissing(img);
    });
 
    /* ---------- sticky header state ---------- */
    const hdr = $('#hdr');
    function onScroll() { if (hdr) hdr.classList.toggle('is-stuck', window.scrollY > 10); }
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();
 
    /* ---------- desktop dropdowns ---------- */
    function closeDropdowns() {
      $$('.has-dd').forEach(li => {
        li.classList.remove('is-open');
        const b = $('button', li); if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
    $$('.has-dd').forEach(li => {
      const btn = $('button', li);
      on(btn, 'click', e => {
        e.stopPropagation();
        const open = !li.classList.contains('is-open');
        closeDropdowns();
        li.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    on(document, 'click', closeDropdowns);
 
    /* ---------- focus trap ---------- */
    function trap(box, e) {
      if (e.key !== 'Tab') return;
      const f = $$('a[href],button:not([disabled]),input,summary', box).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
 
    /* ---------- mobile drawer ---------- */
    const drawer = $('#drawer'), scrim = $('#scrim'), burger = $('#burger'), drawerClose = $('#drawerClose');
    function openDrawer() {
      if (!drawer) return;
      lastFocus = document.activeElement;
      if (scrim) scrim.hidden = false;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (burger) burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (drawerClose) drawerClose.focus();
    }
    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (burger) burger.setAttribute('aria-expanded', 'false');
      if (scrim) scrim.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    on(burger, 'click', openDrawer);
    on(drawerClose, 'click', closeDrawer);
    on(scrim, 'click', closeDrawer);
    on(drawer, 'keydown', e => trap(drawer, e));
    on(drawer, 'click', e => { if (e.target.closest('a')) closeDrawer(); });
    on(window, 'resize', () => {
      if (drawer && window.innerWidth > 991 && drawer.classList.contains('is-open')) closeDrawer();
    });
 
    /* ---------- search overlay ---------- */
    const search = $('#search');
    function openSearch() {
      if (!search) return;
      lastFocus = document.activeElement; search.hidden = false;
      document.body.style.overflow = 'hidden';
      const q = $('#q'); if (q) q.focus();
    }
    function closeSearch() {
      if (!search) return;
      search.hidden = true; document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    on($('#searchOpen'), 'click', openSearch);
    on($('#searchClose'), 'click', closeSearch);
    on(search, 'keydown', e => trap(search, e));
    on(search, 'click', e => { if (e.target === search) closeSearch(); });
 
    /* ---------- quick-view modal ---------- */
    const qv = $('#qvModal');
    function openQV(card) {
      if (!qv || !card) return;
      lastFocus = document.activeElement;
      const img = $('#qvImg'), mi = $('.modal__img', qv);
      if (img) { img.src = card.dataset.img; img.alt = card.dataset.name; }
      if (mi) {
        mi.classList.remove('is-missing');
        mi.setAttribute('data-label', (card.dataset.img || '').split('/').pop());
      }
      const t = $('#qvTitle'), p = $('#qvPrice'), l = $('#qvLink');
      if (t) t.textContent = card.dataset.name;
      if (p) p.textContent = card.dataset.price;
      if (l) l.href = card.dataset.url;
      qv.hidden = false; document.body.style.overflow = 'hidden';
      const c = $('#qvClose'); if (c) c.focus();
    }
    function closeQV() {
      if (!qv) return;
      qv.hidden = true; document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    $$('.pcard__qv').forEach(b => on(b, 'click', () => openQV(b.closest('.pcard'))));
    on($('#qvClose'), 'click', closeQV);
    on(qv, 'click', e => { if (e.target === qv) closeQV(); });
    on(qv, 'keydown', e => trap(qv, e));
 
    /* ---------- gallery filter (with counts) + lightbox ---------- */
    const chips = $$('.chip2');
    const shots = $$('#masonry .shot');
    const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
    let lbList = [], lbIdx = 0, lbOpener = null;
 
    chips.forEach(c => {
      const f = c.dataset.f;
      const n = f === 'all' ? shots.length : shots.filter(s => s.dataset.cat === f).length;
      if (!c.querySelector('em')) c.insertAdjacentHTML('beforeend', '<em>' + n + '</em>');
      on(c, 'click', () => {
        chips.forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-selected', String(x === c)); });
        shots.forEach(s => s.classList.toggle('is-off', f !== 'all' && s.dataset.cat !== f));
      });
    });
 
    const visibleShots = () => shots.filter(s => !s.classList.contains('is-off'));
    function showLB(n) {
      if (!lbList.length || !lbImg) return;
      lbIdx = (n + lbList.length) % lbList.length;
      const s = lbList[lbIdx], im = $('img', s);
      if (!im) return;
      lbImg.src = im.currentSrc || im.src;
      lbImg.alt = im.alt;
      const b = $('b', s), sp = $('figcaption span', s);
      if (lbCap) lbCap.innerHTML = (b ? b.textContent : '') + (sp ? '<small>' + sp.textContent + '</small>' : '');
    }
    function openLB(shot) {
      if (!lb || shot.classList.contains('is-missing')) return;
      lbList = visibleShots();
      lbOpener = $('.shot__btn', shot);
      lb.hidden = false; document.body.style.overflow = 'hidden';
      showLB(lbList.indexOf(shot));
      const c = $('#lbClose'); if (c) c.focus();
    }
    function closeLB() {
      if (!lb) return;
      lb.hidden = true; document.body.style.overflow = '';
      if (lbOpener) lbOpener.focus();
    }
    shots.forEach(s => on($('.shot__btn', s), 'click', () => openLB(s)));
    on($('#lbClose'), 'click', closeLB);
    on($('#lbPrev'), 'click', () => showLB(lbIdx - 1));
    on($('#lbNext'), 'click', () => showLB(lbIdx + 1));
    on(lb, 'click', e => { if (e.target === lb) closeLB(); });
    on(lb, 'keydown', e => trap(lb, e));
 
    /* ---------- global keys: Escape + lightbox arrows ---------- */
    on(document, 'keydown', e => {
      if (lb && !lb.hidden) {
        if (e.key === 'ArrowLeft')  { showLB(lbIdx - 1); return; }
        if (e.key === 'ArrowRight') { showLB(lbIdx + 1); return; }
      }
      if (e.key !== 'Escape') return;
      if (lb && !lb.hidden) closeLB();
      else if (qv && !qv.hidden) closeQV();
      else if (search && !search.hidden) closeSearch();
      else if (drawer && drawer.classList.contains('is-open')) closeDrawer();
      else closeDropdowns();
    });
 
    /* ---------- category expanding panels (autoplay) ---------- */
    (function () {
      const panels = $$('.cats .panel');
      if (!panels.length) return;
      let active = 0, auto = null;
      function activate(i) {
        panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
        active = i;
      }
      function stop() { clearInterval(auto); auto = null; }
      function start() {
        stop();
        if (reduce) return;
        auto = setInterval(() => activate((active + 1) % panels.length), 3000);
      }
      panels.forEach((p, i) => {
        on(p, 'mouseenter', () => { stop(); activate(i); });
        on(p, 'mouseleave', start);
        on(p, 'focus', () => { stop(); activate(i); });
      });
      activate(0); start();
    })();
 
    /* ---------- featured rail ---------- */
    (function () {
      const rail = $('#rail'), prev = $('#railPrev'), next = $('#railNext'), bar = $('#railBar');
      if (!rail) return;
      const step = () => { const c = $('.pcard', rail); return c ? c.getBoundingClientRect().width + 24 : 300; };
      function railState() {
        const max = rail.scrollWidth - rail.clientWidth;
        const pct = max > 0 ? rail.scrollLeft / max : 0;
        const vis = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1;
        if (bar) {
          bar.style.width = Math.max(vis, .12) * 100 + '%';
          bar.style.transform = 'translateX(' + pct * (1 / Math.max(vis, .12) - 1) * 100 + '%)';
        }
        if (prev) prev.disabled = rail.scrollLeft < 4;
        if (next) next.disabled = rail.scrollLeft > max - 4;
      }
      on(prev, 'click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
      on(next, 'click', () => rail.scrollBy({ left:  step(), behavior: 'smooth' }));
      on(rail, 'scroll', railState, { passive: true });
      on(rail, 'keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); if (next) next.click(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); if (prev) prev.click(); }
      });
      on(window, 'resize', railState);
      railState();
    })();
 
    /* =====================================================
       SPOTLIGHT TABS (Global Domination) – FIXED
       Syncs: aria-selected + tabindex + .is-on + [hidden] + display
       ===================================================== */
    (function () {
      const tabs = $$('.tab2'), panels = $$('.tabp');
      if (!tabs.length || !panels.length) return;
 
      function selectTab(t, focus) {
        const target = t.getAttribute('aria-controls');
        tabs.forEach(x => {
          const o = x === t;
          x.classList.toggle('is-on', o);
          x.setAttribute('aria-selected', String(o));
          x.tabIndex = o ? 0 : -1;
        });
        panels.forEach(p => {
          const show = p.id === target;
          p.hidden = !show;
          p.classList.toggle('is-on', show);
          p.style.display = show ? '' : 'none';
        });
        if (focus) t.focus();
      }
 
      tabs.forEach((t, i) => {
        on(t, 'click', () => selectTab(t));
        on(t, 'keydown', e => {
          let n = null;
          if (e.key === 'ArrowRight') n = i + 1;
          else if (e.key === 'ArrowLeft') n = i - 1;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = tabs.length - 1;
          if (n === null) return;
          e.preventDefault();
          selectTab(tabs[(n + tabs.length) % tabs.length], true);
        });
      });
 
      // initial sync (so HTML state and JS state always match)
      selectTab(tabs.find(t => t.classList.contains('is-on')) || tabs[0]);
    })();
 
    /* ---------- 3D tilt (lg section) ---------- */
    (function () {
      const media = $('.lg__media'), frame = $('#lgFrame');
      if (!media || !frame || matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;
      on(media, 'mousemove', e => {
        const r = media.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform = 'perspective(900px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg)';
      });
      on(media, 'mouseleave', () => { frame.style.transform = ''; });
    })();
 
    /* =====================================================
       PROCESS STEPPER (Your Vision. Our Craftsmanship.) – FIXED
       - elapsed-time based progress (pause/resume safe)
       - pauses only on mouse hover / keyboard focus
       - click resets bar, touch never freezes autoplay
       - arrow-key navigation
       ===================================================== */
    (function () {
      const steps = $$('.step'), panel = $('.proc__panel'), procEl = $('#proc'), procBar = $('#procBar');
      if (!steps.length || !panel || !procEl) return;
 
      const data = [
        ['i-chat',   'Consultation',       'Share your ideas, purpose, and preferences with our team.'],
        ['i-pen',    'Design & Approval',  'We create a design concept for your review and approval.'],
        ['i-layers', 'Material Selection', 'Choose premium materials, finishes, and details for your belt.'],
        ['i-hammer', 'Handcrafting',       'Our craftsmen build your belt with precision and care.'],
        ['i-shield', 'Quality Check',      'Every belt is inspected to meet our high standards.'],
        ['i-truck',  'Secure Delivery',    'Carefully packaged and shipped safely to your door.']
      ];
      const extra = [
        { t: 'Day 1–2',   y: 'Ideas & logo',   d: 'Free consultation',   l: ['Tell us your event, team or brand', 'Share logos, colors and ideas', 'Get expert advice on size and style'] },
        { t: 'Day 2–4',   y: 'Your feedback',  d: 'Free digital mockup', l: ['See a free mockup of your belt', 'Request unlimited tweaks', 'Approve before we build'] },
        { t: 'Day 4–5',   y: 'Your choices',   d: 'Material samples',    l: ['Pick leather and plate finish', 'Choose metals and colors', 'Add side plates and engraving'] },
        { t: 'Day 5–12',  y: 'Nothing needed', d: 'Handmade belt',       l: ['Cut, stitched and plated by hand', 'Photo updates on request', 'Built to last a lifetime'] },
        { t: 'Day 12–13', y: 'Nothing needed', d: 'Inspected belt',      l: ['Stitching and plating inspection', 'Engraving accuracy check', 'Final photos sent to you'] },
        { t: 'Day 13–15', y: 'Your address',   d: 'Tracked shipping',    l: ['Protective packaging', 'Tracked delivery', 'Ships worldwide'] }
      ];
 
      const DUR = 5000;
      let cur = 0, elapsed = 0, last = 0, raf = null;
      let hovering = false, kbFocus = false;
 
      const big = $('#procBig'), use = $('#procIc use'), h = $('#procH'), p = $('#procP');
      const meta = $('#pMeta'), list = $('#pList'), prog = $('#pProg');
 
      function renderExtra(i) {
        const s = extra[i]; let bars = '';
        if (meta) meta.innerHTML =
          '<li><small>Timeline</small><b>' + s.t + '</b></li>' +
          '<li><small>You provide</small><b>' + s.y + '</b></li>' +
          '<li><small>We deliver</small><b>' + s.d + '</b></li>';
        if (list) list.innerHTML = s.l.map(x => '<li>' + x + '</li>').join('');
        if (prog) {
          for (let n = 0; n < 6; n++) bars += '<span' + (n <= i ? ' class="on"' : '') + '></span>';
          prog.innerHTML = bars + '<em>Step ' + (i + 1) + ' of 6</em>';
          prog.setAttribute('aria-label', 'Step ' + (i + 1) + ' of 6');
        }
      }
 
      function setStep(i) {
        cur = i;
        elapsed = 0;
        steps.forEach((s, k) => {
          const o = k === i;
          s.classList.toggle('is-on', o);
          s.setAttribute('aria-selected', String(o));
          s.tabIndex = o ? 0 : -1;
        });
        if (big) big.textContent = ('0' + (i + 1)).slice(-2);
        if (use) use.setAttribute('href', '#' + data[i][0]);
        if (h) h.textContent = data[i][1];
        if (p) p.textContent = data[i][2];
        renderExtra(i);
        panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
        if (procBar) procBar.style.width = '0%';
      }
 
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(now - last, 100);   // guard against tab-switch jumps
        last = now;
        if (hovering || kbFocus || document.hidden) return;
        elapsed += dt;
        if (procBar) procBar.style.width = Math.min(elapsed / DUR, 1) * 100 + '%';
        if (elapsed >= DUR) setStep((cur + 1) % steps.length);
      }
      function play() { if (reduce || raf) return; last = performance.now(); raf = requestAnimationFrame(frame); }
      function halt() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
 
      steps.forEach((s, i) => {
        on(s, 'click', () => setStep(i));
        on(s, 'keydown', e => {
          let n = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = i + 1;
          else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = i - 1;
          else if (e.key === 'Home') n = 0;
          else if (e.key === 'End') n = steps.length - 1;
          if (n === null) return;
          e.preventDefault();
          n = (n + steps.length) % steps.length;
          steps[n].focus(); setStep(n);
        });
      });
 
      // pause only for real mouse hover (touch never freezes autoplay)
      on(procEl, 'pointerenter', e => { if (e.pointerType === 'mouse') hovering = true; });
      on(procEl, 'pointerleave', e => { if (e.pointerType === 'mouse') hovering = false; });
 
      // pause only for keyboard focus, not after a mouse click
      on(procEl, 'focusin', e => {
        let kb = false;
        try { kb = e.target.matches(':focus-visible'); } catch (err) { kb = false; }
        kbFocus = kb;
      });
      on(procEl, 'focusout', () => { kbFocus = false; });
 
      setStep(0);
 
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(en => { en[0].isIntersecting ? play() : halt(); }, { threshold: 0.15 }).observe(procEl);
      } else {
        play();
      }
    })();
 
    /* ---------- reveal + counters ---------- */
    function countUp(el) {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
      if (reduce || isNaN(end)) return;
      const t0 = performance.now(), dur = 1400;
      (function f(n) {
        const pr = Math.min((n - t0) / dur, 1);
        const e = 1 - Math.pow(1 - pr, 3);
        const v = end * e;
        el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
        if (pr < 1) requestAnimationFrame(f);
      })(t0);
    }
    function reveal(el) {
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(countUp);
      if (el.matches('[data-count]')) countUp(el);
    }
 
    const sel = '.sec__head,.kicker,.panels,.craft__grid>*,.rows li,.pcard,.spot__grid>*,.proc__grid,.shot,.post,.promo__copy,.promo__media,.news>*,.stats li';
    const revealTargets = $$(sel);
    revealTargets.forEach(el => el.classList.add('reveal'));
 
    if ('IntersectionObserver' in window) {
      // low threshold so tall blocks (spotlight / process) always trigger
      const io = new IntersectionObserver((entries, o) => {
        entries.forEach(en => { if (en.isIntersecting) { reveal(en.target); o.unobserve(en.target); } });
      }, { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });
      revealTargets.forEach(el => io.observe(el));
    } else {
      revealTargets.forEach(reveal);
    }
 
    /* ---------- newsletter ---------- */
    (function () {
      const nl = $('#nl'), nlMsg = $('#nlMsg'), nlIn = $('#nlEmail');
      if (!nl || !nlMsg || !nlIn) return;
      const row = $('.nl__row', nl);
      on(nl, 'submit', e => {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nlIn.value.trim());
        if (row) row.classList.toggle('is-err', !ok);
        nlMsg.classList.toggle('is-err', !ok);
        nlMsg.classList.remove('is-ok');
        if (!ok) {
          e.preventDefault();
          nlMsg.textContent = 'Please enter a valid email address.';
          nlIn.focus();
        }
      });
      on(nlIn, 'input', () => {
        if (row) row.classList.remove('is-err');
        nlMsg.classList.remove('is-err');
        nlMsg.textContent = 'We respect your privacy. Unsubscribe anytime.';
      });
    })();
 
    /* ---------- smooth anchor scroll with header offset ---------- */
    $$('a[href^="#"]').forEach(a => {
      on(a, 'click', e => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        let t = null;
        try { t = document.querySelector(id); } catch (err) { return; }
        if (!t) return;
        e.preventDefault();
        const off = hdr ? hdr.offsetHeight : 0;
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - off, behavior: reduce ? 'auto' : 'smooth' });
        t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
      });
    });
 
  });
})();