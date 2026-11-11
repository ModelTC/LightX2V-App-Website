import { writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSnapshot } from './releases.mjs';

const defaultSnapshot = new URL('../site-data/releases.json', import.meta.url);

// The repository snapshot is the last successful deployment checkpoint, not
// merely the most recent API response. Failed uploads/deployments must leave it
// untouched so the next scheduled build can retry the same app release.
export async function recordPublishedSnapshot({ snapshotPath = defaultSnapshot, snapshot, deploymentOutcome } = {}) {
  if (deploymentOutcome !== 'success') throw new Error('Refusing to advance the download checkpoint without a successful Pages deployment.');
  validateSnapshot(snapshot);
  const target = snapshotPath instanceof URL ? fileURLToPath(snapshotPath) : resolve(snapshotPath);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(temporary, target);
}

async function main() {
  if (!process.env.RELEASE_SNAPSHOT) throw new Error('Missing the successfully deployed release snapshot.');
  await recordPublishedSnapshot({
    snapshot: JSON.parse(process.env.RELEASE_SNAPSHOT),
    deploymentOutcome: process.env.DEPLOYMENT_OUTCOME,
  });
  console.log('Recorded the release snapshot from the successful Pages deployment.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Publication checkpoint was not advanced: ${error.message}`);
    process.exitCode = 1;
  });
}
