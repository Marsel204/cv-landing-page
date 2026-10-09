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

test('TDD: Hero bio has text-align justify, availability badge removed, and contact details included', () => {
  // .hero-bio must have text-align: justify
  const heroBioBlock = cssContent.match(/\.hero-bio\s*\{([^}]+)\}/);
  assert.ok(heroBioBlock, '.hero-bio rule must exist in style.css');
  assert.match(
    heroBioBlock[1],
    /text-align:\s*justify/,
    '.hero-bio must have text-align: justify'
  );

  // Availability badge should be removed
  assert.ok(
    !htmlContent.includes('Available for IoT, Firmware & Engineering Roles'),
    'Availability badge should be removed from hero section'
  );

  // Contact info verification
  assert.ok(htmlContent.includes('Tangerang, Indonesia'), 'Domisili Tangerang, Indonesia must be present');
  assert.ok(htmlContent.includes('0895343371256'), 'Phone number 0895343371256 must be present');
  assert.ok(
    htmlContent.includes('linkedin.com/in/marselinus-nugraha-699b29272'),
    'LinkedIn profile link must be present'
  );
});

test('TDD: About Me section highlights agentic AI engineering (RAG, LangGraph) and removes Siemens/TIA Portal specifics', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const aboutSectionMatch = currentHtml.match(/<section id="about"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(aboutSectionMatch, 'About section must exist');
  const aboutText = aboutSectionMatch[1];

  assert.doesNotMatch(aboutText, /Siemens/i, 'About section should not specify Siemens');
  assert.doesNotMatch(aboutText, /TIA Portal/i, 'About section should not specify TIA Portal');
  assert.match(aboutText, /LangGraph/i, 'About section should describe LangGraph');
  assert.match(aboutText, /RAG/i, 'About section should describe RAG');
  assert.match(aboutText, /agentic/i, 'About section should mention agentic engineering/AI');
});

test('TDD: Hero bio highlights agentic AI (RAG, LangGraph) and removes PLC/TIA Portal specifics', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const heroBioMatch = currentHtml.match(/<p class="hero-bio">([\s\S]*?)<\/p>/);
  assert.ok(heroBioMatch, 'Hero bio must exist');
  const heroBioText = heroBioMatch[1];

  assert.doesNotMatch(heroBioText, /TIA Portal/i, 'Hero bio should not specify TIA Portal');
  assert.match(heroBioText, /LangGraph/i, 'Hero bio should describe LangGraph');
  assert.match(heroBioText, /RAG/i, 'Hero bio should describe RAG');
  assert.match(heroBioText, /agentic/i, 'Hero bio should mention agentic AI/systems');
});

test('TDD: Hero role headline reflects updated portfolio with Firmware/Embedded, IoT, and Agentic AI', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const heroRoleMatch = currentHtml.match(/<p class="hero-role">([\s\S]*?)<\/p>/);
  assert.ok(heroRoleMatch, 'Hero role must exist');
  const heroRoleText = heroRoleMatch[1].trim();

  assert.notEqual(
    heroRoleText,
    'Electrical Engineering Student &bull; Firmware & IoT Developer',
    'Hero role must be updated from the old headline'
  );
  assert.match(heroRoleText, /Electrical Engineering Student/i, 'Hero role must retain Electrical Engineering Student');
  assert.match(heroRoleText, /Firmware|Embedded/i, 'Hero role must mention Firmware or Embedded');
  assert.match(heroRoleText, /IoT/i, 'Hero role must mention IoT');
  assert.match(heroRoleText, /Agentic AI/i, 'Hero role must highlight Agentic AI');
});

