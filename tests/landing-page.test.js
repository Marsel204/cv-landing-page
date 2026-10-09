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

test('TDD: AutoCAD Electrical and IBM certificate images are tightly cropped and centered without off-center white margins', () => {
  // Read PNG IHDR dimensions (bytes 16..20 = width, 20..24 = height)
  function getPngDimensions(relPath) {
    const buf = fs.readFileSync(path.join(rootDir, relPath));
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20)
    };
  }

  // cert_autocad.png previously had a 102px left white strip and 33px top white strip (993x702 -> 891x669)
  const autocadDim = getPngDimensions('assets/cert_autocad.png');
  assert.equal(autocadDim.width, 891, 'assets/cert_autocad.png must have its 102px left blank margin cropped so the certificate is centered');
  assert.equal(autocadDim.height, 669, 'assets/cert_autocad.png must have its 33px top blank margin cropped so the certificate is centered');

  // cert_ibm.png previously had a 37px bottom white strip (1650x1275 -> 1650x1238)
  const ibmDim = getPngDimensions('assets/cert_ibm.png');
  assert.equal(ibmDim.width, 1650, 'assets/cert_ibm.png width must remain 1650');
  assert.equal(ibmDim.height, 1238, 'assets/cert_ibm.png must have its 37px bottom blank margin cropped');
});

test('TDD: Printable CV Mahasiswa document (cv-mahasiswa.html & PDF) follows all 7 Komponen CV Mahasiswa sections with NIM 2310314001', () => {
  const cvHtmlPath = path.join(rootDir, 'cv-mahasiswa.html');
  const cvPdfPath = path.join(rootDir, 'CV_Marselinus_Allen_Nugraha.pdf');

  assert.ok(fs.existsSync(cvHtmlPath), 'cv-mahasiswa.html must exist in repository root for GitHub maintainability');
  const cvHtml = fs.readFileSync(cvHtmlPath, 'utf-8');

  // 1. Header & NIM 2310314001
  assert.ok(cvHtml.includes('Marselinus Allen Nugraha'), 'Must include full name');
  assert.ok(cvHtml.includes('2310314001'), 'Must include NIM 2310314001');
  assert.ok(cvHtml.includes('0895343371256'), 'Must include active WhatsApp/phone number');
  assert.ok(cvHtml.includes('marselinusalen@gmail.com'), 'Must include email');
  assert.ok(cvHtml.includes('Tangerang'), 'Must include domisili city');
  assert.ok(cvHtml.includes('assets/profile.png'), 'Must include profile photo');

  // 2. Verify required section order: Summary -> Education -> Organizations -> Experience/Projects -> Skills (Hard & Soft) -> Certifications
  const idxSummary = cvHtml.indexOf('id="cv-summary"');
  const idxEducation = cvHtml.indexOf('id="cv-education"');
  const idxOrganizations = cvHtml.indexOf('id="cv-organizations"');
  const idxProjects = cvHtml.indexOf('id="cv-projects"');
  const idxSkills = cvHtml.indexOf('id="cv-skills"');
  const idxCerts = cvHtml.indexOf('id="cv-certifications"');

  assert.ok(idxSummary !== -1, 'Must include Ringkasan Profil section (#cv-summary)');
  assert.ok(idxEducation > idxSummary, 'Riwayat Pendidikan (#cv-education) must appear immediately after Ringkasan Profil');
  assert.ok(idxOrganizations > idxEducation, 'Pengalaman Organisasi (#cv-organizations) must follow Riwayat Pendidikan');
  assert.ok(idxProjects > idxOrganizations, 'Pengalaman Praktikum & Proyek (#cv-projects) must follow Organisasi');
  assert.ok(idxSkills > idxProjects, 'Keahlian (#cv-skills) must follow Proyek');
  assert.ok(idxCerts > idxSkills, 'Sertifikasi (#cv-certifications) must follow Keahlian');

  // 3. Skills must be divided into Hard Skills and Soft Skills
  assert.match(cvHtml, /Hard Skills/i, 'Keahlian section must include Hard Skills category');
  assert.match(cvHtml, /Soft Skills/i, 'Keahlian section must include Soft Skills category');

  // 4. Compiled PDF must exist and start with %PDF-
  assert.ok(fs.existsSync(cvPdfPath), 'CV_Marselinus_Allen_Nugraha.pdf must exist');
  const pdfHeader = fs.readFileSync(cvPdfPath).subarray(0, 5).toString('ascii');
  assert.equal(pdfHeader, '%PDF-', 'Generated PDF must have valid %PDF- header');

  // 5. GitHub Actions workflow must exist to auto-regenerate CV_Marselinus_Allen_Nugraha.pdf when cv-mahasiswa.html is edited on GitHub
  const workflowPath = path.join(rootDir, '.github', 'workflows', 'update-cv-pdf.yml');
  assert.ok(fs.existsSync(workflowPath), '.github/workflows/update-cv-pdf.yml must exist for automated GitHub PDF maintenance');
  const workflowYaml = fs.readFileSync(workflowPath, 'utf-8');
  assert.match(workflowYaml, /cv-mahasiswa\.html/, 'Workflow must trigger on or reference cv-mahasiswa.html');
  assert.match(workflowYaml, /CV_Marselinus_Allen_Nugraha\.pdf/, 'Workflow must output CV_Marselinus_Allen_Nugraha.pdf');
});

