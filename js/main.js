/* =========================================================
   PROAM BELTS – Redesign v2 interactions (vanilla JS)
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lastFocus = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- missing-image placeholders ---------- */
  function markMissing(img) { var p = img.closest('.ph'); if (p) p.classList.add('is-missing'); }
  $$('.ph img').forEach(function (img) {
    img.addEventListener('error', function () { markMissing(img); });
    if (img.complete && img.naturalWidth === 0) markMissing(img);
  });

  /* ---------- sticky header state ---------- */
  var hdr = $('#hdr');
  function onScroll() { hdr.classList.toggle('is-stuck', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- desktop dropdowns ---------- */
  function closeDropdowns() {
    $$('.has-dd').forEach(function (li) {
      li.classList.remove('is-open');
      $('button', li).setAttribute('aria-expanded', 'false');
    });
  }
  $$('.has-dd').forEach(function (li) {
    var btn = $('button', li);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !li.classList.contains('is-open');
      closeDropdowns();
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', closeDropdowns);

  /* ---------- focus trap ---------- */
  function trap(box, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input,summary', box).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- mobile drawer ---------- */
  var drawer = $('#drawer'), scrim = $('#scrim'), burger = $('#burger');
  function openDrawer() {
    lastFocus = document.activeElement;
    scrim.hidden = false; drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; $('#drawerClose').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); scrim.hidden = true;
    document.body.style.overflow = ''; if (lastFocus) lastFocus.focus();
  }
  burger.addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  drawer.addEventListener('keydown', function (e) { trap(drawer, e); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 991 && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* ---------- search overlay ---------- */
  var search = $('#search');
  function openSearch() { lastFocus = document.activeElement; search.hidden = false; document.body.style.overflow = 'hidden'; $('#q').focus(); }
  function closeSearch() { search.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $('#searchOpen').addEventListener('click', openSearch);
  $('#searchClose').addEventListener('click', closeSearch);
  search.addEventListener('keydown', function (e) { trap(search, e); });
  search.addEventListener('click', function (e) { if (e.target === search) closeSearch(); });

  /* ---------- quick-view modal ---------- */
  var qv = $('#qvModal');
  function openQV(card) {
    lastFocus = document.activeElement;
    var img = $('#qvImg');
    img.src = card.dataset.img; img.alt = card.dataset.name;
    $('.modal__img', qv).classList.remove('is-missing');
    $('.modal__img', qv).setAttribute('data-label', card.dataset.img.split('/').pop());
    $('#qvTitle').textContent = card.dataset.name;
    $('#qvPrice').textContent = card.dataset.price;
    $('#qvLink').href = card.dataset.url;
    qv.hidden = false; document.body.style.overflow = 'hidden'; $('#qvClose').focus();
  }
  function closeQV() { qv.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $$('.pcard__qv').forEach(function (b) {
    b.addEventListener('click', function () { openQV(b.closest('.pcard')); });
  });
  $('#qvClose').addEventListener('click', closeQV);
  qv.addEventListener('click', function (e) { if (e.target === qv) closeQV(); });
  qv.addEventListener('keydown', function (e) { trap(qv, e); });

  /* ---------- gallery filter + lightbox ---------- */
  var shots = $$('.shot'), chips = $$('.chip2');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
      c.classList.add('is-on'); c.setAttribute('aria-selected', 'true');
      var f = c.dataset.f;
      shots.forEach(function (s) { s.classList.toggle('is-off', f !== 'all' && s.dataset.cat !== f); });
    });
  });
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbIdx = 0;
  function visibleShots() { return shots.filter(function (s) { return !s.classList.contains('is-off'); }); }
  function showLB(i) {
    var list = visibleShots(); if (!list.length) return;
    lbIdx = (i + list.length) % list.length;
    var s = list[lbIdx], im = $('img', s);
    lbImg.src = im.src; lbImg.alt = im.alt;
    lbCap.textContent = $('b', s).textContent + ' – ' + $('span', s).textContent;
  }
  shots.forEach(function (s) {
    $('.shot__btn', s).addEventListener('click', function () {
      if (s.classList.contains('is-missing')) return;
      lastFocus = document.activeElement;
      showLB(visibleShots().indexOf(s));
      lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    });
  });
  function closeLB() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $('#lbClose').addEventListener('click', closeLB);
  $('#lbPrev').addEventListener('click', function () { showLB(lbIdx - 1); });
  $('#lbNext').addEventListener('click', function () { showLB(lbIdx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  lb.addEventListener('keydown', function (e) {
    trap(lb, e);
    if (e.key === 'ArrowLeft') showLB(lbIdx - 1);
    if (e.key === 'ArrowRight') showLB(lbIdx + 1);
  });

  /* ---------- Escape closes the top-most layer ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) closeLB();
    else if (!qv.hidden) closeQV();
    else if (!search.hidden) closeSearch();
    else if (drawer.classList.contains('is-open')) closeDrawer();
    else closeDropdowns();
  });

  /* ---------- category expanding panels ---------- */
  var panels = $$('.panel');
  function activate(p) {
    panels.forEach(function (x) { x.classList.toggle('is-active', x === p); });
  }
  var canHover = window.matchMedia && matchMedia('(hover:hover)').matches;
  panels.forEach(function (p) {
    if (canHover) p.addEventListener('mouseenter', function () { if (innerWidth > 991) activate(p); });
    p.addEventListener('focus', function () { activate(p); });
    /* On touch / stacked layout: first tap opens the panel, second tap follows the link */
    p.addEventListener('click', function (e) {
      if (!p.classList.contains('is-active')) { e.preventDefault(); activate(p); }
    });
  });

  /* ---------- featured rail ---------- */
  var rail = $('#rail'), prev = $('#railPrev'), next = $('#railNext'), bar = $('#railBar');
  function step() { var c = $('.pcard', rail); return c ? c.getBoundingClientRect().width + 24 : 300; }
  function railState() {
    var max = rail.scrollWidth - rail.clientWidth;
    var pct = max > 0 ? rail.scrollLeft / max : 0;
    var vis = rail.clientWidth / rail.scrollWidth;
    bar.style.width = Math.max(vis, .12) * 100 + '%';
    bar.style.transform = 'translateX(' + pct * (1 / Math.max(vis, .12) - 1) * 100 + '%)';
    prev.disabled = rail.scrollLeft < 4;
    next.disabled = rail.scrollLeft > max - 4;
  }
  prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
  rail.addEventListener('scroll', railState, { passive: true });
  rail.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
  });
  window.addEventListener('resize', railState);
  railState();

  /* ---------- spotlight tabs ---------- */
  var tabs = $$('.tab2'), tps = $$('.tabp');
  function selectTab(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
    });
    tps.forEach(function (p) { p.hidden = p.id !== t.getAttribute('aria-controls'); });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      n = (n + tabs.length) % tabs.length; tabs[n].focus(); selectTab(tabs[n]);
    });
  });

  /* ---------- process stepper (auto-advances; pauses on interaction) ---------- */
  var steps = $$('.step'), panel = $('.proc__panel');
  var data = [
    ['i-chat', 'Consultation', 'Share your ideas, purpose, and preferences with our team.'],
    ['i-pen', 'Design & Approval', 'We create a design concept for your review and approval.'],
    ['i-layers', 'Material Selection', 'Choose premium materials, finishes, and details for your belt.'],
    ['i-hammer', 'Handcrafting', 'Our craftsmen build your belt with precision and care.'],
    ['i-shield', 'Quality Check', 'Every belt is inspected to meet our high standards.'],
    ['i-truck', 'Secure Delivery', 'Carefully packaged and shipped safely to your door.']
  ];
  var cur = 0, timer = null, started = 0, DUR = 5000, raf = null, paused = false, procBar = $('#procBar');
  function setStep(i) {
    cur = i;
    steps.forEach(function (s, k) { var on = k === i; s.classList.toggle('is-on', on); s.setAttribute('aria-selected', String(on)); });
    $('#procBig').textContent = ('0' + (i + 1)).slice(-2);
    $('#procIc use').setAttribute('href', '#' + data[i][0]);
    $('#procH').textContent = data[i][1];
    $('#procP').textContent = data[i][2];
    panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');
    started = performance.now();
  }
  function tick(now) {
    if (!paused) {
      var p = Math.min((now - started) / DUR, 1);
      procBar.style.width = p * 100 + '%';
      if (p >= 1) setStep((cur + 1) % steps.length);
    }
    raf = requestAnimationFrame(tick);
  }
  steps.forEach(function (s, i) {
    s.addEventListener('click', function () { setStep(i); });
  });
  var procEl = $('#proc');
  procEl.addEventListener('mouseenter', function () { paused = true; });
  procEl.addEventListener('mouseleave', function () { paused = false; started = performance.now(); });
  procEl.addEventListener('focusin', function () { paused = true; });
  procEl.addEventListener('focusout', function () { paused = false; started = performance.now(); });

  /* ---------- reveal + counters ---------- */
  var revealTargets = $$('.sec__head,.kicker,.panels,.craft__grid>*,.rows li,.pcard,.spot__grid>*,.proc__grid,.shot,.post,.promo__copy,.promo__media,.news>*,.stats li');
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });
  function countUp(el) {
    var end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
    if (reduce) { return; }
    var t0 = performance.now(), dur = 1400;
    (function f(n) {
      var p = Math.min((n - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3), v = end * e;
      el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        if (en.target.matches('[data-count]')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* start the process stepper only when visible */
  if ('IntersectionObserver' in window && !reduce) {
    var po = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!raf) { started = performance.now(); raf = requestAnimationFrame(tick); } }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
    po.observe(procEl);
  }

  /* ---------- newsletter (client-side validation only) ---------- */
  var nl = $('#nl'), nlMsg = $('#nlMsg'), nlIn = $('#nlEmail');
  nl.addEventListener('submit', function (e) {
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nlIn.value.trim());
    $('.nl__row', nl).classList.toggle('is-err', !ok);
    nlMsg.classList.toggle('is-err', !ok);
    nlMsg.classList.remove('is-ok');
    if (!ok) {
      e.preventDefault();
      nlMsg.textContent = 'Please enter a valid email address.';
      nlIn.focus();
    }
    /* valid: form posts to its action (connect to your email provider / Shopify) */
  });
  nlIn.addEventListener('input', function () {
    $('.nl__row', nl).classList.remove('is-err'); nlMsg.classList.remove('is-err');
    nlMsg.textContent = 'We respect your privacy. Unsubscribe anytime.';
  });

  /* ---------- smooth anchor scroll with header offset ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'), t = id.length > 1 && $(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - hdr.offsetHeight, behavior: reduce ? 'auto' : 'smooth' });
      t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    });
  });
})();
