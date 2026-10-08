/**
 * github.js - GitHub Repositories Fetcher & Dynamic Renderer
 * Fetches public repositories for Marsel204 with curated fallbacks and language filtering.
 */

export const REPO_METADATA = {
  'DeployATSC': {
    title: 'DeployATSC (Adaptive Traffic Signal Control)',
    description: 'Production edge deployment runtime for Adaptive Traffic Signal Control on NVIDIA Jetson. Coordinates YOLO11 multi-object tracking, Sugeno ANFIS fuzzy inference, and RS-485 fail-safe actuation.',
    image: 'assets/proj_traffic.png',
    category: ['Python', 'AI', 'Embedded'],
    tags: ['Python', 'NVIDIA Jetson', 'YOLO11', 'Sugeno ANFIS', 'RS-485', 'FastAPI']
  },
  'fuzzylogic-tft': {
    title: 'fuzzylogic-tft (MBG Food Freshness & TFT GUI)',
    description: 'Indonesian MBG food freshness research prototype with C99 and Python fuzzy inference engines and a light interactive touchscreen UI for GUITION JC2432W328C and ESP32-S3.',
    image: 'assets/proj_fuzzylogic_tft.png',
    category: ['Embedded', 'C/C++'],
    tags: ['C', 'ESP32-S3', 'GUITION TFT', 'C99', 'Fuzzy Logic', 'Arduino CLI']
  },
  'IndustrialRCA': {
    title: 'Industrial Root Cause Analysis (RCA) System',
    description: 'Production-grade industrial RCA system built with LangGraph and DeepSeek AI, grounded in ISA-95 asset hierarchies, ISO 14224/FMEA taxonomies, and Modbus RTU telemetry streaming.',
    image: 'assets/proj_industrial_rca.png',
    category: ['Python', 'AI'],
    tags: ['Python', 'LangGraph', 'DeepSeek AI', 'ISA-95', 'Modbus RTU', 'ISO 14224']
  },
  'antigravity-embedded-suite': {
    title: 'Antigravity Embedded Engineering Suite',
    description: '4-pillar agentic development framework for microcontrollers (ESP32, Arduino, RP2040): KiCad schematic generation, headless compilation/flashing, sensor calibration, and crash triage.',
    image: 'assets/proj_embedded_suite.png',
    category: ['Python', 'Embedded'],
    tags: ['Python', 'ESP32', 'Arduino', 'KiCad', 'Sensor Calibration', 'Triage']
  },
  'IoT-Face-Detection-Sytem': {
    title: 'ESP32-CAM Biometric Safe Firmware',
    description: 'Standalone biometric face-recognition safe controller running locally on ESP32-CAM (AI-Thinker) with OV2640 image acquisition, face enrollment, and physical solenoid actuation.',
    image: 'assets/proj_iot_face.png',
    category: ['Embedded', 'C/C++'],
    tags: ['C++', 'ESP32-CAM', 'Biometrics', 'OV2640', 'FreeRTOS', 'IoT']
  },
  'antigravity-agentic-kit': {
    title: 'Antigravity Agentic Engineering Kit',
    description: 'High-discipline SDLC skills, TDD enforcement, token-efficient action formatting, interactive architecture generation, persistent memory, and parallel worktree management.',
    image: 'assets/proj_embedded_suite.png',
    category: ['Web & Tools'],
    tags: ['SDLC', 'TDD', 'Agentic Workflows', 'Worktree Automation', 'Shell']
  },
  'clock-dashboard': {
    title: 'SYS.TIME — Live Clock Developer Dashboard',
    description: 'Minimalist real-time developer dashboard digital clock with drift-free wall-clock synchronization, timezone detection, and zero CPU leakage on background tabs.',
    image: 'assets/proj_clock_dashboard.png',
    category: ['Web & Tools'],
    tags: ['JavaScript', 'HTML5', 'Performance', 'A11y', 'Tabular Telemetry']
  },
  'VisionLabs': {
    title: 'VisionLabs Computer Vision Lab',
    description: 'Computer vision research and experimentation repository exploring real-time deep learning model benchmarks, object detection, and edge camera calibration pipelines.',
    image: 'assets/proj_traffic.png',
    category: ['Python', 'AI'],
    tags: ['Python', 'OpenCV', 'PyTorch', 'Computer Vision']
  },
  'Fuzzy-Inference-System': {
    title: 'Fuzzy Inference System Core Engine',
    description: 'Mamdani and Sugeno fuzzy inference system implementations with customizable membership functions and defuzzification algorithms for embedded control.',
    image: 'assets/proj_fuzzylogic_tft.png',
    category: ['Python', 'AI'],
    tags: ['Python', 'Fuzzy Logic', 'Mamdani', 'Sugeno', 'Control Systems']
  },
  'Yolo-Inference': {
    title: 'YOLO Inference Real-Time Pipeline',
    description: 'High-throughput YOLO inference pipelines optimized for low-latency vehicle and object detection in edge computing environments.',
    image: 'assets/proj_traffic.png',
    category: ['Python', 'AI'],
    tags: ['Python', 'YOLO', 'Object Detection', 'TensorRT']
  }
};