test('TDD: Google Search SEO metadata, ProfilePage + Person JSON-LD structured data, sitemap.xml, and robots.txt are configured', () => {
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const cvHtml = fs.readFileSync(path.join(rootDir, 'cv-mahasiswa.html'), 'utf-8');
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  const robotsPath = path.join(rootDir, 'robots.txt');

  // 1. Canonical URL, meta description, author, robots, and OpenGraph tags in index.html
  const descriptionTag = currentHtml.match(/<meta\s+name="description"\s+content=(["'])([\s\S]*?)\1/i);
  assert.ok(descriptionTag?.[2].includes('Marselinus Allen Nugraha'), 'index.html must include meta description with Marselinus Allen Nugraha');
  assert.match(currentHtml, /<meta\s+name="author"\s+content="Marselinus Allen Nugraha"/i, 'index.html must include meta author');
  assert.match(currentHtml, /<link\s+rel="canonical"\s+href="https:\/\/marsel204\.github\.io\/cv-landing-page\/"/i, 'index.html must include canonical link');
  assert.match(currentHtml, /<meta\s+property="og:title"\s+content="[^"]*Marselinus Allen Nugraha[^"]*"/i, 'index.html must include og:title');
  assert.match(currentHtml, /<meta\s+property="og:image"\s+content="https:\/\/marsel204\.github\.io\/cv-landing-page\/assets\/profile\.png"/i, 'index.html must include absolute og:image');

  // 2. Valid JSON-LD Schema.org ProfilePage & Person entity with sameAs links (LinkedIn, GitHub, Instagram)
  const jsonLdMatch = currentHtml.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(jsonLdMatch, 'index.html must include application/ld+json structured data script');
  const schemaObj = JSON.parse(jsonLdMatch[1].trim());
  assert.equal(schemaObj['@type'], 'ProfilePage', 'Root schema @type must be ProfilePage');
  assert.equal(schemaObj.mainEntity?.['@type'], 'Person', 'mainEntity @type must be Person');
  assert.equal(schemaObj.mainEntity?.name, 'Marselinus Allen Nugraha', 'Person name must be Marselinus Allen Nugraha');
  assert.ok(Array.isArray(schemaObj.mainEntity?.sameAs), 'Person schema must include sameAs array');
  assert.ok(schemaObj.mainEntity.sameAs.some(u => u.includes('linkedin.com')), 'sameAs must include LinkedIn URL');
  assert.ok(schemaObj.mainEntity.sameAs.some(u => u.includes('github.com/Marsel204')), 'sameAs must include GitHub URL');
  assert.ok(schemaObj.mainEntity.sameAs.some(u => u.includes('instagram.com/allen_nn')), 'sameAs must include Instagram @allen_nn URL');

  // 3. cv-mahasiswa.html also includes canonical and meta description
  assert.match(cvHtml, /<link\s+rel="canonical"\s+href="https:\/\/marsel204\.github\.io\/cv-landing-page\/cv-mahasiswa\.html"/i, 'cv-mahasiswa.html must include canonical URL');

  // 4. sitemap.xml and robots.txt exist and reference the public URLs
  assert.ok(fs.existsSync(sitemapPath), 'sitemap.xml must exist in repository root');
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8');
  assert.ok(sitemapXml.includes('https://marsel204.github.io/cv-landing-page/'), 'sitemap.xml must include root URL');
  assert.ok(sitemapXml.includes('https://marsel204.github.io/cv-landing-page/cv-mahasiswa.html'), 'sitemap.xml must include cv-mahasiswa.html');
  assert.ok(sitemapXml.includes('https://marsel204.github.io/cv-landing-page/CV_Marselinus_Allen_Nugraha.pdf'), 'sitemap.xml must include PDF CV');

  assert.ok(fs.existsSync(robotsPath), 'robots.txt must exist in repository root');
  const robotsTxt = fs.readFileSync(robotsPath, 'utf-8');
  assert.match(robotsTxt, /Sitemap:\s*https:\/\/marsel204\.github\.io\/cv-landing-page\/sitemap\.xml/i, 'robots.txt must point to sitemap.xml');

  // 5. Google Search Console ownership verification file googled3c9de243c6c2c99.html exists with exact token body
  const gscFilePath = path.join(rootDir, 'googled3c9de243c6c2c99.html');
  assert.ok(fs.existsSync(gscFilePath), 'googled3c9de243c6c2c99.html must exist for Google Search Console verification');
  assert.equal(
    fs.readFileSync(gscFilePath, 'utf-8').trim(),
    'google-site-verification: googled3c9de243c6c2c99.html',
    'Verification file must contain exact google-site-verification token string'
  );
});

test('TDD: English CV document (cv-english.html & CV_Marselinus_Allen_Nugraha_EN.pdf) exists and is linked from CV menu and index.html', () => {
  const cvEnHtmlPath = path.join(rootDir, 'cv-english.html');
  const cvEnPdfPath = path.join(rootDir, 'CV_Marselinus_Allen_Nugraha_EN.pdf');
  const cvIdHtml = fs.readFileSync(path.join(rootDir, 'cv-mahasiswa.html'), 'utf-8');
  const currentHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

  // 1. cv-english.html must exist with all 7 sections and NIM 2310314001 in English
  assert.ok(fs.existsSync(cvEnHtmlPath), 'cv-english.html must exist in repository root');
  const cvEnHtml = fs.readFileSync(cvEnHtmlPath, 'utf-8');
  assert.ok(cvEnHtml.includes('Marselinus Allen Nugraha'), 'English CV must include full name');
  assert.ok(cvEnHtml.includes('2310314001'), 'English CV must include NIM 2310314001');
  assert.ok(cvEnHtml.includes('id="cv-summary"'), 'English CV must include #cv-summary');
  assert.ok(cvEnHtml.includes('id="cv-education"'), 'English CV must include #cv-education');
  assert.ok(cvEnHtml.includes('id="cv-organizations"'), 'English CV must include #cv-organizations');
  assert.ok(cvEnHtml.includes('id="cv-projects"'), 'English CV must include #cv-projects');
  assert.ok(cvEnHtml.includes('id="cv-skills"'), 'English CV must include #cv-skills');
  assert.ok(cvEnHtml.includes('id="cv-certifications"'), 'English CV must include #cv-certifications');

  // 2. Both CV menus (cv-mahasiswa.html and cv-english.html) and index.html must link to the English CV
  assert.ok(cvIdHtml.includes('cv-english.html'), 'cv-mahasiswa.html toolbar menu must include a button to open cv-english.html');
  assert.ok(cvIdHtml.includes('CV_Marselinus_Allen_Nugraha_EN.pdf'), 'cv-mahasiswa.html toolbar menu must include a button to download English PDF');
  assert.ok(cvEnHtml.includes('cv-mahasiswa.html'), 'cv-english.html toolbar menu must include a button to switch to Indonesian CV');
  assert.ok(currentHtml.includes('cv-english.html'), 'index.html must include a button to open the English CV');

  // 3. Compiled English PDF must exist with valid %PDF- header
  assert.ok(fs.existsSync(cvEnPdfPath), 'CV_Marselinus_Allen_Nugraha_EN.pdf must exist');
  const pdfHeader = fs.readFileSync(cvEnPdfPath).subarray(0, 5).toString('ascii');
  assert.equal(pdfHeader, '%PDF-', 'Generated English PDF must have valid %PDF- header');
});
