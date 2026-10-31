/* Maki Makio — lightweight interactions (no frameworks, no dependencies). */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
  const sections = document.querySelectorAll('.section-anchor');

  const closeMobileMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    mobileNav.classList.remove('is-open');
    mobileNav.inert = true;
    document.body.classList.remove('nav-open');
  };

  toggle.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    mobileNav.inert = !opening;
    mobileNav.classList.toggle('is-open', opening);
    document.body.classList.toggle('nav-open', opening);
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMobileMenu();
      toggle.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820 && toggle.getAttribute('aria-expanded') === 'true') closeMobileMenu();
  });

  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 15);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Intersection observer: brand-appropriate gentle reveals with motion preferences respected.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(el => revealObserver.observe(el));
  }

  // Mark the active navigation item according to the currently visible section.
  if ('IntersectionObserver' in window) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -55% 0px' });
    sections.forEach(section => activeObserver.observe(section));
  }

  // Carrusel de platos: autoplay accesible, navegación manual y soporte táctil.
  const carousel = document.getElementById('carrusel-carta');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('.food-slide')];
    const dots = [...carousel.querySelectorAll('.food-dot')];
    const currentNumber = document.getElementById('food-slide-current');
    const slideTrack = carousel.querySelector('.food-carousel-slides');
    const autoplayToggle = carousel.querySelector('.food-autoplay-toggle');
    const autoplayIcon = autoplayToggle.querySelector('span');
    const AUTO_INTERVAL = 6000;
    let current = 0;
    let autoAdvance = null;
    let pointerInside = false;
    let manuallyPaused = reduceMotion;

    const setSlide = (index, announce = false) => {
      const next = (index + slides.length) % slides.length;
      if (next === current && !announce) return;
      current = next;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      dots.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
      currentNumber.textContent = String(current + 1).padStart(2, '0');
      slideTrack.setAttribute('aria-live', announce ? 'polite' : 'off');
    };
    const stopAuto = () => {
      if (autoAdvance !== null) window.clearInterval(autoAdvance);
      autoAdvance = null;
    };
    const startAuto = () => {
      if (manuallyPaused || reduceMotion || document.hidden || pointerInside || carousel.contains(document.activeElement) || autoAdvance !== null) return;
      autoAdvance = window.setInterval(() => setSlide(current + 1), AUTO_INTERVAL);
    };
    const updateToggle = () => {
      const label = manuallyPaused ? 'Reanudar reproducción automática' : 'Pausar reproducción automática';
      autoplayToggle.setAttribute('aria-label', label);
      autoplayToggle.setAttribute('title', label);
      autoplayToggle.setAttribute('aria-pressed', String(manuallyPaused));
      autoplayIcon.textContent = manuallyPaused ? '▶' : '❚❚';
      autoplayIcon.style.letterSpacing = manuallyPaused ? '0' : '-2px';
    };
    const navigateManually = index => {
      stopAuto();
      setSlide(index, true);
      // Los controles que tienen el foco mantienen pausada la reproducción.
      startAuto();
    };
    carousel.querySelector('.food-prev').addEventListener('click', () => navigateManually(current - 1));
    carousel.querySelector('.food-next').addEventListener('click', () => navigateManually(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => navigateManually(i)));
    autoplayToggle.addEventListener('click', () => {
      manuallyPaused = !manuallyPaused;
      if (manuallyPaused) stopAuto();
      else startAuto();
      updateToggle();
    });
    carousel.addEventListener('keydown', e => {
      if (e.target.closest('a')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigateManually(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateManually(current + 1); }
    });
    let touchX = 0, touchY = 0;
    slideTrack.addEventListener('touchstart', e => {
      touchX = e.changedTouches[0].screenX;
      touchY = e.changedTouches[0].screenY;
    }, { passive: true });
    slideTrack.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].screenX - touchX;
      const dy = e.changedTouches[0].screenY - touchY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.25) navigateManually(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
    carousel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { pointerInside = true; stopAuto(); } });
    carousel.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { pointerInside = false; startAuto(); } });
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', e => { if (!carousel.contains(e.relatedTarget)) startAuto(); });
    document.addEventListener('visibilitychange', () => document.hidden ? stopAuto() : startAuto());
    setSlide(0);
    if (reduceMotion) autoplayToggle.hidden = true;
    updateToggle();
    startAuto();
  }

  // Galería de acordeón inspirada en la referencia: expandir con hover, foco o toque.
  const gallery = document.querySelector('.gallery-accordion');
  if (gallery) {
    const panels = [...gallery.querySelectorAll('.gallery-panel')];
    const selectPanel = index => panels.forEach((panel, i) => {
      const selected = index === i;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-pressed', String(selected));
    });
    const initial = 2;
    panels.forEach((panel, i) => {
      panel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') selectPanel(i); });
      panel.addEventListener('focus', () => selectPanel(i));
      panel.addEventListener('click', () => selectPanel(i));
      panel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + panels.length) % panels.length;
          panels[next].focus();
        }
      });
    });
    gallery.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !gallery.contains(document.activeElement)) selectPanel(initial); });
  }
  document.getElementById('current-year').textContent = String(new Date().getFullYear());
})();
