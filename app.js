// Release information lives here. Keep index.html links as a no-JavaScript fallback.
export const releases = {
  mac: {
    url: 'https://github.com/ModelTC/LightX2V-Mac-App/releases/download/stable/LightX2V-APP-macOS-arm64.zip',
  },
  macLatest: {
    url: 'https://github.com/ModelTC/LightX2V-Mac-App/releases/download/latest/LightX2V-APP-macOS-arm64.zip',
  },
  windows: {
    version: 'v0.3.12',
    url: 'https://github.com/ModelTC/LightX2V-Windows-App/releases/download/v0.3.12/LightX2V-Windows-0.3.12-win-x64.zip',
  },
};

for (const link of document.querySelectorAll('[data-download]')) {
  link.href = releases[link.dataset.download].url;
}
for (const label of document.querySelectorAll('[data-version]')) {
  label.textContent = releases[label.dataset.version].version;
}
document.querySelector('#year').textContent = new Date().getFullYear();

// Emphasize the visitor's platform without hiding the other download.
const platform = navigator.userAgentData?.platform ?? navigator.platform;
const card = /mac/i.test(platform) ? '#mac-card' : /win/i.test(platform) ? '#windows-card' : null;
if (card) {
  document.querySelector(card).classList.add('recommended');
  const badge = document.createElement('span');
  badge.className = 'recommended-label';
  badge.textContent = '适用于你的设备';
  document.querySelector(`${card} .download-card-top`).append(badge);
}
