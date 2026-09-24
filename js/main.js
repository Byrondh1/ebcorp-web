/**
 * EB Corp — Main JavaScript
 * Handles: Navigation, AOS scroll reveal, counter animation,
 *          project filtering, mobile menu, WhatsApp tracking
 */

'use strict';

/* ============================================================
   HERO ENTRANCE — CSS transitions applied via JS on DOMContentLoaded
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var h1      = document.getElementById('hero-heading');
  var tagline = document.querySelector('.hero-content > p:not(.hero-sub)');
  var sub     = document.querySelector('.hero-sub');
  var cta     = document.querySelector('.hero-cta-group');

  function animateIn(el, delay, transition, to) {
    if (!el) return;
    setTimeout(function () {
      el.style.transition = transition;
      Object.assign(el.style, to);
    }, delay);
  }

  // 1. h1: translateY(30px→0) + opacity 0→1, 600ms, delay 100ms
  animateIn(h1, 100,
    'opacity 600ms ease-out, transform 600ms ease-out',
    { opacity: '1', transform: 'translateY(0)' }
  );

  // 2. tagline: typewriter effect — letras una por una cada 55ms, delay 500ms
  (function typewriter() {
    if (!tagline) return;
    var fullText = tagline.textContent.trim();
    tagline.textContent = '';

    var cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    tagline.appendChild(cursor);

    setTimeout(function () {
      tagline.style.transition = 'opacity 200ms ease';
      tagline.style.opacity = '1';

      var i = 0;
      var interval = setInterval(function () {
        if (i < fullText.length) {
          tagline.insertBefore(document.createTextNode(fullText[i]), cursor);
          i++;
        } else {
          clearInterval(interval);
          setTimeout(function () {
            cursor.style.animation = 'none';
            cursor.style.opacity = '0';
          }, 800);
        }
      }, 55);
    }, 500);
  })();

  // 3. hero-sub: translateY(15px→0) + opacity 0→1, 500ms, delay 700ms
  animateIn(sub, 700,
    'opacity 500ms ease-out, transform 500ms ease-out',
    { opacity: '1', transform: 'translateY(0)' }
  );

  // 4. cta-group: scale(0.95→1) + opacity 0→1, 400ms, delay 950ms
  animateIn(cta, 950,
    'opacity 400ms ease-out, transform 400ms ease-out',
    { opacity: '1', transform: 'scale(1)' }
  );
});

/* ============================================================
   NAVIGATION — Scroll behavior + mobile toggle
============================================================ */
(function initNav() {
  const navbar   = document.getElementById('navbar');
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!navbar) return;

  // Scroll class — rAF throttled
  var rafPending = false;
  window.addEventListener('scroll', function () {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      var past = window.scrollY > 60;
      navbar.classList.toggle('scrolled',     past);
      navbar.classList.toggle('nav-scrolled', past);
      rafPending = false;
    });
  }, { passive: true });

  // Mobile toggle
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

/* ============================================================
   AOS — Scroll Reveal (vanilla, no library dependency)
============================================================ */
(function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.dataset.aosDelay || '0', 10);
        setTimeout(() => {
          el.classList.add('aos-animate');
        }, delay);
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   COUNTER ANIMATION — Stats numbers count up
============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ============================================================
   TAB FILTERING — Animated filter with sliding indicator
============================================================ */
(function initTabFilter() {
  const tabs      = document.querySelectorAll('.tab-btn');
  const cards     = document.querySelectorAll('.project-card, .blog-card');
  const indicator = document.querySelector('.tab-indicator');
  if (!tabs.length || !cards.length) return;

  function moveIndicator(btn) {
    if (!indicator) return;
    indicator.style.left  = btn.offsetLeft + 'px';
    indicator.style.width = btn.offsetWidth + 'px';
  }

  // Position indicator on load without animating
  const firstActive = document.querySelector('.tab-btn.active');
  if (firstActive && indicator) {
    indicator.style.transition = 'none';
    moveIndicator(firstActive);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      indicator.style.transition = '';
    }));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.tab;

      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');

      moveIndicator(tab);

      let showIdx = 0;

      cards.forEach(card => {
        const cat     = card.dataset.filter || card.dataset.category;
        const matches = filter === 'todos' || cat === filter || cat === 'todos';
        const isHidden = card.style.display === 'none';

        if (!matches) {
          // Animate out: opacity + scale, then hide
          card.style.transition = 'opacity 200ms ease, transform 200ms ease';
          card.style.opacity    = '0';
          card.style.transform  = 'scale(0.92)';
          setTimeout(() => {
            card.style.display    = 'none';
            card.style.transition = '';
            card.style.opacity    = '';
            card.style.transform  = '';
          }, 210);

        } else if (isHidden) {
          // Animate in: reveal then transition opacity + scale with stagger
          const delay = 50 + showIdx++ * 50;
          card.style.display    = '';
          card.style.transition = 'none';
          card.style.opacity    = '0';
          card.style.transform  = 'scale(0.92)';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            setTimeout(() => {
              card.style.transition = 'opacity 300ms ease, transform 300ms ease';
              card.style.opacity    = '1';
              card.style.transform  = 'scale(1)';
            }, delay);
          }));
        }
        // Already visible and matches → no change needed
      });
    });
  });
})();

