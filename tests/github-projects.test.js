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
    { name: 'antigravity-agentic-kit', language: 'HTML', fork: false, tags: ['SDLC', 'TDD'], categories: ['Web & Tools'] },
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
  assert.equal(webRepos.length, 2);
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
    assert.ok(repoNames.includes('DeployATSC'), 'Fallback must contain DeployATSC');
    assert.ok(repoNames.includes('fuzzylogic-tft'), 'Fallback must contain fuzzylogic-tft');
    assert.ok(repoNames.includes('IndustrialRCA'), 'Fallback must contain IndustrialRCA');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('index.html: contains GitHub repositories section, filter bar, and loads github.js', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="github-projects-grid"'), 'Must have github-projects-grid element in index.html');
  assert.ok(indexHtml.includes('id="repo-filter-bar"'), 'Must have repo-filter-bar element in index.html');
  assert.ok(indexHtml.includes('data-filter="All"'), 'Must have All filter button');
  assert.ok(indexHtml.includes('data-filter="Python"'), 'Must have Python filter button');
  assert.ok(indexHtml.includes('data-filter="Embedded"'), 'Must have Embedded filter button');
  assert.ok(indexHtml.includes('github.js'), 'index.html must reference github.js script');
});

test('combined single sweep: all featured and GitHub projects live in one single sideways carousel track', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  
  // Must NOT have a separate subheader row dividing the projects into two sections
  assert.ok(!indexHtml.includes('class="section-subheader-row"'), 'Should not have a separate subheader divider; projects should be combined');

  // Both offline engineering projects and GitHub projects must be in the same carousel track
  const trackIndex = indexHtml.indexOf('class="github-carousel-track"');
  assert.ok(trackIndex !== -1, 'Track must exist');
  
  const trackHtml = indexHtml.slice(trackIndex);
  assert.ok(trackHtml.includes('PLC-Based Elevator Simulation'), 'Elevator simulation must be in the single sweep track');
  assert.ok(trackHtml.includes('Direct On Line (DOL) Motor Starter'), 'DOL Motor Starter must be in the single sweep track');
  assert.ok(trackHtml.includes('DeployATSC'), 'DeployATSC must be in the single sweep track');
  assert.ok(trackHtml.includes('fuzzylogic-tft'), 'fuzzylogic-tft must be in the single sweep track');

  // Sideways navigation arrows must be present
  assert.ok(indexHtml.includes('id="repo-scroll-left"'), 'Must have left scroll button');
  assert.ok(indexHtml.includes('id="repo-scroll-right"'), 'Must have right scroll button');
});

test('sideways scroll: CSS contains horizontal scroll track styling with scroll snap', () => {
  const css = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf8');
  assert.ok(css.includes('.github-carousel-track'), 'Must contain .github-carousel-track selector');
  assert.ok(css.includes('overflow-x'), 'Must configure overflow-x for horizontal scroll');
  assert.ok(css.includes('scroll-snap-type'), 'Must support CSS scroll-snap');
  assert.ok(css.includes('.carousel-nav-btn'), 'Must style carousel navigation buttons');
});

test('picture thumbnail: repo cards in index.html and renderRepoCard contain card-thumb-wrap and card-thumb', () => {
  const repoWithImage = {
    name: 'DeployATSC',
    displayName: 'DeployATSC',
    description: 'Production Edge Runtime',
    url: 'https://github.com/Marsel204/DeployATSC',
    language: 'Python',
    image: 'assets/proj_traffic.png',
    stars: 5,
    forks: 2,
    tags: ['Python', 'NVIDIA Jetson'],
    updatedYear: '2026'
  };

  const cardHtml = githubModule.renderRepoCard(repoWithImage);
  assert.ok(cardHtml.includes('card-thumb-wrap'), 'Rendered card must include card-thumb-wrap');
  assert.ok(cardHtml.includes('card-thumb'), 'Rendered card must include card-thumb');
  assert.ok(cardHtml.includes('assets/proj_traffic.png'), 'Rendered card must include image source');

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('assets/proj_fuzzylogic_tft.png'), 'index.html must include fuzzylogic-tft image');
  assert.ok(indexHtml.includes('assets/proj_industrial_rca.png'), 'index.html must include IndustrialRCA image');
});


