import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderPage, renderLegacyDownloadPage } from '../src/templates.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const canonicalRoot = process.env.SITE_URL || 'https://light-ai.top/LightX2V-App-Website/';
const releases = JSON.parse(await readFile(path.join(root, 'site-data/releases.json'), 'utf8'));
let media;
try {
  media = JSON.parse(await readFile(path.join(root, 'site-data/media.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  media = { schemaVersion: 1, screenshots: { mac: null, windows: null }, gallery: [] };
}

for (const platform of ['mac', 'windows']) {
  if (!releases[platform]?.url) throw new Error(`Missing ${platform} download URL in site-data/releases.json`);
}
new URL(canonicalRoot);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const filename of ['styles.css', 'app.js', 'theme-init.js', 'stars.js', 'legacy-download.js']) {
  await cp(path.join(root, filename), path.join(output, filename));
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });

const pages = [
  { locale: 'en', filename: 'index.html' },
  { locale: 'en', legacy: true, filename: 'download/index.html' },
  { locale: 'zh', filename: 'zh/index.html' },
  { locale: 'zh', legacy: true, filename: 'zh/download/index.html' },
];
for (const { locale, legacy, filename } of pages) {
  const filepath = path.join(output, filename);
  await mkdir(path.dirname(filepath), { recursive: true });
  const html = legacy ? renderLegacyDownloadPage({ locale, canonicalRoot })
    : renderPage({ locale, releases, media, canonicalRoot });
  await writeFile(filepath, html);
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Built English and Chinese homepages with legacy download redirects in dist/.');
