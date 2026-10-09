import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let githubModule = await import('../github.js');

test('TDD: github.js module should exist and export required helpers', () => {
  assert.ok(githubModule, 'github.js module must be importable');
  assert.equal(typeof githubModule.formatRepoData, 'function');
  assert.equal(typeof githubModule.filterRepos, 'function');
  assert.equal(typeof githubModule.renderRepoCard, 'function');
  assert.equal(typeof githubModule.fetchGithubProjects, 'function');
});

test('formatRepoData: accurately transforms raw GitHub API objects and fills fallback descriptions', () => {
  const rawRepo = {
    name: 'IoT-Face-Detection-Sytem',
    description: null,
    html_url: 'https://github.com/Marsel204/IoT-Face-Detection-Sytem',
    language: 'C++',
    stargazers_count: 3,
    forks_count: 1,
    fork: false,
    topics: ['esp32-cam', 'biometrics']
  };

  const formatted = githubModule.formatRepoData(rawRepo);
  assert.equal(formatted.name, 'IoT-Face-Detection-Sytem');
  assert.ok(formatted.description && formatted.description.length > 10, 'Fallback description must be provided');
  assert.equal(formatted.language, 'C++');
  assert.equal(formatted.url, 'https://github.com/Marsel204/IoT-Face-Detection-Sytem');
  assert.equal(formatted.stars, 3);
  assert.equal(formatted.forks, 1);
  assert.ok(Array.isArray(formatted.tags), 'Tags should be an array');
  assert.ok(formatted.tags.includes('ESP32-CAM') || formatted.tags.includes('C++'));
});

test('filterRepos: filters repositories by active category or returns all non-forks', () => {
  const sampleRepos = [
    { name: 'DeployATSC', language: 'Python', fork: false, tags: ['Python', 'YOLO11', 'AI'], categories: ['Python', 'AI'] },
    { name: 'fuzzylogic-tft', language: 'C', fork: false, tags: ['C', 'Embedded'], categories: ['Embedded'] },
    { name: 'IoT-Face-Detection-Sytem', language: 'C++', fork: false, tags: ['C++', 'Embedded'], categories: ['Embedded'] },
    { name: 'clock-dashboard', language: 'JavaScript', fork: false, tags: ['Web', 'JavaScript'], categories: ['Web & Tools'] },
    { name: 'antigravity-agentic-kit', language: 'HTML', fork: false, tags: ['SDLC', 'TDD', 'Agentic Workflows'], categories: ['Agentic Engineering', 'Agentic'] },
    { name: 'Dataset', language: null, fork: true, tags: [] }
  ];

  const allNonForks = githubModule.filterRepos(sampleRepos, 'All');
  assert.equal(allNonForks.length, 5, 'Should exclude forks when filtering All');

  const pythonOnly = githubModule.filterRepos(sampleRepos, 'Python');
  assert.equal(pythonOnly.length, 1);
  assert.equal(pythonOnly[0].name, 'DeployATSC');

  const embedded = githubModule.filterRepos(sampleRepos, 'Embedded');
  assert.equal(embedded.length, 2);

  const aiRepos = githubModule.filterRepos(sampleRepos, 'AI');
  assert.equal(aiRepos.length, 1);
  assert.equal(aiRepos[0].name, 'DeployATSC');

  const webRepos = githubModule.filterRepos(sampleRepos, 'Web');
  assert.equal(webRepos.length, 1);

  // Support full button labels
  const embeddedIoT = githubModule.filterRepos(sampleRepos, 'Embedded & IoT');
  assert.equal(embeddedIoT.length, 2, 'Embedded & IoT must match embedded projects');

  const aiVision = githubModule.filterRepos(sampleRepos, 'AI & Vision');
  assert.equal(aiVision.length, 1, 'AI & Vision must match DeployATSC');

  const webTools = githubModule.filterRepos(sampleRepos, 'Web & Tools');
  assert.equal(webTools.length, 1, 'Web & Tools must match Web and Tools projects');

  const agenticEng = githubModule.filterRepos(sampleRepos, 'Agentic Engineering');
  assert.equal(agenticEng.length, 1, 'Agentic Engineering must match antigravity-agentic-kit');
  assert.equal(agenticEng[0].name, 'antigravity-agentic-kit');
});

