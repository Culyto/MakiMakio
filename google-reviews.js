/* MAKI MAKIO | Google Reviews v26 — SOLO GOOGLE MAPS.
   Requiere Maps JavaScript API + Places API (New) habilitadas.
   Se muestran exclusivamente reseñas actuales obtenidas de Google Places,
   con calificación de 3, 4 o 5 estrellas; no se mezclan otras fuentes.
   Places API entrega hasta 5 reseñas por consulta, no la colección completa. */
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
  const placesUrl = 'https://www.google.com/maps/search/?api=1&query=Maki%20Makio&query_place_id=ChIJnZGEmlV9P44RuatYlHqCpno';

  // Una opinión de Google se asigna a una sola fila. Las copias técnicas
  // sirven únicamente para el movimiento continuo, no añaden opiniones.
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
    foot.textContent = 'RESEÑA DE GOOGLE MAPS';
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
    open.title = individualUrl
      ? 'Abrir esta reseña en Google Maps'
      : 'Ver reseñas en Google Maps';
    item.append(open);
    return item;
  }

  function uniqueReviews(reviews) {
    const seen = new Set();
    return reviews.filter(review => {
      // Cada autor y texto aparece una sola vez en las dos filas.
      const author = safe(review.author).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const content = safe(review.text).toLocaleLowerCase('es');
      const key = author && author !== 'cliente' ? 'autor:' + author : 'texto:' + content;
      if (!content || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Se muestran exclusivamente reseñas verificadas por la respuesta de
  // Google Places y que tengan 3, 4 o 5 estrellas.
  function renderRows(allReviews) {
    const filtered = uniqueReviews(allReviews).filter(review =>
      Number.isFinite(review.rating) && review.rating >= 3 && review.rating <= 5
    );

    // Dos carriles separados: cada opinión real pertenece a una sola fila.
    // Con pocas opiniones, las copias visuales sirven para mantener el movimiento
    // continuo, pero NO añaden reseñas nuevas ni procedentes de otras fuentes.
    const groups = [[], []];
    filtered.forEach((review, index) => groups[index % 2].push(review));
    const twoRows = filtered.length >= 2;
    section.classList.toggle('reviews-one-row', !twoRows);
    section.classList.toggle('reviews-two-rows', twoRows);

    rows.forEach((row, index) => {
      const fragment = document.createDocumentFragment();
      groups[index].forEach(review => fragment.append(buildCard(review)));
      row.original.replaceChildren(fragment);
      row.clone.replaceChildren();
      row.clone.setAttribute('aria-hidden', 'true');
      row.clone.removeAttribute('inert');
      row.offset = 0;
      row.width = 0;
      row.velocity = row.baseSpeed;
      row.transition = null;
      row.lane.classList.toggle('reviews-row--empty', !groups[index].length);
      row.lane.classList.remove('reviews-row--sparse');
    });

    updateMeasurements();
    return filtered.length;
  }

  // Crear una cinta continua como la del diseño original de Maki Makio.
  // Cada ciclo contiene exactamente las mismas tarjetas, para que el enlace
  // entre ciclos sea imperceptible. No existe el vaivén ni el centrado estático.
  function updateMeasurements() {
    rows.forEach(row => {
      // Antes de redimensionar, retirar SOLO las copias técnicas. Las primeras
      // N tarjetas son reseñas únicas de Google y permanecen en el original.
      const originals = Array.from(row.original.children).filter(card => !card.hasAttribute('data-loop-copy'));
      row.original.replaceChildren(...originals);
      row.clone.replaceChildren();
      row.lane.style.removeProperty('--review-card-min-width');
      row.lane.style.removeProperty('width');

      if (!originals.length) {
        row.width = 0;
        row.track.style.transform = 'none';
        return;
      }

      const previousFraction = row.width ? row.offset / row.width : 0;
      const viewport = row.lane.clientWidth;
      const card = originals[0];
      const cardWidth = card.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(row.original).gap) || 18;
      const uniqueWidth = originals.length * (cardWidth + gap);

      // Una tira necesita medir al menos el ancho visible más una tarjeta
      // para que haya contenido a ambos lados durante toda la animación.
      const neededWidth = viewport + cardWidth + gap;
      const copies = Math.min(16, Math.max(1, Math.ceil(neededWidth / uniqueWidth)));
      for (let repeat = 1; repeat < copies; repeat++) {
        originals.forEach(original => {
          const duplicate = original.cloneNode(true);
          duplicate.dataset.loopCopy = 'true';
          duplicate.setAttribute('aria-hidden', 'true');
          // Los enlaces de las copias deben seguir respondiendo al clic,
          // pero no aparecer duplicados en la navegación con Tab.
          duplicate.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
          row.original.append(duplicate);
        });
      }

      row.clone.replaceChildren(...Array.from(row.original.children).map(card => {
        const duplicate = card.cloneNode(true);
        duplicate.dataset.loopCopy = 'true';
        duplicate.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
        return duplicate;
      }));
      row.clone.setAttribute('aria-hidden', 'true');
      row.clone.removeAttribute('inert');

      row.width = row.original.getBoundingClientRect().width;
      row.offset = ((previousFraction % 1) + 1) % 1 * row.width;
      applyPosition(row);
    });
  }

  function applyPosition(row) {
    if (!row.width) return;
    // Hacia la derecha: al terminar una tira aparece su continuación idéntica.
    // La transformación salta de 0 a -width solo cuando ambas son iguales,
    // por lo que NO hay cortes visibles ni retrocesos.
    const x = row.offset - row.width;
    row.track.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  function updateAttribution(state = 'loading', placeAttributions = []) {
    let note = document.querySelector('.reviews-attribution');
    if (!note) {
      const container = section.querySelector('.reviews-marquee')?.parentElement;
      if (!container) return;
      note = document.createElement('p');
      note.className = 'reviews-attribution reviews-inline-attribution';
      container.append(note);
    }
    note.replaceChildren();
    if (state === 'loaded') {
      note.append('Reseñas obtenidas directamente de Google Maps');
    } else if (state === 'empty') {
      note.append('');
    } else if (state === 'error') {
      note.append('No se pudieron cargar las reseñas de Google Maps en este momento. ');
    } else if (state === 'not-configured') {
      note.append('');
    } else {
      note.append('Cargando reseñas de Google Maps… ');
    }
    const link = document.createElement('a');
    link.href = placesUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Consultar reseñas en Google Maps';
    note.append(link);

    if (state === 'loaded' && Array.isArray(placeAttributions)) {
      placeAttributions.forEach(attribution => {
        if (typeof attribution === 'string' && attribution.trim()) {
          note.append(' · ', attribution);
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
          if (row.width > 0) {
            row.offset = (row.offset + row.velocity * delta) % row.width;
          }
          applyPosition(row);
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
    if (!apiKey || !placeId) {
      updateAttribution('not-configured');
      return;
    }
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
      // Usamos todas las opiniones que Google entregue con 3/4/5
      // estrellas; nunca se agregan opiniones de otras fuentes.
      const positiveLive = realReviews.filter(review =>
        Number.isFinite(review.rating) && review.rating >= 3 && review.rating <= 5
      );
      const count = renderRows(positiveLive);
      updateAttribution(count ? 'loaded' : 'empty', place.attributions);
    } catch (error) {
      renderRows([]);
      updateAttribution('error');
      console.warn('Reseñas Google: no se pudieron cargar las reseñas de Google Maps.', error);
    }
  }

  renderRows([]);
  updateAttribution('loading');
  attachEvents();
  loadLiveReviews();
})();
