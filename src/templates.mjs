import { content } from './content.mjs';
import { formatStarCount } from '../stars.js';

const externalAttributes = 'target="_blank" rel="noopener noreferrer"';
const escape = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const lines = (value) => escape(value).replaceAll('\n', '<br>');
const translated = (value, locale) => typeof value === 'string' ? value : value?.[locale] ?? value?.en ?? '';
const iconPaths = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  down: '<path d="M12 4v15m-6-6 6 6 6-6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 13a8.8 8.8 0 0 1-9.5-9.5A8.8 8.8 0 1 0 20.5 13Z"/>',
  system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  spark: '<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  github: '<path d="M9 19c-4.3 1.3-4.3-2-6-2m12 5v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.1-1.5 6.1-6.8a5.3 5.3 0 0 0-1.4-3.7A4.9 4.9 0 0 0 18.7 1S17.6.7 15 2.4a12.8 12.8 0 0 0-6 0C6.4.7 5.3 1 5.3 1a4.9 4.9 0 0 0-.1 3.9 5.3 5.3 0 0 0-1.4 3.7c0 5.3 3.1 6.5 6.1 6.8a3.4 3.4 0 0 0-.9 2.7V22"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
};

export function icon(name, className = '') {
  if (name === 'mac') return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 12.7c0-2 1.6-3 1.7-3.1-1-1.5-2.5-1.7-3-1.7-1.3-.1-2.5.8-3.2.8s-1.7-.8-2.8-.8c-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.2-.9-2.2-3.8ZM15.7 6.4c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z"/></svg>`;
  if (name === 'windows') return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 3h9v9H2zm11 0h9v9h-9zM2 14h9v9H2zm11 0h9v9h-9z"/></svg>`;
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function context(locale, releases, media, canonicalRoot) {
  const prefix = locale === 'zh' ? '../' : './';
  const homeRoute = (targetLocale = locale) => `${prefix}${targetLocale === 'zh' ? 'zh/' : ''}`;
  return {
    locale, releases, media,
    c: content[locale],
    prefix,
    asset: (path) => `${prefix}${path}`,
    homeRoute,
    canonical: (targetLocale = locale) => new URL(targetLocale === 'zh' ? 'zh/' : '', canonicalRoot).href,
    docs: {
      mac: 'https://github.com/ModelTC/LightX2V-Mac-App#download',
      windows: 'https://github.com/ModelTC/LightX2V-Windows-App/blob/main/docs/getting-started.md',
      framework: locale === 'zh' ? 'https://lightx2v-zhcn.readthedocs.io/zh-cn/latest/' : 'https://lightx2v-en.readthedocs.io/en/latest/',
    },
  };
}

function brand(ctx, footer = false) {
  return `<a class="brand${footer ? ' footer-brand-link' : ''}" href="#" aria-label="${ctx.c.homeLabel}"><img src="${ctx.asset('assets/mark.svg')}" width="34" height="34" alt=""><span>LightX2V</span></a>`;
}

function themeControls(ctx, location) {
  const { c } = ctx;
  return `<div class="theme-options" role="group" aria-label="${c.theme.label}">${['light', 'system', 'dark'].map((theme) => `<button class="theme-button" type="button" data-theme-choice="${theme}" aria-pressed="${theme === 'light'}" aria-label="${c.theme[theme]}" title="${c.theme[theme]}">${icon(theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'system')}<span${location === 'footer' ? ' class="sr-only"' : ''}>${c.theme[theme]}</span></button>`).join('')}</div>`;
}

function docLinks(ctx) {
  return Object.entries(ctx.docs).map(([key, href]) => `<a href="${href}" ${externalAttributes}>${ctx.c.docs[key]}${icon('arrow')}</a>`).join('');
}

function header(ctx) {
  const { c, releases } = ctx;
  const count = releases.stars?.count;
  const formatted = Number.isInteger(count) ? formatStarCount(count) : null;
  const starsTitle = formatted ? `${c.githubStars}: ${new Intl.NumberFormat('en').format(count)}` : c.githubLabel;
  const mobileName = ctx.locale === 'zh' ? '打开导航' : 'Open navigation';
  const language = `<details class="language-menu"><summary>${c.language.label}${icon('chevron')}</summary><div class="language-menu-list">${['zh', 'en'].map((locale) => `<a class="language-option" href="${ctx.homeRoute(locale)}" data-language-switch data-language-target="${locale}" lang="${locale === 'zh' ? 'zh-CN' : 'en'}" hreflang="${locale === 'zh' ? 'zh-CN' : 'en'}"${ctx.locale === locale ? ' aria-current="page"' : ''}><span>${c.language[locale]}</span>${ctx.locale === locale ? icon('check') : ''}</a>`).join('')}</div></details>`;
  return `<header class="site-header"><div class="nav-shell">
    ${brand(ctx)}
    <nav class="nav-main" aria-label="${ctx.locale === 'zh' ? '主导航' : 'Main navigation'}">
      <a href="#features">${c.nav.features}</a>
      <a href="#showcase">${c.nav.showcase}</a>
      <details class="docs-menu"><summary>${c.nav.docs}${icon('chevron')}</summary><div class="docs-menu-list">${docLinks(ctx)}</div></details>
    </nav>
    <div class="header-actions">
      <a class="github-link" data-github-stars data-stars-label="${escape(c.githubLabel)}" data-stars-title="${escape(c.githubStars)}" href="https://github.com/ModelTC/LightX2V" ${externalAttributes} aria-label="${c.githubLabel}${formatted ? `, ${count} stars` : ''}" title="${escape(starsTitle)}">${icon('github')}<span class="github-text">GitHub</span>${formatted ? `<span class="github-stars">${icon('star')}<span data-github-star-count>${formatted}</span></span>` : ''}</a>
      ${language}
      <details class="theme-menu"><summary class="icon-button" aria-label="${c.theme.label}" title="${c.theme.label}"><span data-current-theme-icon>${icon('sun')}</span></summary>${themeControls(ctx, 'header')}</details>
      <details class="mobile-menu"><summary class="icon-button" aria-label="${mobileName}">${icon('menu')}</summary><nav class="mobile-menu-panel" aria-label="${mobileName}"><a href="#features">${c.nav.features}</a><a href="#showcase">${c.nav.showcase}</a><div class="mobile-doc-links"><span>${c.nav.docs}</span>${docLinks(ctx)}</div></nav></details>
    </div>
  </div></header>`;
}

function downloadControl(ctx) {
  const { c, releases } = ctx;
  return `<div class="hero-actions"><div class="download-control">
    <a class="button button-primary" href="#download" data-primary-download data-mac-url="${escape(releases.mac.url)}" data-windows-url="${escape(releases.windows.url)}" data-label-mac="${c.hero.downloadMac}" data-label-windows="${c.hero.downloadWindows}"><span data-download-icon aria-hidden="true">${icon('down')}</span><span data-download-label>${c.hero.download}</span></a>
    <details class="download-picker"><summary class="button button-picker" aria-label="${c.hero.platforms}" title="${c.hero.platforms}">${icon('chevron')}</summary><div class="download-menu-list">
      <a class="download-option" href="${escape(releases.mac.url)}" data-platform-download="mac">${icon('mac')}<span><strong>${c.hero.downloadMac}</strong><small>Apple Silicon · macOS 14+</small></span>${icon('down')}</a>
      <a class="download-option" href="${escape(releases.windows.url)}" data-platform-download="windows">${icon('windows')}<span><strong>${c.hero.downloadWindows}</strong><small>Windows 11 · x64</small></span>${icon('down')}</a>
    </div></details>
  </div><a class="button button-secondary" href="#create">${c.hero.learnMore}${icon('arrow')}</a></div>`;
}

function pendingMedia(ctx, platform, detail = false) {
  return `<div class="media-pending${detail ? ' media-pending-detail' : ''}">${icon(platform === 'mac' ? 'mac' : 'windows')}<p class="media-pending-title">${ctx.c.preview.pendingTitle(ctx.c.preview[platform])}</p><p class="media-pending-description">${ctx.c.preview.pendingDescription}</p></div>`;
}

function appScreenshot(ctx, platform, detail = false) {
  const screenshot = ctx.media.screenshots?.[platform];
  if (!screenshot?.src) return pendingMedia(ctx, platform, detail);
  const src = detail && screenshot.detailSrc ? screenshot.detailSrc : screenshot.src;
  const alt = translated(screenshot.alt, ctx.locale) || `${ctx.c.preview.actual} — ${ctx.c.preview[platform]}`;
  const width = Number(detail ? screenshot.detailWidth || screenshot.width : screenshot.width) || 1600;
  const height = Number(detail ? screenshot.detailHeight || screenshot.height : screenshot.height) || 1000;
  const crop = detail ? screenshot.detailCrop : null;
  const focusStyle = crop ? ` style="width:${width / crop.width * 100}%;left:${-crop.x / crop.width * 100}%;top:${-crop.y / crop.height * 100}%"` : '';
  const image = `<img class="${detail ? 'feature-image' : 'app-screenshot'}" src="${ctx.asset(src)}" width="${width}" height="${height}" alt="${escape(alt)}" ${detail ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"${focusStyle}>`;
  return crop ? `<div class="feature-image-focus" style="aspect-ratio:${crop.width}/${crop.height}">${image}</div>` : image;
}

function productPreview(ctx) {
  const { c } = ctx;
  return `<div class="product-preview" aria-label="${c.preview.label}">
    <div class="preview-toolbar"><span class="preview-label">${c.preview.label}</span><div class="platform-tabs" role="tablist" aria-label="${c.preview.tabLabel}">${['mac', 'windows'].map((platform) => `<button type="button" class="platform-tab${platform === 'mac' ? ' is-active' : ''}" id="tab-${platform}" role="tab" aria-selected="${platform === 'mac'}" aria-controls="preview-${platform}" tabindex="${platform === 'mac' ? '0' : '-1'}" data-platform-tab="${platform}">${icon(platform)}<span>${c.preview[platform]}</span></button>`).join('')}</div></div>
    ${['mac', 'windows'].map((platform) => `<div class="platform-panel" role="tabpanel" id="preview-${platform}" aria-labelledby="tab-${platform}" data-platform-panel="${platform}"${platform === 'windows' ? ' hidden' : ''}><div class="screenshot-frame">${appScreenshot(ctx, platform)}</div>${ctx.media.screenshots?.[platform]?.src ? `<p class="screenshot-caption">${c.preview.actual} · ${c.preview[platform]}</p>` : ''}</div>`).join('')}
  </div>`;
}

function reviewedFeatureImages(ctx, type) {
  const details = ctx.media.featureDetails?.[type];
  if (!details || details.verified !== true || details.privacyReviewed !== true || details.publicUseApproved !== true) return null;
  const images = details.images;
  if (!Array.isArray(images) || images.length !== 2) return null;
  const valid = images.every((image) => image &&
    typeof image.src === 'string' && /^assets\/[^?#]+\.(?:png|jpe?g|webp|avif)$/i.test(image.src) &&
    !image.src.split('/').includes('..') &&
    Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0 &&
    typeof translated(image.alt, ctx.locale) === 'string' && translated(image.alt, ctx.locale).trim() &&
    ['primary', 'secondary'].includes(image.role));
  if (!valid || new Set(images.map((image) => image.role)).size !== 2) return null;
  return ['primary', 'secondary'].map((role) => images.find((image) => image.role === role));
}

function featureVisual(ctx, type) {
  if (type === 'screenshot') return `<div class="feature-visual feature-visual-screenshot"><div class="feature-image-frame">${appScreenshot(ctx, 'mac', true)}</div></div>`;
  const images = reviewedFeatureImages(ctx, type);
  if (!images) return `<div class="feature-visual feature-visual-${escape(type)} feature-visual-empty" aria-hidden="true"></div>`;
  return `<div class="feature-visual feature-visual-${escape(type)} feature-visual-details"><div class="feature-detail-composition feature-detail-composition-${escape(type)}" data-feature-details="${escape(type)}">${images.map((image) => `<figure class="feature-detail-card feature-detail-card-${image.role}" data-detail-role="${image.role}"><img src="${escape(ctx.asset(image.src))}" width="${image.width}" height="${image.height}" alt="${escape(translated(image.alt, ctx.locale))}" loading="lazy" decoding="async"></figure>`).join('')}</div></div>`;
}

function features(ctx) {
  const { c } = ctx;
  return `<section class="feature-section section-wrap" id="features"><span id="experience" class="anchor-target" aria-hidden="true"></span><div class="section-heading"><h2>${lines(c.features.heading)}</h2></div><div class="feature-rows">${c.features.rows.map((row, index) => `<article class="feature-row${index % 2 ? ' alternate' : ''}"${index === 0 ? ' id="create"' : ''}><div class="feature-copy"><span class="feature-index">${row.number}</span><p class="feature-label">${row.label}</p><h3>${lines(row.title)}</h3><p class="feature-description">${row.description}</p>${row.note ? `<p class="feature-note">${row.note}</p>` : ''}<div class="feature-tags">${row.tags.map((tag) => `<span>${tag}</span>`).join('')}</div></div>${featureVisual(ctx, row.visual)}</article>`).join('')}</div></section>`;
}

function gallery(ctx) {
  const { c } = ctx;
  const images = (ctx.media.gallery ?? []).filter((item) => item.src);
  return `<section class="showcase section-wrap" id="showcase"><div class="section-heading"><p class="eyebrow">${c.showcase.eyebrow}</p><h2>${lines(c.showcase.title)}</h2><p>${c.showcase.description}</p></div>${images.length ? `<div class="gallery-grid${images.length === 2 ? ' gallery-grid-pair' : ''}">${images.map((item, index) => {
    const title = translated(item.title, ctx.locale);
    const description = translated(item.description, ctx.locale);
    const id = item.id || `creation-${index + 1}`;
    return `<figure class="gallery-item"><a class="gallery-open" href="${ctx.asset(item.src)}" data-gallery-open="${escape(id)}" data-gallery-src="${ctx.asset(item.src)}" data-gallery-title="${escape(title)}" data-gallery-description="${escape(description)}" aria-label="${escape(`${c.showcase.open}: ${title}`)}"><img src="${ctx.asset(item.thumbnail || item.src)}" width="${Number(item.width) || 1024}" height="${Number(item.height) || 1024}" alt="${escape(description || title)}" loading="lazy" decoding="async"><span class="gallery-expand" aria-hidden="true">${icon('plus')}</span></a><figcaption><h3>${escape(title)}</h3><p>${escape(description)}</p></figcaption></figure>`;
  }).join('')}</div>` : `<div class="gallery-pending">${icon('image')}<h3>${c.showcase.pendingTitle}</h3><p>${c.showcase.pendingDescription}</p></div>`}</section>`;
}

function downloadCard(ctx, platform) {
  const { c, releases } = ctx;
  const release = releases[platform];
  const badge = release.channel === 'preview' ? c.download.badgePreview : c.download.badgeStable;
  const title = c.download[`${platform}Title`];
  const label = c.download[`${platform}Button`];
  const version = platform === 'mac' && release.version === 'stable' ? '' : release.version;
  return `<article class="download-card" id="${platform}-card" data-download-card="${platform}"><div class="download-card-top">${icon(platform, 'platform-icon')}<span class="release-badge${release.channel === 'preview' ? ' is-preview' : ''}">${escape(badge)}</span><span class="detected-platform" data-platform-recommendation="${platform}" hidden>${c.download.detected}</span></div><h3>${title}</h3><p class="card-description">${c.download[`${platform}Description`]}</p><a class="button button-primary platform-download" href="${escape(release.url)}" data-platform-download="${platform}">${icon('down')}<span>${label}</span></a><p class="system-requirement">${c.download[`${platform}Requirement`]}</p><p class="release-detail">${version ? `${escape(version)} · ` : ''}${c.download.format}</p></article>`;
}

function downloads(ctx) {
  const { c } = ctx;
  return `<section class="download-section section-wrap" id="download" aria-labelledby="download-title"><div class="download-heading section-heading"><p class="eyebrow">LightX2V</p><h2 id="download-title">${c.download.title}</h2><p>${c.download.description}</p></div><div class="download-grid">${downloadCard(ctx, 'mac')}${downloadCard(ctx, 'windows')}</div><div class="setup-intro">${icon('system')}<div><h3>${c.download.preparationTitle}</h3><p>${c.download.preparationDescription}</p></div></div><div class="setup-grid"><article class="setup-card"><span>01</span><h4>${c.download.macSetup}</h4><p>${c.download.macSetupDescription}</p></article><article class="setup-card"><span>02</span><h4>${c.download.windowsSetup}</h4><p>${c.download.windowsSetupDescription}</p></article></div></section><section class="faq section-wrap" id="faq"><div class="faq-intro"><p class="eyebrow">${c.download.faqEyebrow}</p><h2>${c.download.faqTitle}</h2><p>${c.download.faqDescription}</p></div><div class="faq-list">${c.download.faqs.map((faq) => `<details class="faq-item"><summary><span>${faq.question}</span>${icon('plus')}</summary><div class="faq-answer"><p>${faq.answer}</p>${faq.link ? `<a href="${faq.link}" ${externalAttributes}>${faq.linkLabel}${icon('arrow')}</a>` : ''}</div></details>`).join('')}</div></section>`;
}

function footer(ctx) {
  const { c } = ctx;
  return `<footer class="site-footer"><div class="section-wrap"><div class="footer-grid"><div class="footer-brand">${brand(ctx, true)}<p>${c.footer.description}</p></div><div class="footer-column"><h2>${c.footer.product}</h2><nav aria-label="${c.footer.product}"><a href="#features">${c.nav.features}</a><a href="#showcase">${c.nav.showcase}</a><a href="#download">${c.nav.download}</a></nav></div><div class="footer-column"><h2>${c.footer.resources}</h2><nav aria-label="${c.footer.resources}">${docLinks(ctx)}<a href="#faq">FAQ</a></nav></div><div class="footer-column"><h2>${c.footer.community}</h2><nav aria-label="${c.footer.community}"><a href="https://github.com/ModelTC/LightX2V" ${externalAttributes}>${c.footer.mainProject}</a><a href="https://github.com/ModelTC" ${externalAttributes}>${c.footer.modeltc}</a></nav></div></div><div class="footer-bottom"><p>© <span id="year">${new Date().getUTCFullYear()}</span> ${c.footer.copyright}</p>${themeControls(ctx, 'footer')}</div></div></footer>`;
}

function galleryDialog(ctx) {
  return `<dialog class="gallery-dialog" id="gallery-dialog" aria-labelledby="gallery-dialog-title"><div class="gallery-dialog-inner"><button class="gallery-close icon-button" type="button" data-gallery-close aria-label="${ctx.c.showcase.close}">${icon('close')}</button><img data-gallery-image alt=""><div class="gallery-dialog-caption"><h3 id="gallery-dialog-title" data-gallery-title></h3><p data-gallery-description></p></div></div></dialog>`;
}

export function renderPage({ locale, releases, media, canonicalRoot }) {
  const ctx = context(locale, releases, media, canonicalRoot);
  const { c } = ctx;
  const title = c.title;
  const body = `<section class="hero"><div class="hero-content section-wrap"><p class="eyebrow">${c.hero.eyebrow}</p><h1 class="brand-title">LightX2V</h1><h2 class="hero-tagline"><span>${c.hero.line1}</span> <span>${c.hero.line2}</span></h2><p class="hero-description">${c.hero.description}</p><ul class="hero-highlights">${c.hero.highlights.map((highlight) => `<li>${escape(highlight)}</li>`).join('')}</ul>${downloadControl(ctx)}</div><div class="hero-media-wrap section-wrap">${productPreview(ctx)}</div></section>${features(ctx)}${gallery(ctx)}${downloads(ctx)}`;
  return `<!doctype html>
<html lang="${c.lang}" class="no-js" data-page="home" data-locale="${locale}" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fafaf8">
  <meta name="description" content="${escape(c.description)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(c.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ctx.canonical()}">
  <title>${escape(title)}</title>
  <link rel="canonical" href="${ctx.canonical()}">
  <link rel="alternate" hreflang="en" href="${ctx.canonical('en')}">
  <link rel="alternate" hreflang="zh-CN" href="${ctx.canonical('zh')}">
  <link rel="alternate" hreflang="x-default" href="${ctx.canonical('en')}">
  <link rel="icon" type="image/svg+xml" sizes="any" href="${ctx.asset('assets/favicon-monochrome-v2.svg')}">
  <script src="${ctx.asset('theme-init.js')}"></script>
  <link rel="stylesheet" href="${ctx.asset('styles.css')}">
  <script type="module" src="${ctx.asset('app.js')}"></script>
</head>
<body data-page="home" data-locale="${locale}">
  <a class="skip-link" href="#main">${c.skip}</a>
  ${header(ctx)}
  <main id="main">${body}</main>
  ${footer(ctx)}
  ${galleryDialog(ctx)}
</body>
</html>
`;
}


export function renderLegacyDownloadPage({ locale, canonicalRoot }) {
  const c = content[locale];
  const prefix = locale === 'zh' ? '../../' : '../';
  const home = locale === 'zh' ? `${prefix}zh/` : `${prefix}index.html`;
  const canonical = (targetLocale) => new URL(targetLocale === 'zh' ? 'zh/' : '', canonicalRoot).href;
  return `<!doctype html>
<html lang="${c.lang}" class="no-js" data-page="redirect" data-locale="${locale}" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fafaf8">
  <meta name="robots" content="noindex, follow">
  <title>${escape(c.download.title)}</title>
  <link rel="canonical" href="${canonical(locale)}">
  <link rel="alternate" hreflang="en" href="${canonical('en')}">
  <link rel="alternate" hreflang="zh-CN" href="${canonical('zh')}">
  <link rel="alternate" hreflang="x-default" href="${canonical('en')}">
  <link rel="icon" type="image/svg+xml" sizes="any" href="${prefix}assets/favicon-monochrome-v2.svg">
  <script src="${prefix}theme-init.js"></script>
  <link rel="stylesheet" href="${prefix}styles.css">
  <script type="module" src="${prefix}legacy-download.js"></script>
  <noscript><meta http-equiv="refresh" content="0;url=${home}#download"></noscript>
</head>
<body class="legacy-redirect" data-page="redirect" data-locale="${locale}">
  <a class="button button-primary" data-legacy-home href="${home}#download">${c.download.legacyReturn}</a>
</body>
</html>
`;
}