test('TDD: REPO_METADATA and FEATURED_ENGINEERING_PROJECTS correctly group projects into categories', () => {
  const metadata = githubModule.REPO_METADATA;
  assert.ok(metadata, 'REPO_METADATA must be exported');

  // IndustrialRCA must belong to Industrial & CAD
  assert.ok(
    metadata['IndustrialRCA'].category.some(c => c.toLowerCase().includes('industrial') || c.toLowerCase().includes('cad')),
    'IndustrialRCA must be grouped into Industrial & CAD'
  );

  // IoT-Face-Detection-Sytem must belong to AI & Vision
  assert.ok(
    metadata['IoT-Face-Detection-Sytem'].category.some(c => c.toLowerCase().includes('ai') || c.toLowerCase().includes('vision')),
    'IoT-Face-Detection-Sytem face recognition biometrics must be grouped into AI & Vision'
  );

  // antigravity-agentic-kit and antigravity-embedded-suite must belong to Agentic Engineering
  assert.ok(
    metadata['antigravity-agentic-kit'].category.some(c => c.toLowerCase().includes('agentic')),
    'antigravity-agentic-kit must be grouped into Agentic Engineering'
  );
  assert.ok(
    metadata['antigravity-embedded-suite'].category.some(c => c.toLowerCase().includes('agentic')),
    'antigravity-embedded-suite must be grouped into Agentic Engineering'
  );
});

test('renderRepoCard: produces safe and styled HTML card markup with XSS escaping', () => {
  const repo = {
    name: 'DeployATSC',
    displayName: '<script>alert("xss")</script>DeployATSC',
    description: 'Production Edge Runtime <img src=x onerror=alert(1)> for ATSC',
    url: 'https://github.com/Marsel204/DeployATSC',
    language: 'Python',
    stars: 5,
    forks: 2,
    tags: ['Python', 'NVIDIA Jetson', 'YOLO11'],
    updatedYear: '2026'
  };

  const html = githubModule.renderRepoCard(repo);
  assert.ok(html.includes('&lt;script&gt;'), 'XSS in title must be escaped');
  assert.ok(!html.includes('<script>'), 'Raw script tags must not be present');
  assert.ok(html.includes('&lt;img'), 'XSS in description must be escaped');
  assert.ok(html.includes('https://github.com/Marsel204/DeployATSC'), 'Must contain repo URL');
  assert.ok(html.includes('target="_blank"'), 'External link must open in new tab');
  assert.ok(html.includes('rel="noopener noreferrer"'), 'External link must have rel security attributes');
  assert.ok(html.includes('project-title') && html.includes('card'), 'Must use card styling');
  assert.ok(html.includes('Python'), 'Must display primary language');
  assert.ok(html.includes('5'), 'Must render star counter');
  assert.ok(html.includes('2'), 'Must render fork counter');
});