test('TDD: Experience and Education cards include organization logos with proper CSS styling', () => {
  const expSectionMatch = htmlContent.match(/<section id="experience"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(expSectionMatch, 'Experience section must exist');
  const expSection = expSectionMatch[1];

  const expLogoMatches = expSection.match(/<img[^>]+class=["'][^"']*org-logo[^"']*["']/g) || [];
  assert.equal(expLogoMatches.length, 5, 'All 5 experience cards must include an .org-logo image');
  assert.ok(expSection.includes('assets/logo_ksm_iot.png'), 'Experience section must reference logo_ksm_iot.png');
  assert.ok(expSection.includes('assets/logo_upnvj.png'), 'Experience section must reference logo_upnvj.png');
  assert.ok(expSection.includes('assets/logo_hmte.png'), 'Experience section must reference logo_hmte.png');
  assert.ok(expSection.includes('assets/logo_sman12.png'), 'Experience section must reference logo_sman12.png');

  const eduSectionMatch = htmlContent.match(/<section id="education"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(eduSectionMatch, 'Education section must exist');
  const eduSection = eduSectionMatch[1];

  const eduLogoMatches = eduSection.match(/<img[^>]+class=["'][^"']*org-logo[^"']*["']/g) || [];
  assert.equal(eduLogoMatches.length, 2, 'Both education cards must include an .org-logo image');
  assert.ok(eduSection.includes('assets/logo_upnvj.png'), 'Education section must reference logo_upnvj.png');
  assert.ok(eduSection.includes('assets/logo_sman12.png'), 'Education section must reference logo_sman12.png');

  const orgLogoBlock = cssContent.match(/\.org-logo\s*\{([^}]+)\}/);
  assert.ok(orgLogoBlock, '.org-logo rule must exist in style.css');
  assert.match(orgLogoBlock[1], /object-fit:\s*contain/, '.org-logo must use object-fit: contain');
});

test('TDD: Multi-window view switcher combines similar tabs (About & Contact, Experience & Education, Skills & Projects, Certifications) and lays out Experience items in multi-window grid', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const currentCss = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf-8');

  // 1. Navbar links combine related sections into 4 unified tabs
  assert.ok(currentHtml.includes('About &amp; Contact') || currentHtml.includes('About & Contact'), 'Navbar must include combined "About & Contact" tab');
  assert.ok(currentHtml.includes('Experience &amp; Education') || currentHtml.includes('Experience & Education'), 'Navbar must include combined "Experience & Education" tab');
  assert.ok(currentHtml.includes('Skills &amp; Projects') || currentHtml.includes('Skills & Projects'), 'Navbar must include combined "Skills & Projects" tab');
  assert.ok(currentHtml.includes('Certifications'), 'Navbar must include "Certifications" tab');

  const expectedWindows = ['about', 'experience', 'projects', 'certifications'];
  for (const win of expectedWindows) {
    assert.ok(
      currentHtml.includes(`data-window="${win}"`),
      `Navbar must include a tab trigger with data-window="${win}"`
    );
  }

  // 2. Sections are grouped into the 4 combined window-view containers
  assert.match(currentHtml, /id="hero"[^>]*class="[^"]*window-view[^"]*is-active"[^>]*data-window-id="about"/, '#hero must belong to about window-view and be active by default');
  assert.match(currentHtml, /id="about"[^>]*class="[^"]*window-view[^"]*is-active"[^>]*data-window-id="about"/, '#about must belong to about window-view and be active by default');
  assert.match(currentHtml, /id="contact"[^>]*class="[^"]*window-view[^"]*is-active"[^>]*data-window-id="about"/, '#contact must belong to about window-view and be active by default');

  assert.match(currentHtml, /id="experience"[^>]*class="[^"]*window-view"[^>]*data-window-id="experience"/, '#experience must belong to experience window-view');
  assert.match(currentHtml, /id="education"[^>]*class="[^"]*window-view"[^>]*data-window-id="experience"/, '#education must belong to experience window-view');

  assert.match(currentHtml, /id="skills"[^>]*class="[^"]*window-view"[^>]*data-window-id="projects"/, '#skills must belong to projects window-view');
  assert.match(currentHtml, /id="projects"[^>]*class="[^"]*window-view"[^>]*data-window-id="projects"/, '#projects must belong to projects window-view');

  assert.match(currentHtml, /id="certifications"[^>]*class="[^"]*window-view"[^>]*data-window-id="certifications"/, '#certifications must belong to certifications window-view');

  // 3. CSS hides inactive .window-view and reveals .window-view.is-active
  const windowViewBlock = currentCss.match(/\.window-view\s*\{([^}]+)\}/);
  assert.ok(windowViewBlock, '.window-view rule must exist in style.css');
  assert.match(windowViewBlock[1], /display:\s*none/, '.window-view must default to display: none');

  const windowViewActiveBlock = currentCss.match(/\.window-view\.is-active\s*\{([^}]+)\}/);
  assert.ok(windowViewActiveBlock, '.window-view.is-active rule must exist in style.css');
  assert.match(windowViewActiveBlock[1], /display:\s*block/, '.window-view.is-active must set display: block');

  // 4. Active navbar tab styling exists
  assert.ok(
    currentCss.includes('.nav-links a.active'),
    'style.css must style .nav-links a.active for active window tab indication'
  );

  // 5. Experience items use a multi-window responsive grid instead of packing into a single column
  const timelineGridBlock = currentCss.match(/\.timeline-grid\s*\{([^}]+)\}/);
  assert.ok(timelineGridBlock, '.timeline-grid rule must exist in style.css');
  assert.match(timelineGridBlock[1], /display:\s*grid/, '.timeline-grid must use CSS grid for multi-window cards');
  assert.match(timelineGridBlock[1], /grid-template-columns:/, '.timeline-grid must define multi-column grid-template-columns');

  // 6. Window switcher script exists without cluttered window-titlebar traffic dots or bottom window-pager bar
  assert.ok(!currentHtml.includes('window-titlebar'), 'Cluttered window-titlebar traffic dots must be removed from cards');
  assert.ok(!currentHtml.includes('window-dots'), 'window-dots must be removed from cards');
  assert.ok(currentHtml.includes('switchWindow'), 'index.html must include switchWindow controller function');
  assert.ok(!currentHtml.includes('window-pager'), 'Bottom window-pager bar must be removed');
});

test('TDD: Contact section uses full-width Apple bento panel with 4-column channel cards instead of clunky narrow 3+1 wrapping buttons', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const currentCss = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf-8');

  const contactSectionMatch = currentHtml.match(/<section id="contact"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(contactSectionMatch, 'Contact section must exist');
  const contactSection = contactSectionMatch[1];

  // 1. Must not have clunky parenthetical button labels that caused 3+1 wrapping
  assert.ok(!contactSection.includes('WhatsApp (0895343371256)'), 'Must replace parenthetical WhatsApp button text with structured channel card');
  assert.ok(!contactSection.includes('GitHub Profile (Marsel204)'), 'Must replace parenthetical GitHub button text with structured channel card');

  // 2. Must contain 4 structured .contact-channel cards with icons, labels, and values
  const channelMatches = contactSection.match(/class=["']contact-channel["']/g) || [];
  assert.equal(channelMatches.length, 4, 'Contact panel must render 4 structured .contact-channel cards (Email, WhatsApp, LinkedIn, GitHub)');
  assert.ok(contactSection.includes('contact-channel-label'), 'Contact channels must include .contact-channel-label');
  assert.ok(contactSection.includes('contact-channel-value'), 'Contact channels must include .contact-channel-value');

  // 3. .contact-box must span the full section container width (not constrained to max-width: 680px)
  const contactBoxBlock = currentCss.match(/\.contact-box\s*\{([^}]+)\}/);
  assert.ok(contactBoxBlock, '.contact-box rule must exist in style.css');
  assert.doesNotMatch(contactBoxBlock[1], /max-width:\s*680px/, '.contact-box must not be constrained to a narrow 680px box');

  // 4. .contact-links must use CSS Grid for even multi-column layout (preventing 3+1 orphan wrap)
  const contactLinksBlock = currentCss.match(/\.contact-links\s*\{([^}]+)\}/);
  assert.ok(contactLinksBlock, '.contact-links rule must exist in style.css');
  assert.match(contactLinksBlock[1], /display:\s*grid/, '.contact-links must use CSS Grid instead of unstructured flex-wrap');

  // 5. .contact-channel must have instant tactile :active scale response
  const channelActiveBlock = currentCss.match(/\.contact-channel:active\s*\{([^}]+)\}/);
  assert.ok(channelActiveBlock, '.contact-channel:active rule must exist');
  assert.match(channelActiveBlock[1], /transform:\s*scale\(/, '.contact-channel:active must provide tactile scale feedback');
});

test('TDD: Skills section cards use structured icon headers and uniform 2-column grid chips instead of ragged flex-wrap white-on-white pills', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const currentCss = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf-8');

  const skillsSectionMatch = currentHtml.match(/<section id="skills"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(skillsSectionMatch, 'Skills section must exist');
  const skillsSection = skillsSectionMatch[1];

  // 1. All 3 skill category cards must have structured headers with icon badges
  const headerMatches = skillsSection.match(/class=["']skill-card-header["']/g) || [];
  assert.equal(headerMatches.length, 3, 'All 3 skill category cards must include a .skill-card-header');
  const iconWrapMatches = skillsSection.match(/class=["']skill-icon-wrap["']/g) || [];
  assert.equal(iconWrapMatches.length, 3, 'All 3 skill category cards must include a .skill-icon-wrap icon badge');

  // 2. .skill-category-card .pill-list must use a 2-column CSS Grid so rows don't have jagged right-side gaps
  const skillPillListBlock = currentCss.match(/\.skill-category-card\s+\.pill-list\s*\{([^}]+)\}/);
  assert.ok(skillPillListBlock, '.skill-category-card .pill-list rule must exist in style.css');
  assert.match(skillPillListBlock[1], /display:\s*grid/, '.skill-category-card .pill-list must use CSS Grid');
  assert.match(skillPillListBlock[1], /grid-template-columns:\s*repeat\(2/, '.skill-category-card .pill-list must use 2 equal columns');

  // 3. .pill must define a subtle dark alpha border for surface contrast (not white-on-white border)
  const pillBlock = currentCss.match(/\.pill\s*\{([^}]+)\}/);
  assert.ok(pillBlock, '.pill rule must exist in style.css');
  assert.doesNotMatch(pillBlock[1], /border:\s*1px solid rgba\(255,\s*255,\s*255/, '.pill must not use white-on-white border that washes out on light cards');
});



