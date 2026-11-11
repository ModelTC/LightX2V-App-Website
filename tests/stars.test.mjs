import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStarCount } from '../stars.js';

test('small GitHub star counts remain exact, including a genuine zero', () => {
  for (const count of [0, 1, 9, 10, 99, 100, 999]) assert.equal(formatStarCount(count), String(count));
});

test('star counts use one English compact format with lowercase suffixes', () => {
  const cases = [
    [1_000, '1k'],
    [1_050, '1.1k'],
    [1_500, '1.5k'],
    [2_999, '3k'],
    [10_000, '10k'],
    [79_105, '79.1k'],
    [100_000, '100k'],
    [1_000_000, '1m'],
    [1_000_000_000, '1b'],
  ];
  for (const [count, expected] of cases) assert.equal(formatStarCount(count), expected);
});

test('rounding at the million boundary changes the compact suffix correctly', () => {
  assert.equal(formatStarCount(999_949), '999.9k');
  assert.equal(formatStarCount(999_950), '1m');
});

test('missing or invalid counts cannot become a false zero or empty count', () => {
  for (const count of [undefined, null, '', '2999', NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => formatStarCount(count), RangeError);
  }
});
