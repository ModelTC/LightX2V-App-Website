import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { galleryCategories, validatePublicationMedia } from '../scripts/media-readiness.mjs';

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

// Small valid grayscale PNG fixtures; dimensions are encoded in the image,
// independently of the media manifest passed to the publication validator.
function png(width, height, shade = 0) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  const pixels = Buffer.alloc((width + 1) * height, shade);
  for (let y = 0; y < height; y += 1) pixels[y * (width + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}

async function withMedia(callback) {
  const root = await mkdtemp(join(tmpdir(), 'lightx2v-media-test-'));
  await mkdir(join(root, 'assets'));
  const screenshots = {};
  for (const platform of ['mac', 'windows']) {
    const src = `assets/${platform}.png`;
    await writeFile(join(root, src), png(1600, 900));
    screenshots[platform] = { src, width: 1600, height: 900, version: 'verified-app', sourceReleaseDigest: `sha256:${'a'.repeat(64)}`, verified: true, privacyReviewed: true, publicUseApproved: true };
  }
  const gallery = [];
  for (const [index, category] of galleryCategories.entries()) {
    const src = `assets/${category}.png`;
    await writeFile(join(root, src), png(32, 32, index + 1));
    gallery.push({ id: category, category, src, provenance: { platform: 'mac', model: 'Qwen-Image', prompt: 'Public demonstration', verified: true, publicUseApproved: true } });
  }
  const media = { schemaVersion: 1, screenshots, gallery };
  try { await callback({ root, media }); } finally { await rm(root, { recursive: true, force: true }); }
}

test('complete approved media passes and detail crops remain optional', async () => {
  await withMedia(async ({ root, media }) => {
    assert.deepEqual(await validatePublicationMedia({ root, media }), { screenshots: 2, gallery: 6 });
    media.screenshots.mac.detailSrc = media.screenshots.mac.src;
    await validatePublicationMedia({ root, media });
  });
});

test('a manifest cannot claim 1600px for a smaller PNG or misstate its dimensions', async () => {
  await withMedia(async ({ root, media }) => {
    await writeFile(join(root, media.screenshots.mac.src), png(512, 512));
    await assert.rejects(validatePublicationMedia({ root, media }), /actual PNG screenshot must be at least 1600px/);
    await writeFile(join(root, media.screenshots.mac.src), png(1600, 1000));
    await assert.rejects(validatePublicationMedia({ root, media }), /dimensions do not match its actual PNG/);
  });
});

test('renamed non-PNG files and missing optional detail assets are rejected', async () => {
  await withMedia(async ({ root, media }) => {
    await writeFile(join(root, media.screenshots.mac.src), 'This is not an image.');
    await assert.rejects(validatePublicationMedia({ root, media }), /valid IHDR/);
    await writeFile(join(root, media.screenshots.mac.src), png(1600, 900));
    media.screenshots.mac.detailSrc = 'assets/missing-detail.png';
    await assert.rejects(validatePublicationMedia({ root, media }), /ENOENT/);
  });
});

test('screenshots require human privacy/publication approval and source release identity', async () => {
  await withMedia(async ({ root, media }) => {
    for (const field of ['privacyReviewed', 'publicUseApproved']) {
      media.screenshots.mac[field] = false;
      await assert.rejects(validatePublicationMedia({ root, media }), /manual privacy review and public-use approval/);
      media.screenshots.mac[field] = true;
    }
    media.screenshots.mac.sourceReleaseDigest = '';
    await assert.rejects(validatePublicationMedia({ root, media }), /source release SHA-256 digest/);
  });
});

test('gallery IDs, source paths and the six required categories must be unique', async () => {
  await withMedia(async ({ root, media }) => {
    const original = structuredClone(media.gallery[1]);
    media.gallery[1].id = media.gallery[0].id;
    await assert.rejects(validatePublicationMedia({ root, media }), /gallery IDs must be present and unique/);
    media.gallery[1] = structuredClone(original);
    media.gallery[1].category = media.gallery[0].category;
    await assert.rejects(validatePublicationMedia({ root, media }), /exactly once/);
    media.gallery[1] = structuredClone(original);
    media.gallery[1].src = media.gallery[0].src;
    await assert.rejects(validatePublicationMedia({ root, media }), /source paths must be unique/);
  });
});

test('copying the same image under different filenames cannot fill the gallery', async () => {
  await withMedia(async ({ root, media }) => {
    const duplicatedBytes = await readFile(join(root, media.gallery[0].src));
    await writeFile(join(root, media.gallery[1].src), duplicatedBytes);
    await assert.rejects(validatePublicationMedia({ root, media }), /source images must have distinct content/);
  });
});

test('gallery public-use approval and complete real-app provenance are required', async () => {
  await withMedia(async ({ root, media }) => {
    media.gallery[0].provenance.publicUseApproved = false;
    await assert.rejects(validatePublicationMedia({ root, media }), /provenance and public-use approval are incomplete/);
    media.gallery[0].provenance.publicUseApproved = true;
    media.gallery[0].provenance.platform = 'fixture';
    await assert.rejects(validatePublicationMedia({ root, media }), /provenance and public-use approval are incomplete/);
  });
});

test('owner approval accepts the exact three-image collection with honest release limitations', async () => {
  await withMedia(async ({ root, media }) => {
    media.gallery = media.gallery.slice(0, 3);
    media.screenshots.windows.verified = false;
    media.screenshots.windows.version = null;
    delete media.screenshots.mac.sourceReleaseDigest;
    media.gallery[2].provenance.verified = false;
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    const assets = {};
    for (const item of [...Object.values(media.screenshots), ...media.gallery]) {
      assets[item.src] = hash(await readFile(join(root, item.src)));
    }
    const approval = { schemaVersion: 1, approved: true, mediaSha256: hash(JSON.stringify(media)), assets };
    assert.deepEqual(await validatePublicationMedia({ root, media, approval }), { screenshots: 2, gallery: 3 });
    media.gallery[0].provenance.prompt = 'Changed after review';
    await assert.rejects(validatePublicationMedia({ root, media, approval }), /media changed since/);
    media.gallery[0].provenance.prompt = 'Public demonstration';
    await writeFile(join(root, media.gallery[0].src), png(32, 32, 99));
    await assert.rejects(validatePublicationMedia({ root, media, approval }), /changed since publication approval/);
  });
});
