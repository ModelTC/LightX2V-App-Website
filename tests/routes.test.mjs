import assert from 'node:assert/strict';
import test from 'node:test';
import { legacyDownloadDestination } from '../legacy-download.js';

const cases = [
  ['https://example.com/download/', '../index.html#download', 'https://example.com/index.html#download'],
  ['https://example.com/download/index.html', '../index.html#download', 'https://example.com/index.html#download'],
  ['https://example.com/LightX2V-App-Website/download/?v=icon2#faq', '../index.html#download', 'https://example.com/LightX2V-App-Website/index.html?v=icon2#faq'],
  ['https://example.com/LightX2V-App-Website/download/index.html?from=old#mac-card', '../index.html#download', 'https://example.com/LightX2V-App-Website/index.html?from=old#mac-card'],
  ['https://example.com/zh/download/', '../../zh/#download', 'https://example.com/zh/#download'],
  ['https://example.com/LightX2V-App-Website/zh/download/?source=release#windows-card', '../../zh/#download', 'https://example.com/LightX2V-App-Website/zh/?source=release#windows-card'],
  ['https://example.com/LightX2V-App-Website/zh/download/index.html?v=2#faq', '../../zh/#download', 'https://example.com/LightX2V-App-Website/zh/?v=2#faq'],
];

for (const [current, home, expected] of cases) {
  test(`legacy bookmark preserves locale, prefix and section: ${current}`, () => {
    assert.equal(legacyDownloadDestination(current, home), expected);
  });
}
