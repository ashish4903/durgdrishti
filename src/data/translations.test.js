import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from './translations.js';
import { forts } from './forts.js';

test('all supported locales provide the same interface keys', () => {
  const expectedKeys = Object.keys(translations.en).sort();
  for (const [locale, copy] of Object.entries(translations)) {
    assert.deepEqual(Object.keys(copy).sort(), expectedKeys, `${locale} translation keys differ`);
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, 'string', `${locale}.${key} should be text`);
      assert.ok(value.trim(), `${locale}.${key} should not be empty`);
    }
  }
});

test('all trail anatomy labels exist in each locale', () => {
  for (const [locale, copy] of Object.entries(translations)) {
    for (const fort of forts) {
      for (const key of fort.anatomy) assert.ok(copy[key], `${locale}.${key} is missing`);
    }
  }
});
