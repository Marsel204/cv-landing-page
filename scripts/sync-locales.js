import fs from 'node:fs';

const source = new URL('../locales.json', import.meta.url);
const page = new URL('../index.html', import.meta.url);
const dictionary = JSON.parse(fs.readFileSync(source, 'utf8'));
const json = JSON.stringify(dictionary).replace(/</g, '\\u003c');
const html = fs.readFileSync(page, 'utf8');
const marker = /(<script id="locale-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!marker.test(html)) throw new Error('Missing locale-data script in index.html');
fs.writeFileSync(page, html.replace(marker, (_, before, after) => before + json + after));
console.log('Synchronized locales.json into index.html.');
