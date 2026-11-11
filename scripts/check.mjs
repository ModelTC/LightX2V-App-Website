import assert from 'node:assert/strict';
import { readFile, access, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSnapshot } from './releases.mjs';
import { validatePublicationMedia } from './media-readiness.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const releases = validateSnapshot(JSON.parse(await readFile(resolve(root, 'site-data/releases.json'), 'utf8')));
const homePages = ['index.html', 'zh/index.html'];
const legacyPages = ['download/index.html', 'zh/download/index.html'];
const pages = [...homePages, ...legacyPages];
const canonicalRoot = process.env.SITE_URL || 'https://light-ai.top/LightX2V-App-Website/';
const htmlCache = new Map();

async function readHTML(path) {
  if (!htmlCache.has(path)) htmlCache.set(path, await readFile(path, 'utf8'));
  return htmlCache.get(path);
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value.replaceAll('&amp;', '&')]));
}

for (const page of pages) {
  const path = resolve(dist, page);
  const html = await readHTML(path);
  const isHome = homePages.includes(page);
  assert(html.startsWith('<!doctype html>'), `${page}: missing HTML document`);
  assert(html.includes(page.startsWith('zh/') ? 'lang="zh-CN"' : 'lang="en"'), `${page}: incorrect document language`);
  assert(!html.includes('undefined'), `${page}: unresolved template value`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target), `${page}: missing #${target}`);

  for (const tag of html.matchAll(/<(?:a|img|link|script|source)\b[^>]*>/g)) {
    const attrs = attributes(tag[0]);
    if (attrs['data-platform-download']) {
      assert.equal(attrs.href, releases[attrs['data-platform-download']]?.url, `${page}: download snapshot mismatch`);
    }
    for (const platform of ['mac', 'windows']) {
      if (attrs[`data-${platform}-url`]) assert.equal(attrs[`data-${platform}-url`], releases[platform].url, `${page}: automatic ${platform} download mismatch`);
    }
    const target = attrs.src ?? attrs.href;
    if (!target || /^(?:https?:|mailto:|data:|#)/.test(target)) continue;
    assert(!target.startsWith('/'), `${page}: absolute asset or route breaks project-path hosting: ${target}`);
    const url = new URL(target, `file://${path}`);
    let targetPath = fileURLToPath(url);
    assert(targetPath === dist || targetPath.startsWith(`${dist}${sep}`), `${page}: target escapes dist: ${target}`);
    const info = await stat(targetPath).catch(() => null);
    assert(info, `${page}: missing local resource ${target}`);
    if (info.isDirectory()) {
      targetPath = resolve(targetPath, 'index.html');
      await access(targetPath);
    }
    if (isHome && attrs.href) {
      assert(!legacyPages.some(legacy => resolve(dist, legacy) === targetPath), `${page}: homepage still links to a legacy download page: ${target}`);
    }
    if (url.hash && targetPath.endsWith('.html')) {
      const targetHTML = await readHTML(targetPath);
      const targetIDs = [...targetHTML.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      assert(targetIDs.includes(decodeURIComponent(url.hash.slice(1))), `${page}: missing local anchor ${target}`);
    }
  }
  // Download URLs must be in the initial HTML, including the no-JavaScript path.
  if (isHome) {
    for (const platform of ['mac', 'windows']) assert(html.includes(releases[platform].url), `${page}: missing ${platform} download`);
    for (const id of ['download', 'faq', 'mac-card', 'windows-card']) assert(ids.includes(id), `${page}: missing #${id}`);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${page}: homepage must have one main heading`);
  } else {
    const fallbackTag = [...html.matchAll(/<a\b[^>]*>/g)].find(([tag]) => /\bdata-legacy-home\b/.test(tag));
    assert(fallbackTag, `${page}: missing usable legacy fallback`);
    const destination = new URL(attributes(fallbackTag[0]).href, `file://${path}`);
    assert.equal(resolve(fileURLToPath(destination)), resolve(dist, page.startsWith('zh/') ? 'zh/' : 'index.html'), `${page}: incorrect fallback locale or path`);
    assert.equal(destination.hash, '#download', `${page}: fallback must target the homepage download section`);
    assert(/<script type="module" src="(?:\.\.\/)+legacy-download\.js"><\/script>/.test(html), `${page}: missing legacy redirect module`);
    assert(!/<script[^>]*src="[^"]*(?:app|stars)\.js"/.test(html), `${page}: legacy alias loads full-page behavior`);
    const canonical = new URL(page.startsWith('zh/') ? 'zh/' : '', canonicalRoot).href;
    assert(html.includes(`rel="canonical" href="${canonical}"`), `${page}: canonical must point to the homepage`);
  }
  assert(/rel="icon"[^>]*favicon-monochrome/.test(html), `${page}: missing dedicated monochrome favicon`);
}

if (process.argv.includes('--publish')) {
  const media = JSON.parse(await readFile(resolve(root, 'site-data/media.json'), 'utf8'));
  const approval = JSON.parse(await readFile(resolve(root, 'site-data/publication.json'), 'utf8'));
  await validatePublicationMedia({ root, media, approval });
  console.log('Passed: approved media snapshot matches the publication assets.');
}
console.log('Passed: two localized homepages, legacy download aliases, public assets, routes, anchors and download fallbacks.');