/* ============================================================
   HERO PARTICLES — Floating dot particles background
============================================================ */
(function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  // Skip on mobile for performance
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const COUNT = 30;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x    = Math.random() * 100;
    const y    = Math.random() * 100;
    const dur  = Math.random() * 6 + 4;
    const del  = Math.random() * 4;
    const op   = Math.random() * 0.3 + 0.05;

    Object.assign(dot.style, {
      position:        'absolute',
      width:           `${size}px`,
      height:          `${size}px`,
      borderRadius:    '50%',
      left:            `${x}%`,
      top:             `${y}%`,
      background:      i % 3 === 0 ? '#F5A623' : '#00D4FF',
      opacity:         op,
      animation:       `floatY ${dur}s ease-in-out ${del}s infinite`,
      pointerEvents:   'none',
    });

    fragment.appendChild(dot);
  }

  container.appendChild(fragment);
})();

/* ============================================================
   SMOOTH SCROLL — Anchor links with offset
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; // nav height
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ============================================================
   GA4 EVENT TRACKING
   Fires gtag events when gtag is available (production).
   Safe no-op in environments without GA4.
============================================================ */
(function initAnalytics() {
  function gtrack(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  // --- WhatsApp button clicks ---
  document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const label = btn.closest('[class*="cta"]') ? 'cta' :
                    btn.classList.contains('whatsapp-fab') ? 'fab' :
                    btn.classList.contains('btn-whatsapp') ? 'inline' : 'other';
      gtrack('whatsapp_click', {
        event_category: 'CTA',
        event_label: label,
        page_path: window.location.pathname
      });
    });
  });

  // --- Contact form submission ---
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', () => {
      gtrack('form_submit', {
        event_category: 'Contact',
        event_label: 'contact_form',
        page_path: window.location.pathname
      });
    });
  }

  // --- Cotizador step / completion ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step-next], [data-cotizador-submit]');
    if (!btn) return;
    if (btn.dataset.cotizadorSubmit !== undefined) {
      gtrack('cotizador_complete', {
        event_category: 'Cotizador',
        event_label: 'completed'
      });
    } else if (btn.dataset.stepNext !== undefined) {
      gtrack('cotizador_step', {
        event_category: 'Cotizador',
        event_label: `step_${btn.dataset.stepNext || 'next'}`
      });
    }
  });

  // --- Blog scroll depth (50% and 90%) ---
  const article = document.querySelector('.blog-article');
  if (article) {
    const milestones = { 50: false, 90: false };
    window.addEventListener('scroll', () => {
      const rect   = article.getBoundingClientRect();
      const total  = article.offsetHeight;
      const read   = Math.max(0, window.innerHeight - rect.top);
      const pct    = Math.round((read / total) * 100);

      if (!milestones[50] && pct >= 50) {
        milestones[50] = true;
        gtrack('scroll_depth', { event_category: 'Blog', event_label: '50pct', page_path: window.location.pathname });
      }
      if (!milestones[90] && pct >= 90) {
        milestones[90] = true;
        gtrack('scroll_depth', { event_category: 'Blog', event_label: '90pct', page_path: window.location.pathname });
      }
    }, { passive: true });
  }
})();

