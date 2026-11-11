(() => {
  const root = document.documentElement;
  root.classList.replace('no-js', 'js');
  let preference = 'light';
  try { preference = localStorage.getItem('lightx2v-theme') || 'light'; } catch {}
  if (!['light', 'dark', 'system'].includes(preference)) preference = 'light';
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  // An explicit localized URL remains shareable. Only the entry homepage restores a chosen language.
  try {
    const base = new URL('.', document.currentScript.src);
    if (root.dataset.page === 'home' && root.dataset.locale === 'en'
        && location.pathname === base.pathname && localStorage.getItem('lightx2v-language') === 'zh') {
      location.replace(new URL(`zh/${location.search}${location.hash}`, base));
    }
  } catch {}
})();
