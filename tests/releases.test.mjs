import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { repositories, resolveMacRelease, resolveWindowsRelease, resolveStars, releasesChanged, validateSnapshot } from '../scripts/releases.mjs';
import { githubJSON, fetchWindowsReleases, synchronizeReleases } from '../scripts/sync-releases.mjs';
import { recordPublishedSnapshot } from '../scripts/record-publication.mjs';

function release(platform, { tag = platform === 'mac' ? 'stable' : 'v0.3.12', preview = false, published = '2026-11-09T07:50:01Z', id = 10 } = {}) {
  const repository = repositories[platform];
  const name = platform === 'mac' ? 'LightX2V-APP-macOS-arm64.zip' : `LightX2V-Windows-${tag.replace(/^v/, '')}-win-x64.zip`;
  return {
    id, tag_name: tag, draft: false, prerelease: preview,
    published_at: published,
    html_url: `https://github.com/${repository}/releases/tag/${tag}`,
    assets: [{ id: 20, name, state: 'uploaded', size: 4096, updated_at: published, digest: 'sha256:original', browser_download_url: `https://github.com/${repository}/releases/download/${tag}/${name}` }],
  };
}

const checkedAt = '2026-11-11T00:00:00.000Z';
const framework = { full_name: repositories.stars, stargazers_count: 2999 };
function snapshot(mac = release('mac'), windows = [release('windows', { preview: true })]) {
  return { schemaVersion: 1, syncedAt: checkedAt, mac: resolveMacRelease(mac), windows: resolveWindowsRelease(windows), stars: resolveStars(framework, checkedAt) };
}

test('Mac selects the uploaded Apple Silicon app ZIP from the explicit Stable tag', () => {
  const stable = release('mac');
  stable.assets.unshift({ ...stable.assets[0], name: 'checksums.txt' });
  const selected = resolveMacRelease(stable);
  assert.equal(selected.url, 'https://github.com/ModelTC/LightX2V-Mac-App/releases/download/stable/LightX2V-APP-macOS-arm64.zip');
  assert.equal(selected.channel, 'stable');
  assert.throws(() => resolveMacRelease({ ...stable, tag_name: 'latest' }), /stable tag/);
  assert.throws(() => resolveMacRelease({ ...stable, draft: true }), /stable tag/);
  assert.throws(() => resolveMacRelease({ ...stable, prerelease: true }), /stable tag/);
});

test('Windows prefers a downloadable stable release over a newer preview', () => {
  const olderStable = release('windows', { tag: 'v0.3.10', published: '2026-11-01T00:00:00Z' });
  const newerPreview = release('windows', { tag: 'v0.4.0-beta', preview: true });
  assert.equal(resolveWindowsRelease([newerPreview, olderStable]).version, 'v0.3.10');
});

function rollingWindowsRelease() {
  const latest = release('windows', { tag: 'latest' });
  latest.assets[0].name = 'LightX2V-APP-Windows-x64.zip';
  latest.assets[0].browser_download_url = `https://github.com/${repositories.windows}/releases/download/latest/${latest.assets[0].name}`;
  return latest;
}

test('Windows recognizes the rolling x64 package and labels it Latest rather than Stable', () => {
  const selected = resolveWindowsRelease([release('windows', { preview: true }), rollingWindowsRelease()]);
  assert.equal(selected.channel, 'latest');
  assert.equal(selected.url, 'https://github.com/ModelTC/LightX2V-Windows-App/releases/download/latest/LightX2V-APP-Windows-x64.zip');
  assert.equal(validateSnapshot(snapshot(release('mac'), [rollingWindowsRelease()])).windows.channel, 'latest');
  const stable = release('windows', { tag: 'v0.3.10', published: '2026-11-01T00:00:00Z' });
  assert.equal(resolveWindowsRelease([rollingWindowsRelease(), stable]).version, 'v0.3.10');
  const arm = rollingWindowsRelease();
  arm.assets[0].name = 'LightX2V-APP-Windows-arm64.zip';
  assert.throws(() => resolveWindowsRelease([arm]), /no published/);
});