/**
 * Format raw GitHub API repository object into standard model
 */
export function formatRepoData(rawRepo) {
  const meta = REPO_METADATA[rawRepo.name] || {};
  const rawDesc = rawRepo.description && rawRepo.description.trim().length > 0 ? rawRepo.description.trim() : null;
  const description = rawDesc || meta.description || `Open source project ${rawRepo.name} by Marsel204 on GitHub.`;
  const image = rawRepo.image || meta.image || null;
  
  let tags = meta.tags ? [...meta.tags] : [];
  if (tags.length === 0) {
    if (rawRepo.language) tags.push(rawRepo.language);
    if (Array.isArray(rawRepo.topics)) {
      rawRepo.topics.forEach(t => {
        if (!tags.includes(t)) tags.push(t);
      });
    }
    if (tags.length === 0) tags = ['GitHub Project'];
  }

  const updatedYear = rawRepo.updated_at ? new Date(rawRepo.updated_at).getFullYear().toString() : '2026';

  return {
    name: rawRepo.name,
    displayName: meta.title || rawRepo.name,
    description: description,
    image: image,
    url: rawRepo.html_url || `https://github.com/Marsel204/${rawRepo.name}`,
    language: rawRepo.language || (tags[0] || 'Code'),
    stars: rawRepo.stargazers_count ?? 0,
    forks: rawRepo.forks_count ?? 0,
    fork: Boolean(rawRepo.fork),
    tags: tags.slice(0, 5),
    categories: meta.category || [rawRepo.language || 'Other'],
    updatedYear: updatedYear
  };
}

export const FEATURED_ENGINEERING_PROJECTS = [
  {
    name: 'PLC-Based Elevator Simulation',
    displayName: 'PLC-Based Elevator Simulation',
    description: 'Engineered a multi-floor industrial elevator controller using Siemens TIA Portal integrated with Factory I/O 3D simulation. Implemented call request sequencing, position encoders, safety interlocks, and motor direction controls.',
    image: 'assets/proj_elevator.png',
    url: '#projects',
    language: 'Industrial Automation',
    stars: 0,
    forks: 0,
    fork: false,
    tags: ['Siemens TIA Portal', 'Factory I/O', 'Ladder Logic (PLC)'],
    categories: ['Industrial', 'Industrial & CAD'],
    updatedYear: '2025',
    footerStatus: 'Simulated & Verified \u2713'
  },
  {
    name: 'Prototype Fuzzy Traffic Controller',
    displayName: 'Prototype Fuzzy Traffic Controller',
    description: 'Designed an intelligent adaptive traffic light management system pairing computer vision (YOLO) for vehicle queue density detection with a Fuzzy Logic Controller executed on an ESP32 to adjust green light intervals in real time.',
    image: 'assets/proj_traffic.png',
    url: 'https://github.com/Marsel204/DeployATSC',
    language: 'AI & Embedded IoT',
    stars: 0,
    forks: 0,
    fork: false,
    tags: ['ESP32', 'YOLO Vision', 'Python', 'Fuzzy Logic'],
    categories: ['Embedded', 'AI', 'Embedded & IoT', 'AI & Vision'],
    updatedYear: '2025',
    footerStatus: 'Tested with Vehicle Detection \u2713'
  },
  {
    name: 'Direct On Line (DOL) Motor Starter & Panel Diagram',
    displayName: 'Direct On Line (DOL) Motor Starter & Panel Diagram',
    description: 'Designed complete schematic wiring and physical industrial panel layout in AutoCAD Electrical. Included power and control circuits, contactor & thermal overload sizing, terminal strip numbering, and automated Bill of Materials (BOM).',
    image: 'assets/proj_cad.png',
    url: '#projects',
    language: 'Electrical CAD',
    stars: 0,
    forks: 0,
    fork: false,
    tags: ['AutoCAD Electrical', 'DOL Motor Starter', 'Panel Layout', 'BOM Generation'],
    categories: ['Industrial', 'Industrial & CAD'],
    updatedYear: '2025',
    footerStatus: 'Schematic & Panel Layout Complete \u2713'
  }
];

