import test from 'node:test';
import assert from 'node:assert/strict';
import { createNumberFormatter, formatMessage } from './format.js';

test('formatMessage fills every placeholder, including repeated ones', () => {
  assert.equal(formatMessage('{a} and {b}, then {a}', { a: 1, b: 'two' }), '1 and two, then 1');
  assert.equal(formatMessage('no placeholders', { a: 1 }), 'no placeholders');
});

test('numbers are rounded and written in the interface language', () => {
  assert.equal(createNumberFormatter('en')(1234.6), '1,235');
  assert.equal(createNumberFormatter('en')(123456), '1,23,456', 'Indian digit grouping');
  assert.equal(createNumberFormatter('mr')(42), '४२');
  assert.equal(createNumberFormatter('hi')(42), '42', 'hi-IN uses Latin digits by default');
  assert.equal(createNumberFormatter('xx')(7), '7', 'an unknown language falls back to English');
});
