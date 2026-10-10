export function selectProjects(projects, category = 'all') {
  return projects.filter(project => category === 'all' || project.categories.includes(category));
}

function initPortfolio() {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const legacySections = { '#hero': '#about', '#certifications': '#credentials' };
  const legacySection = legacySections[window.location.hash];
  if (legacySection) {
    window.history.replaceState(null, '', legacySection);
    document.querySelector(legacySection).scrollIntoView();
  }
  const projects = JSON.parse($('#project-data').textContent);
  const track = $('#project-track');
  const cards = $$('#project-track .project-card');
  const projectDialog = $('#project-dialog');
  const imageDialog = $('#image-dialog');
  let currentProject;
  let filter = 'all';
  const carousel = $('#project-carousel');
  const playButton = $('#carousel-play');
  const position = $('#carousel-position');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = reducedMotion.matches;
  let inView = false;
  let rebuilding = false;
  let keyboardFocus = false;
  let pointerActive = false;
  let interactionUntil = 0;
  let autoFrame = null, lastFrame = 0, rollingPosition = 0;
  let settleTimer, resumeTimer;
  const rollSpeed = 30; // Pixels per second, independent of the display refresh rate.
  let matchingCards = cards;
  let step = 0, start = 0, loopWidth = 0, currentIndex = 0;
  let scrollable = false;
  let trackWidth = 0;

  function canPlay() {
    return scrollable && !userPaused && !keyboardFocus && !pointerActive && performance.now() >= interactionUntil && inView && !document.hidden && !rebuilding && !document.querySelector('dialog[open]');
  }
  function stopRolling() {
    if (autoFrame !== null) cancelAnimationFrame(autoFrame);
    autoFrame = null;
    lastFrame = 0;
  }
  function roll(timestamp) {
    autoFrame = null;
    if (!canPlay()) { scheduleAutoplay(); return; }
    if (lastFrame) rollingPosition += Math.min(timestamp - lastFrame, 64) * rollSpeed / 1000;
    lastFrame = timestamp;
    if (rollingPosition >= start + loopWidth) rollingPosition -= loopWidth;
    else if (rollingPosition < start) rollingPosition += loopWidth;
    track.scrollTo({left:rollingPosition, behavior:'instant'});
    updatePosition();
    autoFrame = requestAnimationFrame(roll);
  }
  function scheduleAutoplay() {
    clearTimeout(resumeTimer);
    const playing = canPlay();
    carousel.dataset.autoplay = playing ? 'playing' : 'paused';
    if (playing && autoFrame === null) {
      rollingPosition = track.scrollLeft;
      lastFrame = 0;
      autoFrame = requestAnimationFrame(roll);
    } else if (!playing) stopRolling();
    const remaining = interactionUntil - performance.now();
    if (!userPaused && remaining > 0) resumeTimer = setTimeout(scheduleAutoplay, remaining + 20);
  }
  function pauseForInteraction(milliseconds = 1800) {
    interactionUntil = performance.now() + milliseconds;
    scheduleAutoplay();
  }
  function setPaused(paused) {
    userPaused = paused;
    if (!paused) interactionUntil = 0;
    playButton.dataset.paused = String(paused);
    playButton.setAttribute('aria-label', paused ? 'Resume scrolling' : 'Pause scrolling');
    playButton.querySelector('span').textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
    position.setAttribute('aria-live', paused ? 'polite' : 'off');
    scheduleAutoplay();
  }
  function updatePosition() {
    if (!step || !matchingCards.length || Math.abs(track.clientWidth - trackWidth) > 1) return;
    currentIndex = ((Math.round((track.scrollLeft - start) / step) % matchingCards.length) + matchingCards.length) % matchingCards.length;
    position.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(matchingCards.length).padStart(2, '0')}`;
    carousel.dataset.currentProject = matchingCards[currentIndex].id.replace('project-', '');
  }
  function settleScroll() {
    clearTimeout(settleTimer);
    if (autoFrame !== null || rebuilding || !scrollable || Math.abs(track.clientWidth - trackWidth) > 1) return;
    // Identical edge copies let the loop continue left, with no backwards sweep.
    if (track.scrollLeft >= start + loopWidth - 1) track.scrollTo({left:track.scrollLeft - loopWidth, behavior:'instant'});
    else if (track.scrollLeft < start - 1) track.scrollTo({left:track.scrollLeft + loopWidth, behavior:'instant'});
    updatePosition();
    scheduleAutoplay();
  }
  function copyCard(card) {
    const copy = card.cloneNode(true);
    copy.removeAttribute('id');
    copy.dataset.copy = 'true';
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    copy.querySelectorAll('button,a,[tabindex]').forEach(el => el.tabIndex = -1);
    return copy;
  }
  function buildCarousel(keepId) {
    rebuilding = true;
    clearTimeout(settleTimer);
    stopRolling();
    track.style.scrollSnapType = 'none';
    track.replaceChildren(...matchingCards);
    matchingCards.forEach((card,index) => {
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `${index + 1} of ${matchingCards.length}`);
    });
    const width = matchingCards[0]?.getBoundingClientRect().width || 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    step = width + gap;
    trackWidth = track.clientWidth;
    scrollable = matchingCards.length * step - gap > trackWidth + 1;
    const copies = scrollable ? Math.min(matchingCards.length, Math.ceil(trackWidth / step) + 1) : 0;
    if (copies) {
      track.prepend(...matchingCards.slice(-copies).map(copyCard));
      track.append(...matchingCards.slice(0, copies).map(copyCard));
    }
    start = copies * step;
    loopWidth = matchingCards.length * step;
    currentIndex = Math.max(0, matchingCards.findIndex(card => card.id === keepId));
    track.scrollTo({left:start + currentIndex * step, behavior:'instant'});
    $('#carousel-controls').hidden = !scrollable;
    $('#carousel-hint').textContent = scrollable ? 'Auto-scrolls left. Swipe or use the arrows to browse.' : `All ${matchingCards.length} projects in view.`;
    updatePosition();
    requestAnimationFrame(() => {
      track.style.scrollSnapType = '';
      rebuilding = false;
      scheduleAutoplay();
    });
  }
  function advance(direction) {
    if (scrollable) track.scrollTo({left:start + (currentIndex + direction) * step, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
  }
  function selectFilter(category) {
    filter = category;
    matchingCards = selectProjects(cards.map(card => ({
      card, categories: card.dataset.category.split(' ')
    })), category).map(project => project.card);
    $$('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    $('#project-count').textContent = `${matchingCards.length} projects`;
    buildCarousel();
  }
  $$('.filter').forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.filter)));
  $$('[data-skill-filter]').forEach(link => link.addEventListener('click', () => selectFilter(link.dataset.skillFilter)));
  playButton.addEventListener('click', () => setPaused(!userPaused));
  $('#carousel-previous').addEventListener('click', () => { pauseForInteraction(); advance(-1); });
  $('#carousel-next').addEventListener('click', () => { pauseForInteraction(); advance(1); });
  track.addEventListener('pointerdown', () => { pointerActive = true; pauseForInteraction(); }, {passive:true});
  const endPointerInteraction = () => {
    if (!pointerActive) return;
    pointerActive = false;
    pauseForInteraction();
  };
  window.addEventListener('pointerup', endPointerInteraction, {passive:true});
  window.addEventListener('pointercancel', endPointerInteraction, {passive:true});
  track.addEventListener('wheel', () => pauseForInteraction(), {passive:true});
  function updateKeyboardFocus() {
    keyboardFocus = track.matches(':focus-visible') || Boolean(track.querySelector(':focus-visible'));
    scheduleAutoplay();
  }
  track.addEventListener('focusin', updateKeyboardFocus);
  track.addEventListener('focusout', () => queueMicrotask(updateKeyboardFocus));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); pauseForInteraction();
    if (event.key === 'Home' || event.key === 'End') track.scrollTo({left:start + (event.key === 'End' ? matchingCards.length - 1 : 0) * step, behavior:'instant'});
    else advance(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', () => {
    if (rebuilding) return;
    updatePosition();
    if (autoFrame !== null) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleScroll, 160);
  }, {passive:true});
  track.addEventListener('scrollend', settleScroll);
  document.addEventListener('visibilitychange', scheduleAutoplay);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) setPaused(true); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    scheduleAutoplay();
  }, {threshold:0}).observe(track);
  else inView = true;
  new ResizeObserver(() => {
    if (Math.abs(track.clientWidth - trackWidth) > 1) buildCarousel(matchingCards[currentIndex]?.id);
  }).observe(track);
  setPaused(userPaused);
  selectFilter('all');

  function getProjectImage(id) { return cards.find(card => card.id === `project-${id}`).querySelector('.project-reference'); }
  function showProject(id) {
    const p = projects[id];
    currentProject = id;
    $('#detail-title').textContent = p.title;
    $('#detail-stage').textContent = p.domain + ' · ' + p.stage;
    $('#detail-summary').textContent = p.summary;
    $('#detail-overview').textContent = p.overview;
    const image = getProjectImage(id);
    $('#detail-image').src = image.src;
    $('#detail-image').alt = p.alt;
    $('#detail-caption').textContent = p.caption;
    $('#detail-enlarge').setAttribute('aria-label', 'Enlarge ' + p.title + ' image');
    $('#detail-enlarge .image-hint').textContent = p.caption.toLowerCase().includes('illustration') ? 'Enlarge diagram ↗' : 'Enlarge screenshot ↗';
    for (const field of ['problem', 'contribution', 'approach', 'outcome', 'evidence']) $('#detail-' + field).textContent = p[field];
    $('#detail-features').replaceChildren(...p.features.map(([title, description]) => {
      const li = document.createElement('li');
      const heading = document.createElement('strong');
      const text = document.createElement('p');
      heading.textContent = title;
      text.textContent = description;
      li.append(heading, text);
      return li;
    }));
    $('#detail-workflow').replaceChildren(...p.flow.map((label, index) => {
      const li = document.createElement('li');
      const number = document.createElement('span');
      const heading = document.createElement('strong');
      const text = document.createElement('p');
      number.className = 'workflow-number';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = String(index + 1).padStart(2, '0');
      heading.textContent = label;
      text.textContent = p.workflowDetails[index];
      li.append(number, heading, text);
      return li;
    }));
    $('#detail-tags').replaceChildren(...[...p.tags, ...(p.additionalTags || [])].map(tag => { const li = document.createElement('li'); li.textContent = tag; return li; }));
    $('#detail-source').hidden = !p.source;
    if (p.source) $('#detail-source').href = p.source;
    $('#detail-repo').hidden = !p.url;
    if (p.url) $('#detail-repo').href = p.url;
    projectDialog.showModal();
    projectDialog.scrollTop = 0;
    scheduleAutoplay();
  }
  track.addEventListener('click', event => {
    const button = event.target.closest('button[data-project],button[data-image]');
    if (!button || !track.contains(button)) return;
    showProject(button.dataset.project || button.dataset.image);
  });
  $$('[data-open-cv]').forEach(button => button.addEventListener('click', () => { $('#cv-dialog').showModal(); scheduleAutoplay(); }));

  function showImage(src, alt, title, description, filename) {
    $('#viewer-image').src = src;
    $('#viewer-image').alt = alt;
    $('#image-title').textContent = title;
    $('#image-description').textContent = description;
    $('#image-download').href = src;
    $('#image-download').download = filename;
    $('#image-canvas').classList.remove('is-zoomed');
    $('#image-zoom').setAttribute('aria-pressed', 'false');
    $('#image-zoom').textContent = 'Zoom in';
    imageDialog.showModal();
    scheduleAutoplay();
    imageDialog.scrollTop = 0;
    $('#image-canvas').scrollLeft = 0;
    $('#image-canvas').scrollTop = 0;
  }
  function showProjectImage(id) {
    const p = projects[id], image = getProjectImage(id);
    const extension = new URL(image.src).pathname.split('.').pop().toLowerCase();
    showImage(image.src, p.alt, p.title, p.caption, id + '-project-image.' + extension);
  }
  $('#detail-enlarge').addEventListener('click', () => showProjectImage(currentProject));
  $$('[data-certificate]').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.credential'), image = card.querySelector('img');
    showImage(image.src, image.alt, card.dataset.certTitle, card.dataset.certIssuer, 'marsel-certificate-' + button.dataset.certificate + '.png');
  }));
  $('#image-zoom').addEventListener('click', () => {
    const zoomed = $('#image-canvas').classList.toggle('is-zoomed');
    $('#image-zoom').setAttribute('aria-pressed', String(zoomed));
    $('#image-zoom').textContent = zoomed ? 'Zoom out' : 'Zoom in';
    $('#image-canvas').scrollLeft = 0;
    $('#image-canvas').scrollTop = 0;
  });
  $$('.dialog').forEach(dialog => {
    dialog.addEventListener('close', scheduleAutoplay);
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  const menu = $('#menu-toggle'), navigation = $('#navigation');
  function closeMenu() {
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true' && !document.querySelector('dialog[open]')) {
      closeMenu(); menu.focus();
    }
  });
  window.matchMedia('(max-width: 920px)').addEventListener('change', closeMenu);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(e => e.isIntersecting);
      if (!entry) return;
      navigation.querySelectorAll('a').forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, {rootMargin:'-15% 0px -65% 0px'});
    ['about','projects','skills','experience','credentials','contact'].forEach(id => observer.observe(document.getElementById(id)));
  }

  $('#copy-email').addEventListener('click', async () => {
    const email = 'marselinusalen@gmail.com';
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(email);
      else {
        const field = document.createElement('textarea');
        field.value = email;
        field.style.cssText = 'position:fixed;opacity:0;';
        document.body.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('Unavailable');
      }
      $('#copy-label').textContent = 'Email copied';
    } catch { $('#copy-label').textContent = email; }
    setTimeout(() => { $('#copy-label').textContent = email; }, 3000);
  });
}

if (typeof document !== 'undefined') initPortfolio();
