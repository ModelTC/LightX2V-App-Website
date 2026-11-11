export const repositories = Object.freeze({
  mac: 'ModelTC/LightX2V-Mac-App',
  windows: 'ModelTC/LightX2V-Windows-App',
  stars: 'ModelTC/LightX2V',
});

const macAssetName = 'LightX2V-APP-macOS-arm64.zip';
const windowsAssetName = /^LightX2V-Windows-.+-win-x64\.zip$/;

function officialURL(value, repository, pathPrefix) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
      !url.pathname.startsWith(`/${repository}/${pathPrefix}`)) {
    throw new Error(`Unexpected official URL for ${repository}`);
  }
  return url.href;
}

function downloadableAsset(release, repository, matchesName) {
  return release.assets?.find(asset => {
    if (!matchesName(asset.name) || asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0) return false;
    try {
      officialURL(asset.browser_download_url, repository, 'releases/download/');
      return true;
    } catch {
      return false;
    }
  });
}

function releaseRecord(release, asset, platform) {
  const repository = repositories[platform];
  if (!Number.isSafeInteger(release.id) || !Number.isSafeInteger(asset.id) ||
      !release.tag_name || !Number.isFinite(Date.parse(release.published_at)) ||
      !Number.isFinite(Date.parse(asset.updated_at))) {
    throw new Error(`Incomplete release metadata for ${repository}`);
  }
  return {
    platform,
    repository,
    channel: release.prerelease ? 'preview' : 'stable',
    version: release.tag_name,
    releaseId: release.id,
    releaseUrl: officialURL(release.html_url, repository, 'releases/'),
    publishedAt: release.published_at,
    url: officialURL(asset.browser_download_url, repository, 'releases/download/'),
    fileName: asset.name,
    size: asset.size,
    asset: { id: asset.id, updatedAt: asset.updated_at, digest: asset.digest ?? null },
  };
}

export function resolveMacRelease(release) {
  if (!release || release.draft || release.prerelease || release.tag_name !== 'stable') {
    throw new Error('Mac Stable must be a published, non-preview stable tag.');
  }
  const asset = downloadableAsset(release, repositories.mac, name => name === macAssetName);
  if (!asset) throw new Error('Mac Stable has no uploaded Apple Silicon app ZIP.');
  return releaseRecord(release, asset, 'mac');
}

export function resolveWindowsRelease(releases) {
  if (!Array.isArray(releases)) throw new Error('Windows Releases must be an array.');
  const candidates = releases
    .filter(release => !release.draft && Number.isFinite(Date.parse(release.published_at)))
    .map(release => ({ release, asset: downloadableAsset(release, repositories.windows, name => windowsAssetName.test(name)) }))
    .filter(candidate => candidate.asset)
    .sort((a, b) => Date.parse(b.release.published_at) - Date.parse(a.release.published_at));
  const candidate = candidates.find(({ release }) => !release.prerelease) ?? candidates[0];
  if (!candidate) throw new Error('Windows has no published x64 app ZIP.');
  return releaseRecord(candidate.release, candidate.asset, 'windows');
}

export function resolveStars(repository, checkedAt) {
  if (repository.full_name !== repositories.stars || !Number.isSafeInteger(repository.stargazers_count) || repository.stargazers_count < 0) {
    throw new Error('Invalid LightX2V framework star count.');
  }
  return { repository: repositories.stars, count: repository.stargazers_count, updatedAt: checkedAt };
}

export function validateSnapshot(snapshot) {
  if (snapshot.schemaVersion !== 1) throw new Error('Unsupported release snapshot schema.');
  for (const platform of ['mac', 'windows']) {
    const record = snapshot[platform];
    if (!record || record.platform !== platform || record.repository !== repositories[platform] ||
        !['stable', 'preview'].includes(record.channel) || !record.version ||
        !Number.isSafeInteger(record.asset?.id) || !Number.isFinite(Date.parse(record.asset.updatedAt)) ||
        !Number.isSafeInteger(record.size) || record.size <= 0) {
      throw new Error(`Invalid cached ${platform} release.`);
    }
    officialURL(record.url, repositories[platform], 'releases/download/');
    officialURL(record.releaseUrl, repositories[platform], 'releases/');
    if (platform === 'mac' && (record.channel !== 'stable' || record.version !== 'stable' || record.fileName !== macAssetName)) {
      throw new Error('Cached Mac app must use the Stable channel.');
    }
    if (platform === 'windows' && !windowsAssetName.test(record.fileName)) {
      throw new Error('Cached Windows app must be a Windows x64 ZIP.');
    }
  }
  if (snapshot.stars) resolveStars({ full_name: snapshot.stars.repository, stargazers_count: snapshot.stars.count }, snapshot.stars.updatedAt);
  return snapshot;
}

// Only download changes trigger a scheduled deployment; stars refresh on that build.
export function releasesChanged(previous, next) {
  if (!previous) return true;
  return ['mac', 'windows'].some(platform => JSON.stringify(previous[platform]) !== JSON.stringify(next[platform]));
}