/**
 * Filter repository list by category
 */
export function filterRepos(repos, filter = 'All') {
  const nonForks = repos.filter(r => !r.fork);
  if (!filter || filter === 'All') return nonForks;

  const f = filter.toLowerCase();
  return nonForks.filter(r => {
    if (f === 'industrial' || f === 'industrial & cad') {
      return (r.categories && r.categories.some(c => c.toLowerCase().includes('industrial') || c.toLowerCase().includes('cad'))) ||
             (r.tags && r.tags.some(t => ['industrial automation', 'electrical cad', 'siemens tia portal', 'autocad electrical', 'factory i/o', 'ladder logic (plc)'].includes(t.toLowerCase())));
    }
    if (f === 'python') {
      return (r.language && r.language.toLowerCase() === 'python') ||
             (r.tags && r.tags.some(t => t.toLowerCase() === 'python'));
    }
    if (f === 'embedded' || f === 'c/c++') {
      return (r.language && ['c', 'c++'].includes(r.language.toLowerCase())) ||
             (r.tags && r.tags.some(t => ['embedded', 'esp32', 'iot', 'c', 'c++'].includes(t.toLowerCase()))) ||
             (r.categories && r.categories.some(c => ['embedded', 'c/c++'].includes(c.toLowerCase())));
    }
    if (f === 'ai' || f === 'ai & vision') {
      return (r.tags && r.tags.some(t => ['ai', 'yolo', 'fuzzy logic', 'deepseek ai', 'computer vision', 'sugeno anfis'].includes(t.toLowerCase()))) ||
             (r.categories && r.categories.some(c => c.toLowerCase() === 'ai'));
    }
    if (f === 'web' || f === 'tools') {
      return (r.language && ['javascript', 'html', 'css'].includes(r.language.toLowerCase())) ||
             (r.tags && r.tags.some(t => ['javascript', 'html', 'sdlc', 'tdd'].includes(t.toLowerCase()))) ||
             (r.categories && r.categories.some(c => c.toLowerCase().includes('web')));
    }
    return r.language && r.language.toLowerCase() === f;
  });
}

/**
 * Render single repository card HTML
 */
