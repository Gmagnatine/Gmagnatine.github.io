/* =============================================
   MAGNATINE LLC — script.js
   Handles: SPA routing, navbar, reveal,
            service deep-links, expertise bars,
            counters, contact form
   ============================================= */
'use strict';

// ── REFS ──────────────────────────────────────
const navbar      = document.getElementById('navbar');
const navToggle   = document.getElementById('navToggle');
const navLinksEl  = document.getElementById('navLinks');
const allNavLinks = document.querySelectorAll('.nav-link');
const pages       = document.querySelectorAll('.page');

// ── NAVBAR SCROLL ─────────────────────────────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ── MOBILE TOGGLE ─────────────────────────────
navToggle.addEventListener('click', () => {
  const open = navLinksEl.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
  const [s1, s2, s3] = navToggle.querySelectorAll('span');
  if (open) {
    s1.style.transform = 'translateY(7px) rotate(45deg)';
    s2.style.opacity   = '0';
    s3.style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    [s1, s2, s3].forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target) && navLinksEl.classList.contains('open')) {
    navLinksEl.classList.remove('open');
    navToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// ── PAGE ROUTING ──────────────────────────────
function closeMobileMenu() {
  navLinksEl.classList.remove('open');
  navToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}

function setActiveNav(pageId) {
  allNavLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-page') === pageId);
  });
}

/**
 * Show a page and optionally scroll to a section within it.
 * @param {string} pageId   – id of the <section class="page">
 * @param {string|null} sectionId – id of element to scroll to inside page
 */
function showPage(pageId, sectionId = null) {
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (!target) return;

  target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });

  setActiveNav(pageId);
  closeMobileMenu();
  history.pushState({ pageId, sectionId }, '', '#' + pageId);

  // Re-run animations for newly visible page
  setTimeout(() => {
    initReveal();
    if (pageId === 'about') initExpertiseBars();
    if (pageId === 'home')  animateCounters();

    // Deep-link scroll after reveal setup
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, 60);
}

// ── INTERCEPT ALL ANCHOR CLICKS ───────────────
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('[data-page]');
  if (!anchor) return;

  const href    = anchor.getAttribute('href') || '';
  const pageId  = anchor.getAttribute('data-page');
  const section = anchor.getAttribute('data-section') || null;

  if (!pageId) return;

  // Only handle internal page links
  const pageEl = document.getElementById(pageId);
  if (!pageEl || !pageEl.classList.contains('page')) return;

  e.preventDefault();
  showPage(pageId, section);
});

// ── BACK / FORWARD ────────────────────────────
window.addEventListener('popstate', (e) => {
  const state = e.state;
  if (state && state.pageId) {
    pages.forEach(p => p.classList.remove('active'));
    const pg = document.getElementById(state.pageId);
    if (pg) {
      pg.classList.add('active');
      setActiveNav(state.pageId);
      setTimeout(() => {
        initReveal();
        if (state.pageId === 'about') initExpertiseBars();
      }, 60);
    }
  }
});

// ── REVEAL OBSERVER ───────────────────────────
let revealObserver;

function initReveal() {
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.page.active .reveal:not(.visible)')
    .forEach(el => revealObserver.observe(el));
}

// ── EXPERTISE BARS ────────────────────────────
function initExpertiseBars() {
  const bars = document.querySelectorAll('.page.active .exp-bar-fill');
  if (!bars.length) return;

  const barObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.getAttribute('data-width') + '%';
        barObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => { bar.style.width = '0%'; barObs.observe(bar); });
}

// ── STAT COUNTERS ─────────────────────────────
function animateCounters() {
  document.querySelectorAll('.page.active .stat-num').forEach(el => {
    const raw = el.textContent.trim();
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num === 0) return;

    const suffix  = raw.replace(/[0-9.]/g, '');
    const dur     = 1600;
    const start   = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Number.isInteger(num) ? Math.floor(e * num) : Math.round(e * num * 10) / 10;
      el.textContent = v + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ── CONTACT FORM ──────────────────────────────
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitBtn   = document.getElementById('submitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    // Client-side validation before FormSubmit takes over
    const required = contactForm.querySelectorAll('[required]');
    let valid = true;

    required.forEach(f => {
      f.style.borderColor = '';
      if (!f.value.trim()) {
        f.style.borderColor = 'rgba(239,68,68,.55)';
        valid = false;
      }
    });

    const emailEl = document.getElementById('email');
    if (emailEl && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      emailEl.style.borderColor = 'rgba(239,68,68,.55)';
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
      return;
    }

    // Show loading state (form submits natively to FormSubmit.co)
    if (submitBtn) {
      submitBtn.querySelector('.btn-text').textContent = 'Sending…';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.pointerEvents = 'none';
    }
  });

  // Clear error highlights on input
  contactForm.querySelectorAll('input, select, textarea').forEach(f => {
    f.addEventListener('input', () => { f.style.borderColor = ''; });
  });
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Determine starting page from URL hash
  const hash    = window.location.hash.slice(1);
  const isValid = hash && document.getElementById(hash)?.classList.contains('page');
  const startId = isValid ? hash : 'home';

  pages.forEach(p => p.classList.remove('active'));
  const startPage = document.getElementById(startId);
  if (startPage) startPage.classList.add('active');
  setActiveNav(startId);
  history.replaceState({ pageId: startId, sectionId: null }, '', '#' + startId);

  setTimeout(() => {
    initReveal();
    animateCounters();
  }, 150);
});
