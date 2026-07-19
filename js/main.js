/* ==========================================================================
   ASN Bekker Construction — interaction layer
   Vanilla, no dependencies. Everything degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- header */
  var hdr = $('#hdr');
  var fab = $('#fab');
  var lastY = window.scrollY;

  // A jump from an in-page link looks exactly like a fast scroll down, which
  // would slide the header away the moment the visitor arrives. Hold it open
  // briefly after any nav click.
  var holdHeaderUntil = 0;

  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-stuck', y > 40);
    // hide on the way down, reveal on the way up — but never over the hero
    if (y > 420 && y > lastY &&
        Date.now() > holdHeaderUntil &&
        !document.body.classList.contains('is-locked')) {
      hdr.classList.add('is-hidden');
    } else {
      hdr.classList.remove('is-hidden');
    }
    lastY = y;
    fab.classList.toggle('is-on', y > 700);
  }

  /* ------------------------------------------------------------ mobile nav */
  var burger = $('#burger');
  var nav = $('#nav');

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
  });

  function closeNav() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
  }

  // any in-page jump — nav, hero buttons, footer links
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    holdHeaderUntil = Date.now() + 1200;
    if (nav.classList.contains('is-open')) closeNav();
  });

  // Escape closes the menu, same as any other overlay
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
      burger.focus();
    }
  });

  /* ------------------------------------------------------- scroll reveals */
  var risers = $$('[data-rise]');
  risers.forEach(function (el) {
    var d = el.getAttribute('data-rise-d');
    if (d) el.style.setProperty('--d', d + 'ms');
  });

  if ('IntersectionObserver' in window && !reduced) {
    var riseObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-up');
          riseObs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    risers.forEach(function (el) { riseObs.observe(el); });
  } else {
    risers.forEach(function (el) { el.classList.add('is-up'); });
  }

  /* --------------------------------------------------- hero headline swipe */
  var hero = $('.hero');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { hero.classList.add('is-in'); });
  });

  /* ------------------------------------------------------ active nav link */
  var navLinks = $$('.nav > a[href^="#"]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* --------------------------------------------------- 3D tilt on services */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-tilt]').forEach(function (card) {
      var frame = 0;

      card.addEventListener('pointermove', function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            'perspective(1000px) rotateX(' + (-py * 9).toFixed(2) + 'deg) ' +
            'rotateY(' + (px * 11).toFixed(2) + 'deg) translateZ(10px)';
        });
      });

      card.addEventListener('pointerleave', function () {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        card.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------ gallery filters */
  var gal = $('#gal');
  var items = $$('.gal__i', gal);

  $$('.filters__b').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-f');

      $$('.filters__b').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', String(on));
      });

      items.forEach(function (it) {
        it.classList.toggle('is-out', f !== 'all' && it.getAttribute('data-cat') !== f);
      });
    });
  });

  /* ------------------------------------------------------------- lightbox */
  var lbx     = $('#lbx');
  var lbxImg  = $('#lbxImg');
  var lbxCap  = $('#lbxCap');
  var opener  = null;
  var idx     = 0;

  function visibleItems() {
    return items.filter(function (i) { return !i.classList.contains('is-out'); });
  }

  function show(i) {
    var list = visibleItems();
    if (!list.length) return;
    idx = (i + list.length) % list.length;

    var fig = list[idx];
    var img = $('img', fig);
    var cap = $('figcaption strong', fig);

    lbxImg.src = img.currentSrc || img.src;
    lbxImg.alt = img.alt;
    lbxCap.textContent = cap ? cap.textContent : '';
  }

  function openLbx(fig) {
    opener = $('.gal__btn', fig);
    show(visibleItems().indexOf(fig));
    lbx.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { lbx.classList.add('is-on'); });
    $('#lbxX').focus();
  }

  function closeLbx() {
    lbx.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    window.setTimeout(function () {
      lbx.hidden = true;
      lbxImg.removeAttribute('src');   // '' would re-request the page URL
      if (opener) opener.focus();
    }, 340);
  }

  gal.addEventListener('click', function (e) {
    var btn = e.target.closest('.gal__btn');
    if (btn) openLbx(btn.closest('.gal__i'));
  });

  $('#lbxX').addEventListener('click', closeLbx);
  $('#lbxPrev').addEventListener('click', function () { show(idx - 1); });
  $('#lbxNext').addEventListener('click', function () { show(idx + 1); });
  lbx.addEventListener('click', function (e) {
    if (e.target === lbx || e.target.classList.contains('lbx__fig')) closeLbx();
  });

  document.addEventListener('keydown', function (e) {
    if (lbx.hidden) return;
    if (e.key === 'Escape')     closeLbx();
    if (e.key === 'ArrowLeft')  show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'Tab') { e.preventDefault(); $('#lbxX').focus(); }
  });

  /* ----------------------------------------------------- process steps hl */
  var steps = $$('.step');
  if (steps.length && 'IntersectionObserver' in window) {
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('is-live', en.isIntersecting);
      });
    }, { rootMargin: '-25% 0px -25% 0px', threshold: 0.2 });
    steps.forEach(function (s) { stepObs.observe(s); });
  }

  /* ------------------------------------------- quote form -> WhatsApp deep link */
  var WA = '27724801647';
  var form = $('#quoteForm');

  function setErr(field, msg) {
    field.classList.toggle('is-bad', !!msg);
    var slot = $('[data-err]', field);
    if (slot) slot.textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name    = $('#f-name');
    var phone   = $('#f-phone');
    var service = $('#f-service');
    var msg     = $('#f-msg');
    var ok = true;

    if (!name.value.trim()) {
      setErr(name.closest('.field'), 'Please tell us your name.'); ok = false;
    } else setErr(name.closest('.field'), '');

    // SA numbers: allow spaces, dashes, +27 or leading 0 — just need 9+ digits
    var digits = phone.value.replace(/\D/g, '');
    if (digits.length < 9) {
      setErr(phone.closest('.field'), 'Please enter a contact number we can reach you on.'); ok = false;
    } else setErr(phone.closest('.field'), '');

    if (!service.value) {
      setErr(service.closest('.field'), 'Please choose what you need done.'); ok = false;
    } else setErr(service.closest('.field'), '');

    if (!ok) {
      var bad = $('.field.is-bad');
      if (bad) {
        bad.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        var input = $('input, select, textarea', bad);
        if (input) input.focus({ preventScroll: true });
      }
      return;
    }

    var lines = [
      'Hi ASN Bekker Construction,',
      '',
      'Name: ' + name.value.trim(),
      'Contact: ' + phone.value.trim(),
      'Service: ' + service.value
    ];
    if (msg.value.trim()) lines.push('', 'Details: ' + msg.value.trim());
    lines.push('', 'Sent from your website.');

    window.open(
      'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')),
      '_blank',
      'noopener'
    );
  });

  // clear an error as soon as the visitor starts fixing it
  form.addEventListener('input', function (e) {
    var field = e.target.closest('.field');
    if (field && field.classList.contains('is-bad')) setErr(field, '');
  });

  /* --------------------------------------------------------------- sundry */
  $('#yr').textContent = String(new Date().getFullYear());

  // keep the looping hero video alive if a browser pauses it on tab return
  var vid = $('#heroVid');
  if (vid) {
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && vid.paused && !reduced) {
        var p = vid.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stands in */ });
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
