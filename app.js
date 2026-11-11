import { initGitHubStars } from './stars.js';

initGitHubStars();

const root = document.documentElement;
const preferenceKey = 'lightx2v-theme';
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
function applyTheme(preference, persist = false) {
  if (!['light', 'dark', 'system'].includes(preference)) preference = 'light';
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
  for (const button of themeButtons) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === preference));
  const selected = themeButtons.find(button => button.dataset.themeChoice === preference);
  if (selected) {
    for (const icon of document.querySelectorAll('[data-current-theme-icon]')) icon.replaceChildren(selected.querySelector('svg').cloneNode(true));
  }
  document.querySelector('meta[name="theme-color"]').content = root.dataset.theme === 'dark' ? '#111214' : '#fafaf8';
  if (persist) { try { localStorage.setItem(preferenceKey, preference); } catch {} }
}
applyTheme(root.dataset.themePreference || 'light');
for (const button of themeButtons) button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
systemTheme.addEventListener('change', () => {
  if (root.dataset.themePreference === 'system') applyTheme('system');
});
window.addEventListener('storage', event => {
  if (event.key === preferenceKey) applyTheme(event.newValue || 'light');
});
for (const link of document.querySelectorAll('[data-language-switch]')) {
  link.addEventListener('click', () => {
    link.hash = location.hash && document.getElementById(location.hash.slice(1)) ? location.hash : '';
    try { localStorage.setItem('lightx2v-language', link.dataset.languageTarget); } catch {}
  });
}

// Platform detection suggests a package; hardware requirements remain explicit in the download section.
const browserPlatform = navigator.userAgentData?.platform || navigator.platform || '';
const isMobile = navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (/Mac/i.test(browserPlatform) && navigator.maxTouchPoints > 1);
const detectedPlatform = isMobile ? null : /Mac/i.test(browserPlatform) ? 'mac' : /Win/i.test(browserPlatform) ? 'windows' : null;
for (const link of document.querySelectorAll('[data-primary-download]')) {
  if (!detectedPlatform) continue;
  link.href = detectedPlatform === 'mac' ? link.dataset.macUrl : link.dataset.windowsUrl;
  link.querySelector('[data-download-label]').textContent = detectedPlatform === 'mac' ? link.dataset.labelMac : link.dataset.labelWindows;
  const iconSource = document.querySelector(`.download-option[data-platform-download="${detectedPlatform}"] svg`);
  if (iconSource) link.querySelector('[data-download-icon]').replaceChildren(iconSource.cloneNode(true));
}
for (const card of document.querySelectorAll('[data-download-card]')) {
  const recommended = card.dataset.downloadCard === detectedPlatform;
  card.classList.toggle('is-recommended', recommended);
}

const tabs = [...document.querySelectorAll('[data-platform-tab]')];
function selectPlatform(platform, focus = false) {
  for (const tab of tabs) {
    const active = tab.dataset.platformTab === platform;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle('is-active', active);
    if (active && focus) tab.focus();
  }
  for (const panel of document.querySelectorAll('[data-platform-panel]')) panel.hidden = panel.dataset.platformPanel !== platform;
}
if (tabs.length) selectPlatform(detectedPlatform || 'mac');
for (const tab of tabs) {
  tab.addEventListener('click', () => selectPlatform(tab.dataset.platformTab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1)
      : tabs[(tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    selectPlatform(next.dataset.platformTab, true);
  });
}

// Native details provide a keyboard-friendly baseline even without JavaScript.
const menus = [...document.querySelectorAll('.docs-menu,.language-menu,.theme-menu,.mobile-menu,.download-picker')];
for (const menu of menus) menu.addEventListener('toggle', () => {
  if (menu.open) for (const other of menus) if (other !== menu) other.open = false;
});
document.addEventListener('click', event => {
  for (const menu of menus) if (!menu.contains(event.target)) menu.open = false;
  if (event.target.closest('a')) for (const menu of menus) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openMenu = menus.find(menu => menu.open);
  if (openMenu) { openMenu.open = false; openMenu.querySelector('summary').focus(); }
});

const dialog = document.querySelector('#gallery-dialog');
let galleryOpener;
if (dialog && typeof dialog.showModal === 'function') {
  for (const link of document.querySelectorAll('[data-gallery-open]')) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      galleryOpener = link;
      const image = dialog.querySelector('[data-gallery-image]');
      image.src = link.dataset.gallerySrc;
      image.alt = link.dataset.galleryDescription || link.dataset.galleryTitle;
      dialog.querySelector('[data-gallery-title]').textContent = link.dataset.galleryTitle;
      dialog.querySelector('[data-gallery-description]').textContent = link.dataset.galleryDescription;
      dialog.showModal();
      document.body.classList.add('modal-open');
    });
  }
  dialog.querySelector('[data-gallery-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    galleryOpener?.focus();
  });
}