export function renderRepoCard(repo) {
  const pillElements = repo.tags.map(tag => `<span class="pill-sm">${escapeHtml(tag)}</span>`).join('');
  const starsBadge = repo.stars > 0 ? `
    <span class="repo-stat" title="${repo.stars} Stars">
      <svg class="stat-icon" viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
      </svg>
      ${repo.stars}
    </span>` : '';

  const forksBadge = repo.forks > 0 ? `
    <span class="repo-stat" title="${repo.forks} Forks">
      <svg class="stat-icon" viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
        <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h4.5A2.25 2.25 0 0012.5 6.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-.878zm6.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.25 12a.75.75 0 111.5 0 .75.75 0 01-1.5 0zm.75-2.25A2.25 2.25 0 108 14.25a2.25 2.25 0 000-4.5z"/>
      </svg>
      ${repo.forks}
    </span>` : '';

  const thumbElement = repo.image ? `
      <div class="card-thumb-wrap">
        <img src="${escapeHtml(repo.image)}" alt="${escapeHtml(repo.displayName || repo.name)}" class="card-thumb">
      </div>` : '';

  const footerElement = repo.footerStatus ? `
      <div class="cert-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="link-placeholder">${escapeHtml(repo.footerStatus)}</span>
        ${repo.url && repo.url.startsWith('http') ? `<a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer" class="project-gh-link">View Repo &nearr;</a>` : ''}
      </div>` : `
      <div class="cert-footer">
        <a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer" class="project-gh-link">
          <span>View on GitHub</span>
          &nearr;
        </a>
      </div>`;

  return `
    <div class="card repo-card" data-repo-name="${escapeHtml(repo.name)}">
      ${thumbElement}
      <div class="card-top">
        <span class="project-tag">${escapeHtml(repo.language || 'Project')}</span>
        <div class="repo-meta-right">
          ${starsBadge}
          ${forksBadge}
          <span class="year-badge">${escapeHtml(repo.updatedYear || '2026')}</span>
        </div>
      </div>
      <h3 class="project-title">${escapeHtml(repo.displayName || repo.name)}</h3>
      <p class="project-description">${escapeHtml(repo.description)}</p>
      <div class="pill-list" style="margin-bottom: 1.25rem;">
        ${pillElements}
      </div>
      ${footerElement}
    </div>
  `.trim();
}

/**
 * Basic HTML escaping helper to prevent XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fetch repositories from GitHub API with fallback, prepending core featured projects
 */
export async function fetchGithubProjects(username = 'Marsel204') {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`);
    if (!res.ok) {
      throw new Error(`GitHub API responded with status ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response structure from GitHub API');
    }
    const fetched = data.map(formatRepoData);
    // Combine featured offline engineering projects with fetched GitHub repositories
    return [...FEATURED_ENGINEERING_PROJECTS, ...fetched];
  } catch (err) {
    console.warn('[GitHub Projects] API fetch failed or rate-limited, utilizing curated offline repos:', err.message);
    // Return curated offline repositories so UI never fails
    const curated = Object.keys(REPO_METADATA).map(name => {
      const meta = REPO_METADATA[name];
      return {
        name: name,
        displayName: meta.title,
        description: meta.description,
        image: meta.image || null,
        url: `https://github.com/${username}/${name}`,
        language: meta.tags[0] || 'Python',
        stars: 0,
        forks: 0,
        fork: false,
        tags: meta.tags,
        categories: meta.category,
        updatedYear: '2026'
      };
    });
    return [...FEATURED_ENGINEERING_PROJECTS, ...curated];
  }
}

/**
 * Initialize dynamic GitHub projects grid in DOM if present
 */
export function initGithubSection() {
  const container = document.getElementById('github-projects-grid');
  const filterBar = document.getElementById('repo-filter-bar');
  if (!container) return;

  const scrollLeftBtn = document.getElementById('repo-scroll-left');
  const scrollRightBtn = document.getElementById('repo-scroll-right');

  let allRepos = [];
  let currentFilter = 'All';

  function updateScrollButtons() {
    if (!scrollLeftBtn || !scrollRightBtn) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    scrollLeftBtn.disabled = container.scrollLeft <= 4;
    scrollRightBtn.disabled = container.scrollLeft >= maxScrollLeft - 4;
  }

  function render(reposToRender) {
    if (!reposToRender.length) {
      container.innerHTML = `
        <div class="no-repos-notice" style="flex: 1 0 100%; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No repositories found for this category.
        </div>
      `;
      updateScrollButtons();
      return;
    }
    container.innerHTML = reposToRender.map(renderRepoCard).join('\n');
    container.scrollTo({ left: 0, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 150);
  }

  // Sideways navigation buttons
  if (scrollLeftBtn) {
    scrollLeftBtn.addEventListener('click', () => {
      container.scrollBy({ left: -360, behavior: 'smooth' });
    });
  }

  if (scrollRightBtn) {
    scrollRightBtn.addEventListener('click', () => {
      container.scrollBy({ left: 360, behavior: 'smooth' });
    });
  }

  container.addEventListener('scroll', updateScrollButtons, { passive: true });
  window.addEventListener('resize', updateScrollButtons, { passive: true });

  // Mouse drag-to-scroll on desktop
  let isDown = false;
  let startX = 0;
  let scrollStart = 0;

  container.addEventListener('mousedown', (e) => {
    // Ignore clicks on links or buttons
    if (e.target.closest('a') || e.target.closest('button')) return;
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollStart = container.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.4;
    container.scrollLeft = scrollStart - walk;
  });

  // Filter selection
  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const target = e.target.closest('.filter-btn');
      if (!target) return;
      filterBar.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');
      currentFilter = target.getAttribute('data-filter') || 'All';
      render(filterRepos(allRepos, currentFilter));
    });
  }

  updateScrollButtons();

  fetchGithubProjects('Marsel204').then(repos => {
    allRepos = repos;
    render(filterRepos(allRepos, currentFilter));
  });
}

// Auto-run if running in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGithubSection);
  } else {
    initGithubSection();
  }
}
