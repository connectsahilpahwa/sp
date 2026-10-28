(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) document.documentElement.classList.add('js');

  /* ---------- Theme ---------- */
  var root = document.documentElement, themeBtn = $('#themeBtn'), themeIcon = $('#themeIcon');
  var MOON = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z';
  var SUN = 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4';
  function paintTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeIcon.setAttribute('d', dark ? SUN : MOON);
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paintTheme();
  });
  paintTheme();

  /* ---------- Header, progress, back to top ---------- */
  var header = $('#header'), bar = $('#progress'), toTop = $('#toTop');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    toTop.classList.toggle('show', y > 900);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn'), links = $('#navLinks');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Active nav link ---------- */
  var navA = $$('a', links), map = {};
  navA.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navA.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
          var a = map[en.target.id];
          if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }


  /* ---------- Scroll reveal (staggered) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var groups = ['.sec-head', '.prose > *', '.trio > div', '.filters', '.ledger', '.row', '.more-line', '.roles', '.role', '.skill-groups > div', '.edu li', '.badge', '.awards li', '.gallery .shot', '.contact h2', '.contact .lede', '.c-item'];
    groups.forEach(function (sel) {
      $$(sel).forEach(function (el, i) {
        if (el.closest('#home')) return;
        el.classList.add('rv');
        el.style.setProperty('--d', Math.min(i % 6, 5) * 0.08 + 's');
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up for headline metrics ---------- */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null;
        (function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / 1100, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * e) + (p === 1 ? suf : '');
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Pause the hero diagram animation when asked ---------- */
  if (reduce) $$('#flow animateMotion').forEach(function (a) { a.parentNode.style.display = 'none'; });

  /* ---------- Project filter ---------- */
  var pf = $$('[data-filter]'), rows = $$('#ledger .row');
  pf.forEach(function (b) {
    b.addEventListener('click', function () {
      pf.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      rows.forEach(function (r) { r.hidden = b.dataset.filter !== 'all' && r.dataset.type !== b.dataset.filter; });
    });
  });

  /* ---------- Gallery ---------- */
  var shots = $$('#gallery-grid .shot'), gf = $$('[data-g]', $('#gallery')).filter(function (b) { return b.classList.contains('chip-btn'); });
  var moreBtn = $('#moreBtn'), LIMIT = 6, expanded = false, cur = 'all';
  function paintGallery() {
    var match = shots.filter(function (s) { return cur === 'all' || s.dataset.g === cur; });
    shots.forEach(function (s) { s.hidden = true; });
    match.forEach(function (s, i) { s.hidden = !(expanded || i < LIMIT); });
    moreBtn.hidden = match.length <= LIMIT;
    moreBtn.textContent = expanded ? 'Show fewer photos' : 'Show more photos';
  }
  gf.forEach(function (b) {
    b.addEventListener('click', function () {
      cur = b.dataset.g; expanded = false;
      gf.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      paintGallery();
    });
  });
  moreBtn.addEventListener('click', function () { expanded = !expanded; paintGallery(); });
  paintGallery();

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), idx = 0, list = [], opener = null;
  function show() {
    var s = list[idx], im = $('img', s);
    lbImg.src = im.src; lbImg.alt = im.alt;
    var fc = $('figcaption', s), b = $('b', fc);
    lbCap.textContent = b.textContent + ': ' + fc.textContent.slice(b.textContent.length);
  }
  function openLb(s) {
    list = shots.filter(function (x) { return !x.hidden; });
    idx = list.indexOf(s); opener = s; show();
    lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('#lbClose').focus();
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; if (opener) opener.focus(); }
  function go(d) { idx = (idx + d + list.length) % list.length; show(); }
  shots.forEach(function (s) { s.addEventListener('click', function () { openLb(s); }); });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { go(-1); });
  $('#lbNext').addEventListener('click', function () { go(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  /* ---------- Copy email ---------- */
  var copyBtn = $('#copyEmail'), msg = $('#copyMsg');
  copyBtn.addEventListener('click', function () {
    var addr = 'connectsahilpahwa@gmail.com';
    function done(ok) { msg.textContent = ok ? 'Copied to clipboard' : 'Copy failed. Select the email above instead.'; setTimeout(function () { msg.textContent = ''; }, 2400); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });
})();
