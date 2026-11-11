import { readFile, writeFile, rename, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { repositories, resolveMacRelease, resolveWindowsRelease, resolveStars, releasesChanged, validateSnapshot } from './releases.mjs';

const defaultSnapshot = new URL('../site-data/releases.json', import.meta.url);

export async function githubJSON(path, { fetchImpl = fetch, token = process.env.GITHUB_TOKEN } = {}) {
  const response = await fetchImpl(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'LightX2V-App-Website',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GitHub ${response.status} for ${path}`);
  return response.json();
}

export async function fetchWindowsReleases(getJSON = githubJSON) {
  const releases = [];
  for (let page = 1; ; page += 1) {
    const batch = await getJSON(`/repos/${repositories.windows}/releases?per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Invalid Windows release list.');
    releases.push(...batch);
    if (batch.length < 100) return releases;
    if (page >= 100) throw new Error('Windows release pagination exceeded its safety limit.');
  }
}

export async function synchronizeReleases({ snapshotPath = defaultSnapshot, getJSON = githubJSON, now = () => new Date().toISOString(), strict = false } = {}) {
  let previous;
  try {
    previous = validateSnapshot(JSON.parse(await readFile(snapshotPath, 'utf8')));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    const [mac, windows, framework] = await Promise.all([
      getJSON(`/repos/${repositories.mac}/releases/tags/stable`),
      fetchWindowsReleases(getJSON),
      getJSON(`/repos/${repositories.stars}`),
    ]);
    const checkedAt = now();
    const next = validateSnapshot({
      schemaVersion: 1,
      syncedAt: checkedAt,
      mac: resolveMacRelease(mac),
      windows: resolveWindowsRelease(windows),
      stars: resolveStars(framework, checkedAt),
    });
    const changed = releasesChanged(previous, next);
    const targetPath = snapshotPath instanceof URL ? fileURLToPath(snapshotPath) : resolve(snapshotPath);
    const tempPath = `${targetPath}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(next, null, 2)}\n`);
    await rename(tempPath, snapshotPath);
    return { changed, stale: false, snapshot: next };
  } catch (error) {
    if (!previous || strict) throw error;
    return { changed: false, stale: true, snapshot: previous, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const pathIndex = args.indexOf('--snapshot');
  const snapshotPath = pathIndex < 0 ? defaultSnapshot : resolve(args[pathIndex + 1]);
  const result = await synchronizeReleases({ snapshotPath, strict: args.includes('--strict') });
  if (result.stale) console.warn(`WARNING: ${result.error}. Keeping the verified release snapshot unchanged.`);
  else console.log(result.changed ? 'Official app download information changed.' : 'Official app downloads are unchanged.');
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\nstale=${result.stale}\nsnapshot=${JSON.stringify(result.snapshot)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Release synchronization failed: ${error.message}`);
    process.exitCode = 1;
  });
}