test('a replaced Windows Latest package triggers a deployment without a tag or URL change', () => {
  const latest = rollingWindowsRelease();
  const previous = snapshot(release('mac'), [latest]);
  latest.assets[0].id += 1;
  latest.assets[0].digest = 'sha256:replacement';
  const next = snapshot(release('mac'), [latest]);
  assert.equal(previous.windows.url, next.windows.url);
  assert(releasesChanged(previous, next));
});

test('Windows permits previews when no stable build is downloadable, sorts by publication, and skips drafts', () => {
  const draft = { ...release('windows', { tag: 'v9.0', published: '2026-12-01T00:00:00Z' }), draft: true };
  const missingStable = { ...release('windows', { tag: 'v0.3.10' }), assets: [] };
  const oldPreview = release('windows', { tag: 'v0.3.11', preview: true, published: '2026-11-01T00:00:00Z' });
  const newPreview = release('windows', { preview: true });
  assert.equal(resolveWindowsRelease([draft, missingStable, oldPreview, newPreview]).version, 'v0.3.12');
  assert.equal(resolveWindowsRelease([oldPreview, newPreview]).channel, 'preview');
});

test('incomplete and foreign download assets cannot replace verified app links', () => {
  const incomplete = release('windows');
  incomplete.assets[0].state = 'new';
  assert.throws(() => resolveWindowsRelease([incomplete]), /no published/);
  const foreign = release('mac');
  foreign.assets[0].browser_download_url = 'https://example.org/install.zip';
  assert.throws(() => resolveMacRelease(foreign), /no uploaded/);
  const arm = release('windows');
  arm.assets[0].name = 'LightX2V-Windows-0.3.12-win-arm64.zip';
  assert.throws(() => resolveWindowsRelease([arm]), /no published/);
});

test('the Windows list is paginated far enough to find an older stable release', async () => {
  const firstPage = Array.from({ length: 100 }, () => release('windows', { preview: true }));
  const calls = [];
  const results = await fetchWindowsReleases(async path => {
    calls.push(path);
    return path.endsWith('page=1') ? firstPage : [release('windows', { tag: 'v0.3.0', published: '2026-10-01T00:00:00Z' })];
  });
  assert.equal(calls.length, 2);
  assert(calls[1].endsWith('per_page=100&page=2'));
  assert.equal(resolveWindowsRelease(results).version, 'v0.3.0');
});

test('a replaced Mac Stable asset is detected without changing its tag or URL', () => {
  const previous = snapshot();
  const replacement = release('mac');
  replacement.assets[0].id = 21;
  replacement.assets[0].updated_at = '2026-11-11T01:00:00Z';
  replacement.assets[0].digest = 'sha256:replacement';
  const next = snapshot(replacement);
  assert.equal(previous.mac.version, next.mac.version);
  assert.equal(previous.mac.url, next.mac.url);
  assert(releasesChanged(previous, next));
  const metadataOnly = structuredClone(previous);
  metadataOnly.stars.count += 1;
  metadataOnly.syncedAt = '2026-11-12T00:00:00Z';
  assert.equal(releasesChanged(previous, metadataOnly), false);
});

test('GitHub HTTP errors are diagnostic and API requests target the fixed public API', async () => {
  let request;
  await assert.rejects(githubJSON('/repos/ModelTC/LightX2V', {
    token: undefined,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: false, status: 503 };
    },
  }), /GitHub 503/);
  assert.equal(request.url, 'https://api.github.com/repos/ModelTC/LightX2V');
  assert.equal(request.options.headers['X-GitHub-Api-Version'], '2022-11-28');
});

async function withSnapshot(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'lightx2v-release-test-'));
  const path = join(directory, 'releases.json');
  await writeFile(path, `${JSON.stringify(snapshot(), null, 2)}\n`);
  try { await callback(path); } finally { await rm(directory, { recursive: true, force: true }); }
}

test('API failure preserves the cached file byte for byte, and strict mode reports failure', async () => {
  await withSnapshot(async path => {
    const before = await readFile(path, 'utf8');
    const getJSON = async () => { throw new Error('Network unavailable'); };
    const fallback = await synchronizeReleases({ snapshotPath: path, getJSON });
    assert.equal(fallback.stale, true);
    assert.equal(fallback.changed, false);
    assert.match(fallback.error, /Network unavailable/);
    assert.equal(await readFile(path, 'utf8'), before);
    await assert.rejects(synchronizeReleases({ snapshotPath: path, getJSON, strict: true }), /Network unavailable/);
    assert.equal(await readFile(path, 'utf8'), before);
  });
});

