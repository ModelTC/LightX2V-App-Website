import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const js = await readFile(new URL('app.js', root), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length);
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target), `Missing #${target}`);
for (const [, asset] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await access(new URL(asset, root));
for (const key of ['mac', 'windows']) {
 const fallback = html.match(new RegExp(`data-download="${key}" href="([^"]+)"`))?.[1];
 const configured = js.match(new RegExp(`${key}: \\{[\\s\\S]*?url: '([^']+)'`))?.[1];
 assert(fallback && configured);
 assert.equal(fallback, configured, `Sync ${key} fallback`);
 assert.equal(new URL(configured).hostname, 'github.com');
}
console.log('Passed: assets, anchors, unique IDs and download fallbacks.');
