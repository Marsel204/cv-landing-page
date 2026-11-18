import { normalizeLanguage, translate, localizeProject } from './i18n.js?v=20261011-bilingual';
import { getStackProgress, getStackFrame } from './stacked-scroll.js?v=20261118-stacked';

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
  const locales = JSON.parse($('#locale-data').textContent);
  let language = 'en';
  try { language = normalizeLanguage(window.localStorage.getItem('marsel-portfolio-language')); } catch { /* The preview also works when storage is unavailable. */ }
  const t = (message, parameters) => translate(language, locales.ui, message, parameters);
  const projectInLanguage = id => localizeProject(projects[id], language, locales.projects);
  const originalTitle = document.title;
  const originalDescription = $('meta[name="description"]').content;
  let emailCopied = false;
  const track = $('#project-track');
  const cards = $$('#project-track .project-card');
  cards.forEach(card => card.querySelectorAll('.project-technologies li').forEach(tag => { tag.dataset.technology = tag.textContent; }));
  const projectDialog = $('#project-dialog');
  const imageDialog = $('#image-dialog');
  let currentProject;
  let filter = 'all';
  const carousel = $('#project-carousel');
  const stage = $('#project-sticky');
  const position = $('#carousel-position');
  const previousButton = $('#carousel-previous');
  const nextButton = $('#carousel-next');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let matchingCards = cards;
  let currentIndex = 0;
  let stacked = false;
  let step = 1, scrollStart = 0, scrollTravel = 0, trackWidth = 0;
  let renderFrame = null, navigationIndex = null, settleTimer;
  let inView = true;
  let lastProgress = null;

  function updatePosition(index) {
    const changed = currentIndex !== index;
    currentIndex = index;
    const active = matchingCards[index];
    position.textContent = matchingCards.length ? `${String(index + 1).padStart(2, '0')} / ${String(matchingCards.length).padStart(2, '0')}` : '00 / 00';
    carousel.dataset.currentProject = active?.id.replace('project-', '') || '';
    previousButton.disabled = index === 0;
    nextButton.disabled = index >= matchingCards.length - 1;
    if (stacked && changed && track.contains(document.activeElement)) {
      const focusedCard = document.activeElement.closest('.project-card');
      if (focusedCard && focusedCard !== active) track.focus({preventScroll:true});
    }
    matchingCards.forEach(card => {
      const inactive = stacked && card !== active;
      card.inert = inactive;
      if (inactive) card.setAttribute('aria-hidden', 'true');
      else card.removeAttribute('aria-hidden');
    });
  }
  function renderStack() {
    renderFrame = null;
    if (!stacked) {
      updatePosition(Math.round(getStackProgress(track.scrollLeft, step, matchingCards.length)));
      return;
    }
    const progress = getStackProgress(window.scrollY - scrollStart, step, matchingCards.length);
    if (progress === lastProgress) return;
    lastProgress = progress;
    matchingCards.forEach((card, index) => {
      const frame = getStackFrame(index, progress);
      card.style.transform = frame.transform;
      card.style.opacity = frame.opacity;
      card.style.visibility = frame.visible ? 'visible' : 'hidden';
      card.style.zIndex = index === Math.round(progress) ? matchingCards.length + 1 : matchingCards.length - index;
    });
    carousel.style.setProperty('--stack-progress', matchingCards.length > 1 ? progress / (matchingCards.length - 1) : 0);
    updatePosition(Math.round(progress));
  }
  function requestRender() {
    if (renderFrame === null && inView && !document.hidden) renderFrame = requestAnimationFrame(renderStack);
  }
  function resetNavigation() {
    navigationIndex = null;
    position.setAttribute('aria-live', 'off');
  }
  function buildCarousel(keepId, preserveProgress = false) {
    const rootRect = carousel.getBoundingClientRect();
    const rootTop = rootRect.top + window.scrollY;
    const stickyTop = document.querySelector('.site-header').offsetHeight + 16;
    const wasPinned = stacked && window.scrollY >= scrollStart && window.scrollY <= scrollStart + scrollTravel;
    const wasStacked = stacked;
    const wasVisible = rootRect.top < window.innerHeight && rootRect.bottom > stickyTop;
    const retainedProgress = preserveProgress && stacked ? getStackProgress(window.scrollY - scrollStart, step, matchingCards.length) : null;
    currentIndex = Math.max(0, matchingCards.findIndex(card => card.id === keepId));
    resetNavigation();
    track.replaceChildren(...matchingCards);
    matchingCards.forEach((card, index) => {
      card.style.removeProperty('transform');
      card.style.removeProperty('opacity');
      card.style.removeProperty('visibility');
      card.style.removeProperty('z-index');
      card.inert = false;
      card.removeAttribute('aria-hidden');
      card.setAttribute('aria-roledescription', t('slide'));
      card.setAttribute('aria-label', t('{index} of {count}', {index:index + 1, count:matchingCards.length}));
    });
    carousel.style.setProperty('--stack-top', `${stickyTop}px`);
    $('#carousel-controls').hidden = matchingCards.length < 2;
    $('#carousel-hint').textContent = t(!reducedMotion.matches && matchingCards.length > 1 ? 'Scroll to explore. Use the arrows to jump.' : 'Swipe or use the arrows to browse.');
    // Measure the complete sticky surface before opting in. Zoom and short
    // landscape screens must never leave project actions outside the viewport.
    carousel.dataset.stacked = String(!reducedMotion.matches && matchingCards.length > 1);
    const stageHeight = stage.offsetHeight;
    stacked = !reducedMotion.matches && matchingCards.length > 1 && stageHeight <= window.innerHeight - stickyTop - 16;
    carousel.dataset.stacked = String(stacked);
    trackWidth = track.clientWidth;
    step = stacked ? Math.max(300, Math.min(window.innerHeight * 0.7, 700)) : matchingCards[0]?.offsetWidth + (parseFloat(getComputedStyle(track).gap) || 0) || 1;
    scrollStart = rootTop - stickyTop;
    scrollTravel = Math.max(0, matchingCards.length - 1) * step;
    carousel.style.setProperty('--stack-height', `${stageHeight}px`);
    carousel.style.setProperty('--stack-travel', `${scrollTravel}px`);
    $('#carousel-hint').textContent = t(stacked ? 'Scroll to explore. Use the arrows to jump.' : 'Swipe or use the arrows to browse.');
    track.setAttribute('aria-label', t(stacked ? 'Project cards. Scroll or use the arrow keys to browse.' : 'Project cards. Swipe or use the arrow controls to browse.'));
    if (stacked) track.scrollTo({left:0, behavior:'instant'});
    else track.scrollTo({left:currentIndex * step, behavior:'instant'});
    if (wasPinned || (keepId && !wasStacked && stacked && currentIndex > 0 && wasVisible)) {
      const progress = retainedProgress ?? currentIndex;
      window.scrollTo({top:stacked ? scrollStart + progress * step : rootTop - stickyTop, behavior:'instant'});
    }
    lastProgress = null;
    renderStack();
  }
  function navigateTo(index) {
    navigationIndex = Math.max(0, Math.min(matchingCards.length - 1, index));
    position.setAttribute('aria-live', 'polite');
    if (stacked) window.scrollTo({top:scrollStart + navigationIndex * step, behavior:'smooth'});
    else track.scrollTo({left:navigationIndex * step, behavior:reducedMotion.matches ? 'instant' : 'smooth'});
  }
  function advance(direction) {
    navigateTo((navigationIndex ?? currentIndex) + direction);
  }
  function selectFilter(category) {
    filter = category;
    matchingCards = selectProjects(cards.map(card => ({
      card, categories: card.dataset.category.split(' ')
    })), category).map(project => project.card);
    $$('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    $('#project-count').textContent = t('{count} projects', {count:matchingCards.length});
    buildCarousel();
  }
  $$('.filter').forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.filter)));
  $$('[data-skill-filter]').forEach(link => link.addEventListener('click', () => selectFilter(link.dataset.skillFilter)));
  previousButton.addEventListener('click', () => advance(-1));
  nextButton.addEventListener('click', () => advance(1));
  track.addEventListener('pointerdown', resetNavigation, {passive:true});
  window.addEventListener('wheel', resetNavigation, {passive:true});
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') navigateTo(event.key === 'End' ? matchingCards.length - 1 : 0);
    else advance(['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1);
  });
  function onScroll() {
    requestRender();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(resetNavigation, 160);
  }
  window.addEventListener('scroll', () => { if (stacked) onScroll(); }, {passive:true});
  track.addEventListener('scroll', () => { if (!stacked) onScroll(); }, {passive:true});
  window.addEventListener('resize', () => buildCarousel(matchingCards[currentIndex]?.id, true));
  reducedMotion.addEventListener('change', () => buildCarousel(matchingCards[currentIndex]?.id));
  document.addEventListener('visibilitychange', requestRender);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) requestRender();
  }, {rootMargin:'200px'}).observe(carousel);
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    if (Math.abs(track.clientWidth - trackWidth) > 1) buildCarousel(matchingCards[currentIndex]?.id, true);
  }).observe(track);
  document.fonts?.ready.then(() => buildCarousel(matchingCards[currentIndex]?.id));
  selectFilter('all');

  function getProjectImage(id) { return cards.find(card => card.id === `project-${id}`).querySelector('.project-reference'); }
  function renderProject(id) {
    const p = projectInLanguage(id);
    currentProject = id;
    $('#detail-title').textContent = p.title;
    $('#detail-stage').textContent = p.domain + ' · ' + p.stage;
    $('#detail-summary').textContent = p.summary;
    $('#detail-overview').textContent = p.overview;
    const image = getProjectImage(id);
    $('#detail-image').src = image.src;
    $('#detail-image').alt = p.alt;
    $('#detail-caption').textContent = p.caption;
    $('#detail-enlarge').setAttribute('aria-label', t('Enlarge {title} image', {title:p.title}));
    $('#detail-enlarge .image-hint').textContent = t(projects[id].caption.toLowerCase().includes('illustration') ? 'Enlarge diagram ↗' : 'Enlarge screenshot ↗');
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
    $('#detail-tags').replaceChildren(...[...p.tags, ...(p.additionalTags || [])].map(tag => { const li = document.createElement('li'); li.textContent = t(tag); return li; }));
    $('#detail-source').hidden = !p.source;
    if (p.source) $('#detail-source').href = p.source;
    $('#detail-repo').hidden = !p.url;
    if (p.url) $('#detail-repo').href = p.url;
  }
  function showProject(id) {
    renderProject(id);
    projectDialog.showModal();
    projectDialog.scrollTop = 0;
  }
  track.addEventListener('click', event => {
    const button = event.target.closest('button[data-project],button[data-image]');
    if (!button || !track.contains(button)) return;
    showProject(button.dataset.project || button.dataset.image);
  });
  $$('[data-open-cv]').forEach(button => button.addEventListener('click', () => { $('#cv-dialog').showModal(); }));

  function showImage(src, alt, title, description, filename) {
    $('#viewer-image').src = src;
    $('#viewer-image').alt = alt;
    $('#image-title').textContent = title;
    $('#image-description').textContent = description;
    $('#image-download').href = src;
    $('#image-download').download = filename;
    $('#image-canvas').classList.remove('is-zoomed');
    $('#image-zoom').setAttribute('aria-pressed', 'false');
    $('#image-zoom').textContent = t('Zoom in');
    imageDialog.showModal();
    imageDialog.scrollTop = 0;
    $('#image-canvas').scrollLeft = 0;
    $('#image-canvas').scrollTop = 0;
  }
  function showProjectImage(id) {
    const p = projectInLanguage(id), image = getProjectImage(id);
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
    $('#image-zoom').textContent = t(zoomed ? 'Zoom out' : 'Zoom in');
    $('#image-canvas').scrollLeft = 0;
    $('#image-canvas').scrollTop = 0;
  });
  $$('.dialog').forEach(dialog => {
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
    menu.setAttribute('aria-label', t('Open navigation'));
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', t(open ? 'Close navigation' : 'Open navigation'));
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true' && !document.querySelector('dialog[open]')) {
      closeMenu(); menu.focus();
    }
  });
  window.matchMedia('(max-width: 1120px)').addEventListener('change', closeMenu);
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
      emailCopied = true;
      $('#copy-label').textContent = t('Email copied');
    } catch { $('#copy-label').textContent = email; }
    setTimeout(() => { emailCopied = false; $('#copy-label').textContent = email; }, 3000);
  });

  function applyLanguage(value, announce = false) {
    const keepId = matchingCards[currentIndex]?.id;
    language = normalizeLanguage(value);
    document.documentElement.lang = language;
    document.title = language === 'id' ? 'Marselinus Allen Nugraha | Teknik Elektro, IoT & AI Terapan' : originalTitle;
    $('meta[name="description"]').content = language === 'id' ? t('Marselinus Allen Nugraha — embedded firmware, IoT, industrial automation and applied AI.') : originalDescription;
    // Explicit hooks let text change without replacing icons, links or documents.
    $$('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    $$('*').forEach(element => {
      for (const attribute of [...element.attributes]) {
        if (attribute.name.startsWith('data-i18n-')) element.setAttribute(attribute.name.slice('data-i18n-'.length), t(attribute.value));
      }
    });
    cards.forEach(card => {
      const id = card.id.replace('project-', ''), p = projectInLanguage(id);
      card.querySelector('h3').textContent = p.title;
      card.querySelector('.project-kicker').textContent = p.domain;
      card.querySelector('.project-stage').textContent = p.stage.split('·')[0].trim();
      card.querySelector('.project-summary').textContent = p.summary;
      card.querySelector('.project-reference').alt = p.alt;
      card.querySelector('.project-image-button').setAttribute('aria-label', t('View {title} project overview', {title:p.title}));
      const button = card.querySelector('[data-project]');
      button.setAttribute('aria-label', t('View {title} project details', {title:p.title}));
      // Filtered-out originals are detached from the document and need the same update.
      card.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
      card.querySelector('.project-technologies').setAttribute('aria-label', t('Selected technologies'));
      card.querySelectorAll('.project-technologies li').forEach(tag => { tag.textContent = t(tag.dataset.technology); });
    });
    $$('[data-language]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.language === language)); });
    menu.setAttribute('aria-label', t(menu.getAttribute('aria-expanded') === 'true' ? 'Close navigation' : 'Open navigation'));
    $('#project-count').textContent = t('{count} projects', {count:matchingCards.length});
    $('#image-zoom').textContent = t($('#image-canvas').classList.contains('is-zoomed') ? 'Zoom out' : 'Zoom in');
    if (emailCopied) $('#copy-label').textContent = t('Email copied');
    if (projectDialog.open) renderProject(currentProject);
    buildCarousel(keepId);
    if (announce) {
      $('#language-announcement').textContent = t('Language changed to English.');
      try { window.localStorage.setItem('marsel-portfolio-language', language); } catch { /* Selection remains active for this visit. */ }
    }
  }
  $$('[data-language]').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language, true)));
  applyLanguage(language);
}

if (typeof document !== 'undefined') initPortfolio();
