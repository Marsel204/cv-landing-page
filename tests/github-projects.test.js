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

test('TDD: project cards in index.html contain data-categories for grouping and matching panel buttons', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  
  // Repo cards must have data-categories attributes for instant client-side grouping
  assert.ok(indexHtml.includes('data-categories='), 'Repo cards in index.html must have data-categories attributes');
  assert.ok(indexHtml.includes('data-categories="Industrial & CAD'), 'Industrial projects must have Industrial & CAD data-categories');
  assert.ok(indexHtml.includes('data-categories="Embedded & IoT'), 'Embedded projects must have Embedded & IoT data-categories');
  assert.ok(indexHtml.includes('data-categories="Agentic Engineering'), 'Agentic projects must have Agentic Engineering data-categories');
  assert.ok(indexHtml.includes('data-categories="Web & Tools'), 'Web projects must have Web & Tools data-categories');
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
  assert.ok(trackHtml.includes('DeploySkripsi') || trackHtml.includes('DeployATSC'), 'DeploySkripsi must be in the single sweep track');
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

test('TDD: project panel filter groups correctly map to project cards in index.html', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  
  // Extract all cards with their data-categories
  const cardRegex = /<div class="card repo-card"[^>]*data-repo-name="([^"]+)"[^>]*data-categories="([^"]+)"/g;
  let match;
  const cards = [];
  while ((match = cardRegex.exec(indexHtml)) !== null) {
    cards.push({ name: match[1], categories: match[2].toLowerCase() });
  }

  assert.equal(cards.length, 13, 'Must have exactly 13 projects in index.html after deleting the 5 requested projects');

  assert.ok(indexHtml.includes('Agentic Engineering'), 'index.html must include Agentic Engineering filter button');
  assert.ok(indexHtml.includes('data-filter="Agentic'), 'Filter button must have Agentic data-filter');

  const agentic = cards.filter(c => c.categories.includes('agentic'));
  assert.equal(agentic.length, 2, 'Agentic Engineering must match 2 projects (antigravity-embedded-suite and antigravity-agentic-kit)');
  const agenticNames = agentic.map(c => c.name);
  assert.ok(agenticNames.includes('antigravity-agentic-kit'), 'Agentic Engineering must match antigravity-agentic-kit');
  assert.ok(agenticNames.includes('antigravity-embedded-suite'), 'Agentic Engineering must match antigravity-embedded-suite');

  // Verify group counts
  const industrial = cards.filter(c => c.categories.includes('industrial') || c.categories.includes('cad'));
  assert.equal(industrial.length, 3, 'Industrial & CAD must match 3 projects');

  const embedded = cards.filter(c => c.categories.includes('embedded') || c.categories.includes('iot'));
  assert.equal(embedded.length, 4, 'Embedded & IoT must match 4 projects');

  const ai = cards.filter(c => c.categories.includes('ai') || c.categories.includes('vision'));
  assert.equal(ai.length, 6, 'AI & Vision must match 6 projects');

  const python = cards.filter(c => c.categories.includes('python'));
  assert.equal(python.length, 7, 'Python must match 7 projects');

  const web = cards.filter(c => (c.categories.includes('web') || c.categories.includes('tools')) && !c.categories.includes('agentic'));
  assert.equal(web.length, 3, 'Web & Tools must match remaining 3 projects');
});

test('TDD: Agentic Engineering filter panel exists and groups the skills and embedded suite repos', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('Agentic Engineering'), 'Filter bar must include Agentic Engineering button');
  assert.ok(indexHtml.includes('data-filter="Agentic'), 'Filter button must have Agentic data-filter attribute');
  
  // Verify antigravity-agentic-kit card has Agentic Engineering category
  const agenticCardRegex = /<div class="card repo-card"[^>]*data-repo-name="antigravity-agentic-kit"[^>]*data-categories="([^"]+)"/;
  const match = agenticCardRegex.exec(indexHtml);
  assert.ok(match, 'antigravity-agentic-kit card must exist');
  assert.ok(match[1].toLowerCase().includes('agentic'), 'antigravity-agentic-kit card must have agentic category');

  // Verify antigravity-embedded-suite card also has Agentic Engineering category
  const embeddedSuiteRegex = /<div class="card repo-card"[^>]*data-repo-name="antigravity-embedded-suite"[^>]*data-categories="([^"]+)"/;
  const matchEmbedded = embeddedSuiteRegex.exec(indexHtml);
  assert.ok(matchEmbedded, 'antigravity-embedded-suite card must exist');
  assert.ok(matchEmbedded[1].toLowerCase().includes('agentic'), 'antigravity-embedded-suite card must have agentic category');
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

