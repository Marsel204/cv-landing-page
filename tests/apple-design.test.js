import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cssContent = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf-8');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
const jsContent = fs.readFileSync(path.join(rootDir, 'github.js'), 'utf-8');

test('Apple Design: Typography incorporates Apple SF Pro / system font stack and optical tracking', () => {
  // Font stack must prioritize Apple system fonts
  assert.match(
    cssContent,
    /-apple-system|\bSF Pro Display\b|\bSF Pro Text\b|system-ui/,
    'Font stack must include Apple system fonts (-apple-system, SF Pro, or system-ui)'
  );

  // Large headings must have negative optical tracking
  const heroNameBlock = cssContent.match(/\.hero-name\s*\{([^}]+)\}/);
  assert.ok(heroNameBlock, '.hero-name rule must exist');
  assert.match(
    heroNameBlock[1],
    /letter-spacing:\s*-[0-9.]+/,
    '.hero-name must use negative optical tracking (letter-spacing: -...)'
  );

  // Section title optical tracking
  const sectionTitleBlock = cssContent.match(/\.section-title\s*\{([^}]+)\}/);
  assert.ok(sectionTitleBlock, '.section-title rule must exist');
  assert.match(
    sectionTitleBlock[1],
    /letter-spacing:\s*-[0-9.]+/,
    '.section-title must use negative optical tracking'
  );
});

test('Apple Design: Tactile response — instant active scaling on buttons and interactive elements', () => {
  // Buttons must scale down on :active
  const btnActive = cssContent.match(/\.btn:active\s*\{([^}]+)\}/);
  assert.ok(btnActive, '.btn:active rule must exist');
  assert.match(
    btnActive[1],
    /transform:\s*scale\(/,
    '.btn:active must have transform scale feedback'
  );

  // Carousel nav button active state
  const navBtnActive = cssContent.match(/\.carousel-nav-btn:active\s*\{([^}]+)\}/);
  assert.ok(navBtnActive, '.carousel-nav-btn:active rule must exist');
  assert.match(
    navBtnActive[1],
    /scale\(/,
    '.carousel-nav-btn:active must have scale feedback'
  );
});

test('Apple Design: Translucent materials with single-pass backdrop-filter blur and top edge light (no multi-pass saturate crash)', () => {
  assert.match(
    cssContent,
    /backdrop-filter:\s*blur\(/,
    'Translucent materials must use backdrop-filter blur'
  );
  assert.match(
    cssContent,
    /--glass-edge:|border-top:\s*1px solid/,
    'Materials must feature a bright top edge highlight catching light'
  );
  assert.doesNotMatch(
    cssContent,
    /backdrop-filter:\s*blur\([^)]+\)\s*saturate\(/,
    'Must not chain saturate() after blur() in backdrop-filter, which crashes Chromium Skia SharedImageManager mailboxes'
  );
});

test('Apple Design: Accessibility — supports prefers-reduced-motion and prefers-reduced-transparency', () => {
  assert.ok(
    cssContent.includes('@media (prefers-reduced-motion: reduce)'),
    'Must include prefers-reduced-motion media query'
  );
  assert.ok(
    cssContent.includes('@media (prefers-reduced-transparency: reduce)'),
    'Must include prefers-reduced-transparency media query'
  );
});

test('Apple Design: Carousel direct manipulation supports Pointer Events with momentum or 1:1 tracking', () => {
  assert.ok(
    jsContent.includes('pointerdown') || jsContent.includes('setPointerCapture'),
    'Carousel should implement Pointer Events direct manipulation'
  );
});

test('Apple Design: Sticky navigation and scroll container integrity (no body overflow-x: hidden or sticky transform glitches)', () => {
  // body must not use overflow-x: hidden which forces overflow-y: auto and breaks sticky positioning
  const bodyBlock = cssContent.match(/\bbody\s*\{([^}]+)\}/);
  assert.ok(bodyBlock, 'body rule must exist');
  assert.doesNotMatch(
    bodyBlock[1],
    /overflow-x:\s*hidden/,
    'body must use overflow-x: clip instead of hidden to prevent secondary scroll containers'
  );

  // html or .section must define scroll-padding-top or scroll-margin-top for sticky navbar offset
  assert.match(
    cssContent,
    /scroll-padding-top:|scroll-margin-top:/,
    'CSS must include scroll-padding-top or scroll-margin-top so sticky navbar never occludes section headers/cards'
  );

  // .navbar must not use transform-based slideDown animation that breaks sticky containing blocks
  const navbarBlock = cssContent.match(/\.navbar\s*\{([^}]+)\}/);
  assert.ok(navbarBlock, '.navbar rule must exist');
  assert.doesNotMatch(
    navbarBlock[1],
    /animation:\s*slideDown/,
    '.navbar must not use transform-based slideDown animation which conflicts with position: sticky'
  );
});

test('Apple Design: Compositor performance — reserve backdrop-filter for floating chrome and avoid full-viewport repaint animations', () => {
  // .navbar must keep backdrop-filter for floating translucent bar
  const navbarBlock = cssContent.match(/\.navbar\s*\{([^}]+)\}/);
  assert.ok(navbarBlock, '.navbar rule must exist');
  assert.match(
    navbarBlock[1],
    /backdrop-filter:\s*blur\(/,
    '.navbar must use backdrop-filter blur as floating chrome'
  );

  // Content cards (.card) must not stack heavy backdrop-filter over the background canvas, preventing GPU tile dropouts
  const cardRuleMatch = cssContent.match(/\.about-card,\s*\.skill-category-card,\s*\.card,\s*\.contact-box\s*\{([^}]+)\}/);
  assert.ok(cardRuleMatch, 'Unified content card rule must exist');
  assert.doesNotMatch(
    cardRuleMatch[1],
    /backdrop-filter:/,
    'Content cards must use high-legibility surface backgrounds instead of stacked backdrop-filter'
  );

  // .holo-background must not animate background-position on every frame (non-composited full-viewport repaint)
  const holoBlock = cssContent.match(/\.holo-background\s*\{([^}]+)\}/);
  assert.ok(holoBlock, '.holo-background rule must exist');
  assert.doesNotMatch(
    holoBlock[1],
    /animation:\s*aurora-shift/,
    '.holo-background must not run continuous full-viewport background-position repaint animation'
  );
});