test('unchanged app downloads refresh metadata without requesting a scheduled deployment', async () => {
  await withSnapshot(async path => {
    const getJSON = async url => url.endsWith('/tags/stable') ? release('mac') : url.includes('/releases?') ? [release('windows', { preview: true })] : framework;
    const result = await synchronizeReleases({ snapshotPath: path, getJSON, now: () => '2026-11-11T01:00:00Z' });
    assert.equal(result.changed, false);
    assert.equal(result.stale, false);
    const written = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(written.stars.updatedAt, '2026-11-11T01:00:00Z');
    assert.equal(written.windows.channel, 'preview');
  });
});

test('an incomplete API result cannot partially update one platform', async () => {
  await withSnapshot(async path => {
    const before = await readFile(path, 'utf8');
    const getJSON = async url => url.endsWith('/tags/stable') ? release('mac') : url.includes('/releases?') ? [] : framework;
    const result = await synchronizeReleases({ snapshotPath: path, getJSON });
    assert.equal(result.stale, true);
    assert.equal(await readFile(path, 'utf8'), before);
    assert.throws(() => validateSnapshot({ ...snapshot(), windows: null }), /Invalid cached windows/);
  });
});

test('an unsuccessful deployment cannot advance the repository checkpoint', async () => {
  await withSnapshot(async path => {
    const before = await readFile(path, 'utf8');
    const next = snapshot(release('mac', { id: 11 }));
    for (const deploymentOutcome of ['failure', 'cancelled', 'skipped', undefined]) {
      await assert.rejects(recordPublishedSnapshot({ snapshotPath: path, snapshot: next, deploymentOutcome }), /without a successful Pages deployment/);
      assert.equal(await readFile(path, 'utf8'), before);
    }
    await assert.rejects(recordPublishedSnapshot({ snapshotPath: path, snapshot: {}, deploymentOutcome: 'success' }), /Unsupported release snapshot/);
    assert.equal(await readFile(path, 'utf8'), before);
  });
});

test('a failed release deployment is retried until its successful snapshot is recorded', async () => {
  await withSnapshot(async publishedPath => {
    const buildPath = join(dirname(publishedPath), 'build-checkout.json');
    const updatedMac = release('mac');
    updatedMac.assets[0].id = 30;
    updatedMac.assets[0].updated_at = '2026-11-11T02:00:00Z';
    updatedMac.assets[0].digest = 'sha256:next-app';
    const getJSON = async url => url.endsWith('/tags/stable') ? updatedMac : url.includes('/releases?') ? [release('windows', { preview: true })] : framework;
    const before = await readFile(publishedPath, 'utf8');

    // Each Actions build checks out the persisted main-branch checkpoint.
    await copyFile(publishedPath, buildPath);
    const failedAttempt = await synchronizeReleases({ snapshotPath: buildPath, getJSON });
    assert.equal(failedAttempt.changed, true);
    assert.equal(await readFile(publishedPath, 'utf8'), before);
    await assert.rejects(recordPublishedSnapshot({ snapshotPath: publishedPath, snapshot: failedAttempt.snapshot, deploymentOutcome: 'failure' }));

    await copyFile(publishedPath, buildPath);
    const retry = await synchronizeReleases({ snapshotPath: buildPath, getJSON });
    assert.equal(retry.changed, true, 'the same pending app update must still trigger the next deployment');
    await recordPublishedSnapshot({ snapshotPath: publishedPath, snapshot: retry.snapshot, deploymentOutcome: 'success' });
    assert.equal(JSON.parse(await readFile(publishedPath, 'utf8')).mac.asset.id, 30);

    await copyFile(publishedPath, buildPath);
    const afterSuccess = await synchronizeReleases({ snapshotPath: buildPath, getJSON });
    assert.equal(afterSuccess.changed, false, 'only the successful deployment clears the pending update');
  });
});
