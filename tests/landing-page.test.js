import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf-8');

test('TDD: All <img> src attributes in index.html point to existing non-empty files', () => {
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let match;
  const sources = [];
  while ((match = imgSrcRegex.exec(htmlContent)) !== null) {
    sources.push(match[1]);
  }

  assert.ok(sources.length > 0, 'Should find <img> tags in index.html');
  for (const src of sources) {
    const fullPath = path.join(rootDir, src);
    assert.ok(fs.existsSync(fullPath), `Image file must exist: ${src}`);
    const stats = fs.statSync(fullPath);
    assert.ok(stats.size > 0, `Image file must not be empty: ${src}`);
  }
});

test('TDD: Laboratory assistant appointments are separated into 4 distinct cards in Certifications section', () => {
  // Check for the 4 separate practicum courses
  const requiredCourses = [
    'Fisika Dasar',
    'Sistem Digital',
    'Rangkaian Listrik',
    'Dasar Elektronika'
  ];

  // Certifications section should contain each course separately
  const certSectionMatch = htmlContent.match(/<section id="certifications"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(certSectionMatch, 'Certifications section must exist');
  const certSection = certSectionMatch[1];

  for (const course of requiredCourses) {
    assert.ok(
      certSection.includes(course),
      `Certifications section must include a separate card for ${course}`
    );
  }

  // Verify dedicated image assets for each course
  assert.ok(certSection.includes('cert_lab_fisika.png'), 'Must reference cert_lab_fisika.png');
  assert.ok(certSection.includes('cert_lab_sisdig.png'), 'Must reference cert_lab_sisdig.png');
  assert.ok(certSection.includes('cert_lab_rangkaian.png'), 'Must reference cert_lab_rangkaian.png');
  assert.ok(certSection.includes('cert_lab_elektronika.png'), 'Must reference cert_lab_elektronika.png');

  // Verify there is no longer a single bundled "(4 Practicum Courses)" title
  assert.ok(
    !certSection.includes('(4 Practicum Courses)'),
    'Should not bundle all 4 courses into a single generic title'
  );
});

test('TDD: CSS centers all card thumbnail images and profile image', () => {
  // .card-thumb should use object-position: center (not top center)
  const cardThumbBlock = cssContent.match(/\.card-thumb\s*\{([^}]+)\}/);
  assert.ok(cardThumbBlock, '.card-thumb rule must exist in style.css');
  assert.match(
    cardThumbBlock[1],
    /object-position:\s*center/,
    '.card-thumb must have object-position: center'
  );
  assert.doesNotMatch(
    cardThumbBlock[1],
    /object-position:\s*top\s+center/,
    '.card-thumb must not have object-position: top center'
  );

  // .profile-img should use object-position: center (not top)
  const profileImgBlock = cssContent.match(/\.profile-img\s*\{([^}]+)\}/);
  assert.ok(profileImgBlock, '.profile-img rule must exist in style.css');
  assert.match(
    profileImgBlock[1],
    /object-position:\s*center/,
    '.profile-img must have object-position: center'
  );

  // .card-thumb-wrap should center content
  const cardThumbWrapBlock = cssContent.match(/\.card-thumb-wrap\s*\{([^}]+)\}/);
  assert.ok(cardThumbWrapBlock, '.card-thumb-wrap rule must exist in style.css');
  assert.match(
    cardThumbWrapBlock[1],
    /display:\s*flex/,
    '.card-thumb-wrap should use display: flex for centering'
  );
  assert.match(
    cardThumbWrapBlock[1],
    /align-items:\s*center/,
    '.card-thumb-wrap should use align-items: center'
  );
  assert.match(
    cardThumbWrapBlock[1],
    /justify-content:\s*center/,
    '.card-thumb-wrap should use justify-content: center'
  );
});

test('TDD: .card-status badge does not wrap awkwardly and .card-top handles alignment', () => {
  // .card-status should prevent awkward wrapping
  const cardStatusBlock = cssContent.match(/\.card-status\s*\{([^}]+)\}/);
  assert.ok(cardStatusBlock, '.card-status rule must exist in style.css');
  assert.match(
    cardStatusBlock[1],
    /white-space:\s*nowrap/,
    '.card-status must have white-space: nowrap to avoid awkward word breaks'
  );

  // .card-top should reset child margins or handle flex alignment cleanly
  assert.ok(
    cssContent.includes('.card-top .card-status') || cssContent.includes('.card-top > .card-status'),
    'style.css should specify .card-top .card-status to normalize margin'
  );
});