/* ============================================================
   ACTIVE NAV LINK — Highlight current section on scroll
============================================================ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navItems.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(link => {
          const active = link.getAttribute('href') === `#${id}`;
          link.style.color = active ? 'white' : '';
          if (active) {
            link.style.setProperty('--link-w', '100%');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

/* ============================================================
   STATS COUNTER — Animates .stat-number[data-count] on scroll
============================================================ */
(function initStatsCounter() {
  const statsBar = document.querySelector('section.stats-bar');
  if (!statsBar) return;

  const observer = new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();

    statsBar.querySelectorAll('.stat-number[data-count]').forEach(span => {
      const end      = parseInt(span.getAttribute('data-count'), 10);
      const duration = 1800;
      const start    = performance.now();

      function tick(now) {
        const t        = Math.min((now - start) / duration, 1);
        const progress = 1 - Math.pow(1 - t, 3);
        span.textContent = Math.round(progress * end);
        if (t < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }, { threshold: 0.3 });

  observer.observe(statsBar);
})();

/* ============================================================
   SERVICE PILLAR TILT — 3D tilt on mousemove
============================================================ */
/* ============================================================
   EB REVEAL — Site-wide IntersectionObserver scroll reveal
============================================================ */
(function initEbReveal() {

  // Selectors that get eb-reveal as a whole unit
  var SECTION_SELECTORS = [
    'section.stats-bar',
    'section.pain-points',
    'section.solution',
    'section.services',
    'section.process',
    'section.projects',
    'section.testimonials',
    'section.faq',
    'section.cta-final'
  ];

  // Selectors whose children each get eb-reveal with stagger
  var CARD_SELECTORS = [
    '.services-grid',
    '.process-steps',
    '.pricing-cards-grid',
    '.faq-grid'
  ];

  // Collect all targets
  var targets = [];

  SECTION_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('eb-reveal');
      targets.push({ el: el, stagger: false });
    });
  });

  CARD_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (parent) {
      Array.from(parent.children).forEach(function (child, i) {
        child.classList.add('eb-reveal');
        child.style.transitionDelay = (i * 80) + 'ms';
        targets.push({ el: child, stagger: true });
      });
    });
  });

  // Also handle individual items not in a known grid
  ['.service-card', '.pricing-card', '.faq-item', '.process-steps .step'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      if (!el.classList.contains('eb-reveal')) {
        el.classList.add('eb-reveal');
        el.style.transitionDelay = (i % 4 * 80) + 'ms';
        targets.push({ el: el, stagger: true });
      }
    });
  });

  if (!targets.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('eb-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (t) {
    // Sections already in viewport at load (scrollY === 0) get visible immediately
    if (window.scrollY === 0 && t.el.getBoundingClientRect().top < window.innerHeight) {
      t.el.classList.add('eb-visible');
    } else {
      observer.observe(t.el);
    }
  });

})();

/* ============================================================
   PROCESS ANIMATION — Connecting line + spring step numbers
============================================================ */
(function initProcessAnim() {
  var section = document.querySelector('section.process');
  if (!section) return;
  var line    = section.querySelector('.process-line');
  var numbers = section.querySelectorAll('.step-number');

  numbers.forEach(function (n) { n.style.transform = 'scale(0)'; });

  var observer = new IntersectionObserver(function (entries, obs) {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();

    if (line) {
      var isMobile = window.innerWidth <= 768;
      if (isMobile) { line.style.height = '100%'; }
      else          { line.style.width  = '100%'; }
    }

    [0, 400, 800].forEach(function (delay, i) {
      if (!numbers[i]) return;
      setTimeout(function () {
        numbers[i].style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        numbers[i].style.transform  = 'scale(1)';
      }, delay);
    });
  }, { threshold: 0.3 });

  observer.observe(section);
})();

/* ============================================================
   SERVICE PILLAR TILT — 3D tilt on mousemove
============================================================ */
(function initTilt() {
  document.querySelectorAll('.service-pillar').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect    = el.getBoundingClientRect();
      var xRatio  = (e.clientX - rect.left)  / rect.width;
      var yRatio  = (e.clientY - rect.top)   / rect.height;
      var rotateY =  (xRatio - 0.5) * 12;
      var rotateX = -(yRatio - 0.5) * 12;
      el.style.transition = 'transform 100ms ease';
      el.style.transform  = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
    });

    el.addEventListener('mouseleave', function () {
      el.style.transition = 'transform 400ms ease';
      el.style.transform  = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    });
  });
})();

