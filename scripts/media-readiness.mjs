import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';

export const galleryCategories = Object.freeze(['photography', 'architecture', 'product', 'illustration', 'poster', 'concept']);
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngDimensions(bytes, description) {
  assert(bytes.length >= 33 && bytes.subarray(0, 8).equals(pngSignature) &&
    bytes.readUInt32BE(8) === 13 && bytes.toString('ascii', 12, 16) === 'IHDR',
  `${description}: expected an original PNG with a valid IHDR.`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert(width > 0 && height > 0, `${description}: PNG has invalid dimensions.`);
  return { width, height };
}

export async function validatePublicationMedia({ root, media, approval }) {
  assert(media?.schemaVersion === 1, 'Publication blocked: invalid media manifest.');
  // Approval binds this reviewed collection, including honestly recorded source limitations.
  // It cannot authorize a later replacement image or silently changed provenance.
  if (approval) {
    assert(approval.schemaVersion === 1 && approval.approved === true, 'Publication blocked: invalid publication approval.');
    assert.equal(createHash('sha256').update(JSON.stringify(media)).digest('hex'), approval.mediaSha256,
      'Publication blocked: media changed since publication approval.');
  }
  const assetsRoot = await realpath(resolve(root, 'assets'));
  async function publicImage(src, description) {
    assert(typeof src === 'string' && src.startsWith('assets/'), `${description}: missing public image asset.`);
    assert(!/(?:^|\/)(?:fixtures?|placeholders?|mock|test-patterns?)(?:[\/._-]|$)/i.test(src), `${description}: fixture or placeholder cannot be published as real app media.`);
    assert(/\.(?:png|jpe?g|webp|avif)$/i.test(src), `${description}: expected a raster screenshot or real image.`);
    const file = await realpath(resolve(root, src));
    assert(file.startsWith(`${assetsRoot}${sep}`), `${description}: asset escapes public assets.`);
    const bytes = await readFile(file);
    if (approval) assert.equal(createHash('sha256').update(bytes).digest('hex'), approval.assets?.[src],
      `Publication blocked: ${src} changed since publication approval.`);
    return { file, bytes };
  }

  if (approval) for (const src of Object.keys(approval.assets ?? {})) await publicImage(src, src);

  for (const platform of ['mac', 'windows']) {
    const shot = media.screenshots?.[platform];
    assert(shot && (approval || shot.verified === true), `Publication blocked: ${platform} screenshot is not verified.`);
    assert(shot.privacyReviewed === true && shot.publicUseApproved === true,
      `Publication blocked: ${platform} screenshot needs manual privacy review and public-use approval.`);
    assert(approval || (typeof shot.version === 'string' && shot.version.trim() && /^sha256:[a-f0-9]{64}$/i.test(shot.sourceReleaseDigest ?? '')),
      `Publication blocked: ${platform} screenshot needs its app version and source release SHA-256 digest.`);
    assert(/\.png$/i.test(shot.src ?? ''), `Publication blocked: ${platform} original screenshot must be PNG.`);
    const { bytes } = await publicImage(shot.src, `${platform} screenshot`);
    const dimensions = pngDimensions(bytes, `${platform} screenshot`);
    assert(dimensions.width >= 1600, `Publication blocked: ${platform} actual PNG screenshot must be at least 1600px wide.`);
    assert(shot.width === dimensions.width && shot.height === dimensions.height,
      `Publication blocked: ${platform} screenshot dimensions do not match its actual PNG.`);
    if (shot.detailSrc) await publicImage(shot.detailSrc, `${platform} screenshot detail`);
  }

  assert(approval ? media.gallery?.length > 0 : media.gallery?.length === galleryCategories.length, 'Publication blocked: six genuine app-generated gallery images are required.');
  const ids = new Set();
  const categories = new Set();
  const sources = new Set();
  const digests = new Set();
  for (const image of media.gallery) {
    assert(typeof image.id === 'string' && image.id.trim() && !ids.has(image.id), 'Publication blocked: gallery IDs must be present and unique.');
    ids.add(image.id);
    assert(galleryCategories.includes(image.category) && (approval || !categories.has(image.category)),
      'Publication blocked: gallery must include photography, architecture, product, illustration, poster and concept exactly once.');
    categories.add(image.category);
    assert((approval || image.provenance?.verified === true) && image.provenance?.publicUseApproved === true &&
      ['mac', 'windows'].includes(image.provenance.platform) && image.provenance.model && image.provenance.prompt,
    `Publication blocked: gallery provenance and public-use approval are incomplete for ${image.id}.`);
    const { file, bytes } = await publicImage(image.src, `gallery ${image.id}`);
    assert(!sources.has(file), 'Publication blocked: gallery source paths must be unique.');
    sources.add(file);
    const digest = createHash('sha256').update(bytes).digest('hex');
    assert(!digests.has(digest), 'Publication blocked: gallery source images must have distinct content.');
    digests.add(digest);
    if (image.thumbnail) await publicImage(image.thumbnail, `gallery thumbnail ${image.id}`);
  }
  return { screenshots: 2, gallery: media.gallery.length };
}
