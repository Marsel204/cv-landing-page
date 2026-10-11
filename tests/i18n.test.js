import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeLanguage, translate, localizeProject } from '../i18n.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const locales = JSON.parse(fs.readFileSync(new URL('../locales.json', import.meta.url), 'utf8'));
const projects = JSON.parse(html.match(/<script id="project-data"[^>]*>([\s\S]*?)<\/script>/)[1]);

test('Only supported language choices are accepted; missing or invalid preferences keep English', () => {
  assert.equal(normalizeLanguage('id'), 'id');
  for (const value of ['en', null, undefined, '', 'fr', 'ID', '<script>'])
    assert.equal(normalizeLanguage(value), 'en');
});

test('Messages fall back safely and interpolate values without treating replacement characters as code', () => {
  assert.equal(translate('id', locales.ui, '{count} projects', {count:4}), '4 proyek');
  assert.equal(translate('en', locales.ui, '{count} projects', {count:4}), '4 projects');
  assert.equal(translate('id', locales.ui, 'Untranslated brand'), 'Untranslated brand');
  assert.equal(translate('id', locales.ui, 'View {title} project details', {title:'$& {count}'}), 'Lihat detail proyek $& {count}');
});

test('Indonesian has complete narratives, capabilities and workflow descriptions for every project', () => {
  assert.deepEqual(Object.keys(locales.projects).sort(), Object.keys(projects).sort());
  for (const [id, original] of Object.entries(projects)) {
    const snapshot = structuredClone(original);
    const translated = localizeProject(original, 'id', locales.projects);
    for (const field of ['title', 'domain', 'stage', 'summary', 'overview', 'problem', 'contribution', 'approach', 'outcome', 'evidence', 'alt', 'caption'])
      assert.ok(typeof locales.projects[id][field] === 'string' && locales.projects[id][field].trim(), `${id}: missing ${field}`);
    assert.equal(translated.features.length, original.features.length);
    assert.ok(translated.features.every(feature => feature.length === 2 && feature.every(value => typeof value === 'string' && value.trim())));
    assert.equal(translated.flow.length, original.flow.length);
    assert.equal(translated.workflowDetails.length, translated.flow.length);
    assert.ok([...translated.flow, ...translated.workflowDetails].every(value => typeof value === 'string' && value.trim()));
    for (const field of ['id', 'category', 'url', 'source', 'tags', 'additionalTags'])
      assert.deepEqual(translated[field], original[field], `${id}: preserve ${field}`);
    assert.deepEqual(original, snapshot);
    assert.deepEqual(localizeProject(original, 'en', locales.projects), original);
  }
});

test('Every generated translation hook resolves, with matching interpolation parameters in both languages', () => {
  const decode = value => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const hooks = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(match => decode(match[1]));
  assert.ok(hooks.length > 100);
  for (const message of hooks) assert.ok(Object.hasOwn(locales.ui, message), message);
  const parameters = value => [...value.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort();
  for (const [english, indonesian] of Object.entries(locales.ui))
    assert.deepEqual(parameters(indonesian), parameters(english), english);
});

test('The embedded dictionary matches its editable source and both language buttons have explicit labels', () => {
  assert.deepEqual(JSON.parse(html.match(/<script id="locale-data"[^>]*>([\s\S]*?)<\/script>/)[1]), locales);
  assert.match(html, /data-language="en"[^>]+lang="en"[^>]+aria-label="Use English"/);
  assert.match(html, /data-language="id"[^>]+lang="id"[^>]+aria-label="Gunakan Bahasa Indonesia"/);
});
