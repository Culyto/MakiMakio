/* MAKI MAKIO | Google Reviews.
   Dos filas independientes, enlaces a las reseñas y bucle continuo.
   Places API devuelve hasta 5 reseñas: el resto se abre en Google Maps.
   Mantener las restricciones de API y referer en Google Cloud. */
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
  const validGoogleLink = value => typeof value === 'string' && /^https:\/\/(?:www\.)?(?:google\.[^/]+|maps\.google\.[^/]+|goo\.gl|maps\.app\.goo\.gl)(?:\/|$)/i.test(value);
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

    // El enlace directo viene de Review.googleMapsURI (si está disponible).
    // Si la API no facilita uno, se abre la página de reseñas del restaurante.
    const individualUrl = validGoogleLink(review.reviewUrl) ? review.reviewUrl : null;
    const open = document.createElement('a');
    open.className = 'review-card-open';
    open.href = individualUrl || placesUrl;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.setAttribute('aria-label', individualUrl
      ? 'Leer la reseña de ' + safe(review.author) + ' en Google Maps'
      : 'Ver las reseñas de Maki Makio en Google Maps');
    open.title = individualUrl ? 'Abrir esta reseña en Google Maps' : 'Ver reseñas en Google Maps';
    item.append(open);
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

  function buildMoreCard(type = 'all', count = 0) {
    const item = document.createElement('article');
    item.className = 'review-card review-card--more';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'reviews-more-kicker';
    eyebrow.textContent = 'MAKI MAKIO · GOOGLE MAPS';
    const title = document.createElement('strong');
    title.className = 'reviews-more-title';
    title.textContent = type === 'write' ? 'TU OPINIÓN CUENTA.' : 'HAY MÁS HISTORIAS.';
    const desc = document.createElement('p');
    desc.textContent = type === 'write'
      ? '¿Ya nos visitaste? Comparte tu experiencia en Google.'
      : count > 5 ? 'Descubre todas las opiniones de nuestra comunidad directamente en Google Maps.'
        : 'Descubre más experiencias y comentarios de nuestros clientes.';
    const label = document.createElement('span');
    label.className = 'reviews-more-action';
    label.textContent = type === 'write' ? 'ESCRIBIR UNA RESEÑA ↗' : 'VER TODAS LAS RESEÑAS ↗';
    const anchor = document.createElement('a');
    anchor.className = 'review-card-open';
    anchor.href = placesUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.setAttribute('aria-label', type === 'write' ? 'Ir a Google Maps para opinar de Maki Makio' : 'Ver todas las reseñas de Maki Makio en Google Maps');
    item.append(eyebrow, title, desc, label, anchor);
    return item;
  }

  function renderRows(allReviews, ratingCount = 0) {
    const unique = uniqueReviews(allReviews);
    // Una opinión pertenece a UNA sola fila. Nunca se mezcla con la otra.
    const groups = [[], []];
    unique.forEach((review, index) => groups[index % 2].push(review));

    rows.forEach((row, index) => {
      const fragment = document.createDocumentFragment();
      groups[index].forEach(review => fragment.append(buildCard(review)));
      // Google solo expone 5 reseñas: esta tarjeta enlaza al historial completo.
      // También completa el recorrido cuando una fila tiene menos opiniones.
      if (index === 1 || groups[index].length < 3) {
        fragment.append(buildMoreCard(index === 0 && groups[index].length < 3 ? 'write' : 'all', ratingCount));
      }
      row.original.replaceChildren(fragment);
      // Mantener cada vuelta más ancha que el área visible, incluso si el
      // diseñador reduce el ancho de las tarjetas en CSS. Rellenamos con CTA,
      // nunca con reseñas repetidas ni con tarjetas exageradamente anchas.
      let filler = 0;
      while (row.original.getBoundingClientRect().width < row.lane.clientWidth + 24 && filler < 8) {
        row.original.append(buildMoreCard(filler % 2 ? 'all' : 'write', ratingCount));
        filler++;
      }
      row.clone.replaceChildren(...Array.from(row.original.children).map(card => card.cloneNode(true)));
      row.clone.setAttribute('aria-hidden', 'true');
      // Los clones son visibles durante el bucle: NO deben ser inert, o los
      // clicks no funcionarían en la mayor parte de las tarjetas del carrusel.
      row.clone.removeAttribute('inert');
      row.clone.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
      row.offset = 0;
      row.velocity = row.baseSpeed;
      row.transition = null;
    });
    updateMeasurements();
  }

  function updateMeasurements() {
    rows.forEach(row => {
      if (!row.original.children.length) return;
      // No agrandamos las opiniones a 600px cuando hay solo dos en la fila.
      row.lane.style.removeProperty('--review-card-min-width');
      const oldWidth = row.width || 0;
      const oldFraction = oldWidth ? row.offset / oldWidth : 0;
      row.width = row.original.getBoundingClientRect().width;
      row.offset = oldFraction * row.width;
      row.track.style.transform = `translate3d(${row.offset - row.width}px, 0, 0)`;
    });
  }

  function updateAttribution(live = false, placeAttributions = []) {
    const note = document.querySelector('.reviews-attribution');
    if (!note) return;
    note.replaceChildren();
    if (live) {
      note.append('Google Places muestra una selección de hasta cinco opiniones, ordenadas por relevancia. ');
    } else {
      note.append('Selección de opiniones públicas, sin actualización automática. ');
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

    if (live && Array.isArray(placeAttributions)) {
      placeAttributions.forEach(attribution => {
        if (typeof attribution === 'string' && attribution.trim()) {
          const notePart = document.createElement('span');
          notePart.textContent = ' · ' + attribution;
          note.append(notePart);
        }
      });
    }
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

  // Google Maps JS: reutiliza la biblioteca si ya existe; si no, la carga
  // con el callback oficial. Esta vía también funciona cuando importLibrary
  // no está disponible, que era el error reportado en Vercel.
  function loadGooglePlaces(apiKey) {
    const maps = window.google?.maps;
    if (typeof maps?.places?.Place === 'function') {
      return Promise.resolve(maps.places.Place);
    }
    if (typeof maps?.importLibrary === 'function') {
      return maps.importLibrary('places').then(library => {
        const Place = library?.Place || window.google?.maps?.places?.Place;
        if (typeof Place !== 'function') {
          throw new Error('Google Places cargó, pero no expuso la clase Place.');
        }
        return Place;
      });
    }

    return new Promise((resolve, reject) => {
      const callbackName = '__makiGooglePlacesReady';
      let completed = false;
      const timeout = window.setTimeout(() => {
        finish(new Error('Google Maps no respondió a tiempo (15 segundos).'));
      }, 15000);

      function finish(error, Place) {
        if (completed) return;
        completed = true;
        window.clearTimeout(timeout);
        delete window[callbackName];
        if (error) reject(error);
        else resolve(Place);
      }

      window[callbackName] = async () => {
        try {
          // El script fue cargado con libraries=places: Place está disponible
          // directamente en google.maps.places, sin llamar a importLibrary.
          let Place = window.google?.maps?.places?.Place;
          if (typeof Place !== 'function' &&
              typeof window.google?.maps?.importLibrary === 'function') {
            const library = await window.google.maps.importLibrary('places');
            Place = library?.Place;
          }
          if (typeof Place !== 'function') {
            throw new Error('La biblioteca Places no proporcionó la clase Place. Comprueba que Places API (New) esté habilitada.');
          }
          finish(null, Place);
        } catch (error) {
          finish(error);
        }
      };

      const tag = document.createElement('script');
      const params = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
        libraries: 'places',
        loading: 'async',
        language: 'es',
        callback: callbackName
      });
      tag.src = 'https://maps.googleapis.com/maps/api/js?' + params.toString();
      tag.async = true;
      tag.onerror = () => finish(new Error('No se pudo cargar Google Maps. Comprueba la clave, el dominio autorizado y la facturación.'));
      document.head.append(tag);
    });
  }

  async function loadLiveReviews() {
    const config = window.MAKI_GOOGLE_CONFIG || {};
    const apiKey = safe(config.apiKey);
    const placeId = safe(config.placeId);
    if (!apiKey || !placeId) return; // La web funciona sin Google Cloud.
    try {
      // Carga directa de Maps con callback, no con el evento "load" del script.
      // "loading=async" no garantiza que importLibrary exista al dispararse onload.
      const Place = await loadGooglePlaces(apiKey);
      const place = new Place({ id: placeId });
      await place.fetchFields({ fields: ['displayName', 'reviews', 'rating', 'userRatingCount'] });
      const realReviews = (place.reviews || [])
        .filter(review => review.text && review.authorAttribution)
        .map(review => ({
          author: review.authorAttribution.displayName || 'Cliente',
          authorUrl: review.authorAttribution.uri || '',
          reviewUrl: review.googleMapsURI || review.googleMapsUri || '',
          photoURI: review.authorAttribution.photoURI || '',
          date: review.relativePublishTimeDescription || 'Reseña de Google',
          rating: review.rating,
          text: review.text
        }));
      if (realReviews.length >= 2) {
        renderRows(realReviews, place.userRatingCount || 0);
        updateAttribution(true, place.attributions);
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