/* ============================================================
   TESTIMONIALS CAROUSEL — Crossfade autoplay, desktop only
============================================================ */
(function initTestimonials() {
  if (!window.matchMedia('(min-width: 768px)').matches) return;

  var cards  = document.querySelectorAll('.testimonial-card');
  var dots   = document.querySelectorAll('.tc-dot');
  var grid   = document.querySelector('.testimonials-grid');
  if (cards.length < 2) return;

  var current      = 0;
  var paused       = false;
  var transitioning = false;
  var timer        = null;

  function goTo(idx) {
    if (transitioning) return;
    var next = (idx + cards.length) % cards.length;
    if (next === current) return;

    transitioning = true;

    // Fade out current
    cards[current].classList.remove('tc-active');
    if (dots[current]) dots[current].classList.remove('tc-dot-active');

    // After fade-out completes, fade in next
    setTimeout(function () {
      current = next;
      cards[current].classList.add('tc-active');
      if (dots[current]) dots[current].classList.add('tc-dot-active');
      transitioning = false;
    }, 420);
  }

  function advance() {
    if (!paused) goTo(current + 1);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(advance, 4000);
  }

  // Pause autoplay on hover
  if (grid) {
    grid.addEventListener('mouseenter', function () { paused = true; });
    grid.addEventListener('mouseleave', function () { paused = false; });
  }

  // Dot click → jump directly + restart timer
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      goTo(parseInt(dot.dataset.tc, 10));
      startTimer();
    });
  });

  startTimer();
})();

/* ============================================================
   FAQ ACCORDION — One open at a time, animated max-height
============================================================ */
(function initFAQ() {
  var items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  function openItem(item) {
    item.classList.add('faq-open');
    var btn = item.querySelector('.faq-question');
    var ans = item.querySelector('.faq-answer');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (ans) ans.setAttribute('aria-hidden', 'false');
  }

  function closeItem(item) {
    item.classList.remove('faq-open');
    var btn = item.querySelector('.faq-question');
    var ans = item.querySelector('.faq-answer');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (ans) ans.setAttribute('aria-hidden', 'true');
  }

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('faq-open');

      // Close all items
      items.forEach(closeItem);

      // If it was closed, open it
      if (!isOpen) openItem(item);
    });
  });
})();

/* ============================================================
   CUSTOM CURSOR — Desktop only, lerp-smoothed ring
   Usa transform (GPU composited) — no left/top para evitar layout thrashing
============================================================ */
(function initCustomCursor() {
  if (!window.matchMedia('(min-width: 768px)').matches) return;

  var dot  = document.createElement('div');
  var ring = document.createElement('div');
  dot.id   = 'cursor-dot';
  ring.id  = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  // Posición objetivo (mouse) y posición actual del ring (lerped)
  var tx = 0, ty = 0;
  var rx = 0, ry = 0;

  // Escala objetivo y actual — lerpeadas en el loop para transición suave
  var dotST = 1, dotS = 1;
  var rngST = 1, rngS = 1;

  var firstMove = true;
  var rafId     = null;

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;

    if (firstMove) {
      rx = tx; ry = ty;       // teleportar ring al cursor para evitar salto inicial
      firstMove = false;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
  }, { passive: true });

  // Loop rAF: todo vía transform — GPU composited, sin layout recalculation
  function tick() {
    if (!firstMove) {
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      dotS += (dotST - dotS) * 0.18;
      rngS += (rngST - rngS) * 0.12;

      dot.style.transform  = 'translate(' + (tx - 3)  + 'px,' + (ty - 3)  + 'px) scale(' + dotS + ')';
      ring.style.transform = 'translate(' + (rx - 12) + 'px,' + (ry - 12) + 'px) scale(' + rngS + ')';
    }
    rafId = requestAnimationFrame(tick);
  }
  tick();

  document.documentElement.addEventListener('mouseleave', function () {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.documentElement.addEventListener('mouseenter', function () {
    if (!firstMove) {
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
  });

  document.addEventListener('mouseover', function (e) {
    var onHeading = !!e.target.closest('h1, h2');
    var onLink    = !onHeading && !!e.target.closest('a, button, .btn');

    ring.classList.toggle('cur-heading', onHeading);
    ring.classList.toggle('cur-link',    onLink);

    dotST = onLink    ? 0   : 1;
    rngST = onHeading ? 2.5 : onLink ? 1.8 : 1;
  }, { passive: true });
})();