test('fetchGithubProjects: falls back to curated offline repositories when fetch fails or errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Network error (simulated offline)');
  };

  try {
    const repos = await githubModule.fetchGithubProjects('Marsel204');
    assert.ok(Array.isArray(repos), 'Must return an array of repositories');
    assert.ok(repos.length > 0, 'Must contain fallback repositories');
    const repoNames = repos.map(r => r.name);
    assert.ok(repoNames.includes('DeploySkripsi') || repoNames.includes('DeployATSC'), 'Fallback must contain DeploySkripsi or DeployATSC');
    assert.ok(repoNames.includes('fuzzylogic-tft'), 'Fallback must contain fuzzylogic-tft');
    assert.ok(repoNames.includes('IndustrialRCA'), 'Fallback must contain IndustrialRCA');
    assert.ok(!repoNames.includes('IoT-Face-Detection-Sytem'), 'Fallback must not contain deleted IoT-Face-Detection-Sytem');
    assert.ok(!repoNames.includes('clock-dashboard'), 'Fallback must not contain deleted clock-dashboard');
    assert.ok(!repoNames.includes('Fuzzy-Inference-System'), 'Fallback must not contain deleted Fuzzy-Inference-System');
    assert.ok(!repoNames.includes('Dataset'), 'Fallback must not contain deleted Dataset');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TDD: REPO_METADATA contains active repositories from Marsel204', () => {
  const metadata = githubModule.REPO_METADATA;
  const activeRepos = [
    'DeploySkripsi',
    'LangPlayeExt',
    'LangPlay',
    'frieren-theme',
    'cv-landing-page'
  ];

  for (const name of activeRepos) {
    assert.ok(metadata[name], `REPO_METADATA must contain metadata for ${name}`);
    assert.ok(metadata[name].title && metadata[name].title.length > 5, `${name} must have a title`);
    assert.ok(metadata[name].description && metadata[name].description.length > 15, `${name} must have a description`);
    assert.ok(Array.isArray(metadata[name].tags) && metadata[name].tags.length > 0, `${name} must have tags`);
    assert.ok(Array.isArray(metadata[name].category) && metadata[name].category.length > 0, `${name} must have categories`);
  }
});

test('TDD: createCarouselAutoRoll smoothly rolls carousel, reverses at boundaries, and yields on user interaction', () => {
  assert.equal(typeof githubModule.createCarouselAutoRoll, 'function', 'github.js must export createCarouselAutoRoll');

  const classes = new Set();
  const listeners = {};
  const mockContainer = {
    scrollLeft: 0,
    scrollWidth: 1400,
    clientWidth: 1000,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          classes.has(c) ? classes.delete(c) : classes.add(c);
        } else if (force) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
      },
      contains: (c) => classes.has(c)
    },
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    removeEventListener: (type, fn) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter(f => f !== fn);
      }
    }
  };

  const controller = githubModule.createCarouselAutoRoll(mockContainer, {
    speedPxPerSec: 100,
    autoStart: false
  });

  // 1. Sub-pixel accumulation: 5ms step at 100px/s = 0.5px (even if DOM truncates scrollLeft to integer)
  controller.step(0.005);
  controller.step(0.005);
  assert.ok(mockContainer.scrollLeft >= 1, 'Sub-pixel deltas must accumulate and advance scrollLeft');
  assert.ok(classes.has('is-auto-rolling'), 'Container must have is-auto-rolling class while actively rolling');

  // 2. Advance to right boundary (maxScroll = 400) and verify smooth direction reversal
  controller.step(4.0);
  assert.equal(mockContainer.scrollLeft, 400, 'Must clamp at maxScroll (scrollWidth - clientWidth)');
  assert.equal(controller.getDirection(), -1, 'Must reverse direction (-1) at right boundary');

  // 3. Step in reverse and reach left boundary (0)
  controller.step(1.0);
  assert.equal(mockContainer.scrollLeft, 300, 'Must roll backward when direction is -1');
  controller.step(3.5);
  assert.equal(mockContainer.scrollLeft, 0, 'Must clamp at 0 on left boundary');
  assert.equal(controller.getDirection(), 1, 'Must reverse direction (+1) at left boundary');

  // 4. Pause on user interaction and sync manual scroll position on resume
  controller.pause();
  assert.ok(!classes.has('is-auto-rolling'), 'is-auto-rolling class must be removed when paused');
  mockContainer.scrollLeft = 150; // User manually scrolled to 150
  controller.step(1.0);
  assert.equal(mockContainer.scrollLeft, 150, 'Must not advance while paused');

  controller.resume();
  controller.step(0.5);
  assert.equal(mockContainer.scrollLeft, 200, 'Must resume rolling smoothly from the user-scrolled position');

  controller.destroy();
});

