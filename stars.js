const repository = 'ModelTC/LightX2V';
const apiURL = `https://api.github.com/repos/${repository}`;
const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});
const fullNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const refreshInterval = 60_000;
let lastAttemptAt = 0;
let inFlight;
let initialized = false;

export function formatStarCount(count) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('GitHub star count must be a non-negative safe integer.');
  return compactNumber.format(count).toLowerCase();
}

export function refreshGitHubStars() {
  if (inFlight) return inFlight;
  const links = [...document.querySelectorAll('[data-github-stars]')];
  if (!links.length) return Promise.resolve(null);
  lastAttemptAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  inFlight = (async () => {
    try {
      const response = await fetch(apiURL, {
        headers: { Accept: 'application/vnd.github+json' },
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const result = await response.json();
      if (result.full_name !== repository || !Number.isSafeInteger(result.stargazers_count) || result.stargazers_count < 0) return null;
      const count = result.stargazers_count;
      const compact = formatStarCount(count);
      const full = fullNumber.format(count);
      for (const link of links) {
        for (const label of link.querySelectorAll('[data-github-star-count]')) label.textContent = compact;
        const starsTitle = `${link.dataset.starsTitle || 'GitHub stars for the LightX2V framework'}: ${full}`;
        link.title = starsTitle;
        link.setAttribute('aria-label', `${link.dataset.starsLabel || 'LightX2V on GitHub'}; ${starsTitle}`);
      }
      return count;
    } catch {
      // Keep the built snapshot or the last successful value already in the DOM.
      return null;
    } finally {
      clearTimeout(timeout);
    }
  })().finally(() => { inFlight = undefined; });
  return inFlight;
}

export function initGitHubStars() {
  if (initialized) return;
  initialized = true;
  void refreshGitHubStars();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastAttemptAt >= refreshInterval) void refreshGitHubStars();
  });
}