test('TDD: index.html has deleted the 5 requested projects and retains remaining repositories', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  
  // Assert deleted project cards are NOT present
  assert.ok(!indexHtml.includes('data-repo-name="DeployATSC"'), 'DeployATSC card must be deleted');
  assert.ok(!indexHtml.includes('data-repo-name="IoT-Face-Detection-Sytem"'), 'IoT-Face-Detection-Sytem card must be deleted');
  assert.ok(!indexHtml.includes('data-repo-name="clock-dashboard"'), 'clock-dashboard card must be deleted');
  assert.ok(!indexHtml.includes('data-repo-name="Fuzzy-Inference-System"'), 'Fuzzy-Inference-System card must be deleted');
  assert.ok(!indexHtml.includes('data-repo-name="Dataset"'), 'Dataset card must be deleted');

  // Retain active repositories
  assert.ok(indexHtml.includes('data-repo-name="DeploySkripsi"'), 'index.html must include DeploySkripsi');
  assert.ok(indexHtml.includes('data-repo-name="LangPlayeExt"'), 'index.html must include LangPlayeExt');
  assert.ok(indexHtml.includes('data-repo-name="frieren-theme"'), 'index.html must include frieren-theme');
  assert.ok(indexHtml.includes('data-repo-name="cv-landing-page"'), 'index.html must include cv-landing-page');
});

test('TDD: Every project card in index.html and active github.js metadata has a unique thumbnail image (no duplicates)', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  // 1. Check all .repo-card thumbnails in index.html
  const cardImgRegex = /<div class="card repo-card"[^>]*data-repo-name="([^"]+)"[\s\S]*?<img src="([^"]+)"[^>]*class="card-thumb"/g;
  let match;
  const htmlImages = new Map();
  while ((match = cardImgRegex.exec(indexHtml)) !== null) {
    const [, repoName, imgSrc] = match;
    assert.notEqual(imgSrc, 'assets/profile.png', `Project ${repoName} must not reuse hero cutout assets/profile.png`);
    assert.ok(
      !htmlImages.has(imgSrc),
      `Duplicate project thumbnail "${imgSrc}" found on "${repoName}" (already used by "${htmlImages.get(imgSrc)}")`
    );
    htmlImages.set(imgSrc, repoName);

    const fullPath = path.join(rootDir, imgSrc);
    assert.ok(fs.existsSync(fullPath), `Thumbnail file must exist for ${repoName}: ${imgSrc}`);
    assert.ok(fs.statSync(fullPath).size > 0, `Thumbnail file must be non-empty for ${repoName}: ${imgSrc}`);
  }
  assert.equal(htmlImages.size, 13, 'All 13 project cards in index.html must have unique thumbnails');

  // 2. Check all active projects in github.js (FEATURED_ENGINEERING_PROJECTS + non-excluded REPO_METADATA)
  const excluded = githubModule.EXCLUDED_REPOS || new Set();
  const metadata = githubModule.REPO_METADATA;
  const featured = githubModule.FEATURED_ENGINEERING_PROJECTS;

  const jsImages = new Map();
  for (const proj of featured) {
    assert.ok(proj.image, `Featured project ${proj.name} must have an image`);
    assert.ok(
      !jsImages.has(proj.image),
      `Duplicate image "${proj.image}" in github.js on "${proj.name}" (already used by "${jsImages.get(proj.image)}")`
    );
    jsImages.set(proj.image, proj.name);
  }

  for (const [repoName, meta] of Object.entries(metadata)) {
    if (excluded.has(repoName)) continue;
    assert.ok(meta.image, `Active repo ${repoName} must have an image`);
    assert.notEqual(meta.image, 'assets/profile.png', `Active repo ${repoName} must not reuse assets/profile.png`);
    assert.ok(
      !jsImages.has(meta.image),
      `Duplicate image "${meta.image}" in github.js on "${repoName}" (already used by "${jsImages.get(meta.image)}")`
    );
    jsImages.set(meta.image, repoName);

    const fullPath = path.join(rootDir, meta.image);
    assert.ok(fs.existsSync(fullPath), `Thumbnail file must exist for ${repoName}: ${meta.image}`);
    assert.ok(fs.statSync(fullPath).size > 0, `Thumbnail file must be non-empty for ${repoName}: ${meta.image}`);
  }
});






