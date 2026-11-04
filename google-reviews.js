/* MAKI MAKIO | Reseñas en dos filas, sin repetir reseñas entre filas.
   Temporalmente usa extractos públicos documentados, sin Google Cloud.
   API Places opcional futura: conserva el mismo carrusel y admite fotos auténticas. */
(() => {
  'use strict';

  const section = document.querySelector('.reviews-section');
  if (!section) return;

  const rows = [
    {
      lane: document.querySelector('.reviews-row--slow'),
      track: document.getElementById('reviews-track-top'),
      original: document.getElementById('reviews-set-top'),
      clone: document.getElementById('reviews-clone-top'),
      baseSpeed: 51 // píxeles/segundo, fila 1
    },
    {
      lane: document.querySelector('.reviews-row--fast'),
      track: document.getElementById('reviews-track-bottom'),
      original: document.getElementById('reviews-set-bottom'),
      clone: document.getElementById('reviews-clone-bottom'),
      baseSpeed: 59 // fila 2: un poco más rápida
    }
  ].filter(row => row.lane && row.track && row.original && row.clone);
  if (rows.length !== 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safe = value => String(value ?? '').replace(/[\x00-\x1F]/g, '').trim();
  const sourceUrl = 'https://wanderlog.com/es/place/details/9860789/restaurante-maki-makio-sushi--wok-facatativ%C3%A1';
  const placesUrl = 'https://www.google.com/maps/search/?api=1&query=Maki%20Makio&query_place_id=ChIJnZGEmlV9P44RuatYlHqCpno';

  // Una reseña = una tarjeta en UNA sola fila. No se recrean opiniones.
  // Las copias aria-hidden son únicamente la técnica visual para la repetición del recorrido.
  const fallbackReviews = [
    { author: 'Laura B', date: '20 OCT 2024', text: 'los ingredientes son frescos', rating: 5 },
    { author: 'Stiven S', date: '21 SEP 2025', text: 'sabores frescos y limpios', rating: 5 },
    { author: 'Adriana D', date: '10 NOV 2024', text: 'El servicio es excelente', rating: 5 },
    { author: 'Alejandra P', date: '13 NOV 2025', text: 'Una comida muy deliciosa y el servicio rápido, muy gentiles', rating: 5 },
    { author: 'Alexandra L', date: '12 SEP 2021', text: 'Super', rating: 5 },
    { author: 'David P', date: 'Reseña pública', text: 'Un muy agradable lugar con excelente atención', rating: null }
  ];
  const starSVG = '<svg class="review-star-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m10 1.4 2.66 5.4 5.96.87-4.31 4.2 1.02 5.93L10 15l-5.33 2.8 1.02-5.93-4.31-4.2 5.96-.87Z" fill="currentColor"/></svg>';

  function makeAvatar(review) {
    if (review.photoURI && /^https:\/\//i.test(review.photoURI)) {
      const img = document.createElement('img');
      img.className = 'review-avatar-img';
      img.src = review.photoURI;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      return img;
    }
    const avatar = document.createElement('span');
    avatar.className = 'review-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = safe(review.author || 'Cliente').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
    return avatar;
  }

  function buildCard(review) {
    const item = document.createElement('article');
    item.className = 'review-card';
    const top = document.createElement('div');
    top.className = 'review-card-top';
    top.append(makeAvatar(review));

    const author = document.createElement('div');
    author.className = 'review-author';
    const name = document.createElement('strong');
    if (review.authorUrl && /^https:\/\//i.test(review.authorUrl)) {
      const a = document.createElement('a');
      a.href = review.authorUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = safe(review.author) || 'Cliente';
      name.append(a);
    } else {
      name.textContent = safe(review.author) || 'Cliente';
    }
    const date = document.createElement('small');
    date.textContent = safe(review.date || 'Reseña de Google');
    author.append(name, date);
    const badge = document.createElement('span');
    badge.className = 'review-source-icon';
    badge.setAttribute('aria-label', 'Reseña de Google');
    badge.textContent = 'G';
    top.append(author, badge);
    item.append(top);

    const stars = document.createElement('div');
    stars.className = 'review-stars';
    if (Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5) {
      const rating = Math.round(review.rating);
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', rating + ' de 5 estrellas');
      stars.innerHTML = starSVG.repeat(rating);
    } else {
      const verified = document.createElement('span');
      verified.className = 'review-no-rating';
      verified.textContent = 'OPINIÓN EN GOOGLE';
      stars.append(verified);
    }
    item.append(stars);

    const quote = document.createElement('blockquote');
    quote.textContent = '“' + safe(review.text) + '”';
    item.append(quote);
    const foot = document.createElement('span');
    foot.className = 'review-card-bottom';
    foot.textContent = 'RESEÑA PUBLICADA EN GOOGLE';
    item.append(foot);
    return item;
  }

  function uniqueReviews(reviews) {
    const seen = new Set();
    return reviews.filter(review => {
      const key = (safe(review.author) + '|' + safe(review.text)).toLocaleLowerCase('es');
      if (!review.text || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderRows(allReviews) {
    const unique = uniqueReviews(allReviews);
    // Alternar las opiniones: filas disjuntas, sin reutilizar el mismo autor/texto.
    const groups = [[], []];
    unique.forEach((review, index) => groups[index % 2].push(review));
    rows.forEach((row, index) => {
      const fragment = document.createDocumentFragment();
      groups[index].forEach(review => fragment.append(buildCard(review)));
      row.original.replaceChildren(fragment);
      // Sólo la copia visual necesaria para que el bucle no tenga cortes.
      row.clone.replaceChildren(...Array.from(row.original.children).map(card => card.cloneNode(true)));
      row.clone.setAttribute('aria-hidden', 'true');
      row.clone.inert = true;
      row.offset = 0;
      row.velocity = row.baseSpeed;
      row.transition = null;
    });
    updateMeasurements();
  }

  function updateMeasurements() {
    rows.forEach(row => {
      const count = row.original.children.length;
      if (!count) return;
      // Cada serie ocupa al menos el ancho del contenedor; nunca se ven dos
      // ejemplares de la misma reseña al mismo tiempo.
      row.lane.style.removeProperty('--review-card-min-width');
      if (count < 3) {
        const minWidth = Math.ceil((row.lane.clientWidth + 40) / count) - 18;
        row.lane.style.setProperty('--review-card-min-width', Math.max(335, minWidth) + 'px');
      }
      const previousWidth = row.width || 0;
      const previousFraction = previousWidth > 0 ? row.offset / previousWidth : 0;
      row.width = row.original.getBoundingClientRect().width;
      row.offset = previousFraction * row.width;
      row.track.style.transform = `translate3d(${row.offset - row.width}px, 0, 0)`;
    });
  }

  function updateAttribution(live = false) {
    const note = document.querySelector('.reviews-attribution');
    if (!note) return;
    note.replaceChildren();
    if (live) {
      note.append('Opiniones obtenidas desde Google Maps al abrir la página. ');
    } else {
      note.append('Selección de reseñas públicas; no se actualizan automáticamente hasta activar Google Places. ');
      const source = document.createElement('a');
      source.href = sourceUrl;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = 'Fuente de las reseñas';
      note.append(source, '. ');
    }
    const link = document.createElement('a');
    link.href = placesUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Ver todas en Google Maps';
    note.append(link);
  }

  function easeInOut(t) {
    // Smoothstep: empieza y termina con aceleración cero.
    return t * t * (3 - 2 * t);
  }

  function changeSpeed(row, paused) {
    if (reduceMotion) return;
    const target = paused ? 0 : row.baseSpeed;
    if (row.transition && row.transition.to === target) return;
    row.transition = {
      from: row.velocity,
      to: target,
      start: performance.now(),
      duration: paused ? 500 : 300
    };
  }

  function attachEvents() {
    rows.forEach(row => {
      // Solo hover de mouse; no pausar accidentalmente por tocar la pantalla.
      row.lane.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') changeSpeed(row, true);
      });
      row.lane.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse') changeSpeed(row, false);
      });
      // Equivalente accesible al navegar con Tab.
      row.lane.addEventListener('focusin', () => changeSpeed(row, true));
      row.lane.addEventListener('focusout', event => {
        if (!row.lane.contains(event.relatedTarget)) changeSpeed(row, false);
      });
    });
    if (reduceMotion) {
      rows.forEach(row => row.lane.classList.add('reviews-static'));
      return;
    }

    let inViewport = true;
    let previous = 0;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inViewport = Boolean(entries[0]?.isIntersecting);
        section.classList.toggle('reviews-in-view', inViewport);
      }, { threshold: 0.03 });
      observer.observe(section);
    }
    const tick = now => {
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      if (inViewport && !document.hidden) {
        rows.forEach(row => {
          if (!row.width) return;
          if (row.transition) {
            const t = Math.min(1, (now - row.transition.start) / row.transition.duration);
            row.velocity = row.transition.from + (row.transition.to - row.transition.from) * easeInOut(t);
            if (t >= 1) row.transition = null;
          }
          row.offset = (row.offset + row.velocity * delta) % row.width;
          row.track.style.transform = `translate3d(${row.offset - row.width}px, 0, 0)`;
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    let resizeQueued = false;
    window.addEventListener('resize', () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => { resizeQueued = false; updateMeasurements(); });
    }, { passive: true });
  }

  async function loadLiveReviews() {
    const config = window.MAKI_GOOGLE_CONFIG || {};
    const apiKey = safe(config.apiKey);
    const placeId = safe(config.placeId);
    if (!apiKey || !placeId) return; // La web funciona sin Google Cloud.
    try {
      await new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) + '&v=weekly&loading=async&libraries=places&language=es';
        tag.onload = resolve;
        tag.onerror = () => reject(Error('No se pudo cargar Google Maps'));
        document.head.append(tag);
      });
      const { Place } = await google.maps.importLibrary('places');
      const place = new Place({ id: placeId });
      await place.fetchFields({ fields: ['displayName', 'reviews', 'rating', 'userRatingCount'] });
      const realReviews = (place.reviews || [])
        .filter(review => review.text && review.authorAttribution)
        .map(review => ({
          author: review.authorAttribution.displayName || 'Cliente',
          authorUrl: review.authorAttribution.uri || '',
          photoURI: review.authorAttribution.photoURI || '',
          date: review.relativePublishTimeDescription || 'Reseña de Google',
          rating: review.rating,
          text: review.text
        }));
      if (realReviews.length >= 2) {
        renderRows(realReviews);
        updateAttribution(true);
      }
    } catch (error) {
      console.warn('Reseñas Google: se conserva la muestra documentada.', error);
    }
  }

  renderRows(fallbackReviews);
  updateAttribution(false);
  attachEvents();
  loadLiveReviews();
})();
