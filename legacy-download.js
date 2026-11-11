// Keep existing download bookmarks useful after downloads moved into the homepage.
export function legacyDownloadDestination(currentURL, homeURL) {
  const current = new URL(currentURL);
  const destination = new URL(homeURL, current);
  destination.search = current.search;
  destination.hash = current.hash || '#download';
  return destination.href;
}

if (typeof document !== 'undefined') {
  const home = document.querySelector('[data-legacy-home]');
  location.replace(legacyDownloadDestination(location.href, home.href));
}
