import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVisitorProfile,
  profileDismissedKey,
  readVisitorProfile,
  removeVisitorProfile,
  shouldShowProfileSetup,
  storeProfileDismissed,
  storeVisitorProfile,
  visitorProfileKey,
} from './visitorProfile.js';

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    items,
  };
}

const blockedStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
  removeItem: () => { throw new Error('blocked'); },
};

// The functions log what failed; keep the test output quiet.
test.beforeEach(() => { test.mock.method(console, 'error', () => {}); });
test.afterEach(() => test.mock.restoreAll());

test('a stored profile is cleaned: unknown values dropped, long text shortened, counts limited', () => {
  const profile = parseVisitorProfile(JSON.stringify({
    name: 'x'.repeat(100),
    ageRange: 'not-a-range',
    trekCount: 9999,
    visitedForts: 'y'.repeat(500),
    interests: ['history', 'history', 'unknown', 'photography'],
    extra: 'ignored',
  }));
  assert.deepEqual(profile, {
    name: 'x'.repeat(60),
    ageRange: '',
    trekCount: 500,
    visitedForts: 'y'.repeat(240),
    interests: ['history', 'photography'],
  });
});

test('missing or non-object profiles read as no profile', () => {
  for (const stored of [null, '', 'null', '[]', '42', '"text"']) assert.equal(parseVisitorProfile(stored), null, stored);
});

test('broken JSON or blocked storage reads as no profile instead of crashing', () => {
  assert.equal(readVisitorProfile(memoryStorage({ [visitorProfileKey]: '{broken' })), null);
  assert.equal(readVisitorProfile(blockedStorage), null);
});

test('the setup dialog shows until a profile is saved or the dialog is dismissed', () => {
  const storage = memoryStorage();
  assert.equal(shouldShowProfileSetup(storage), true);
  assert.equal(storeProfileDismissed(storage), true);
  assert.equal(shouldShowProfileSetup(storage), false);

  const other = memoryStorage();
  assert.equal(storeVisitorProfile({ name: 'A' }, other), true);
  assert.equal(shouldShowProfileSetup(other), false);
  assert.equal(other.items.get(profileDismissedKey), 'true');
});

test('clearing removes the profile but keeps the dialog dismissed', () => {
  const storage = memoryStorage();
  storeVisitorProfile({ name: 'A' }, storage);
  assert.equal(removeVisitorProfile(storage), true);
  assert.equal(readVisitorProfile(storage), null);
  assert.equal(shouldShowProfileSetup(storage), false);
});

test('blocked storage reports failure so the page can show its warning', () => {
  assert.equal(storeVisitorProfile({ name: 'A' }, blockedStorage), false);
  assert.equal(storeProfileDismissed(blockedStorage), false);
  assert.equal(removeVisitorProfile(blockedStorage), false);
  assert.equal(shouldShowProfileSetup(blockedStorage), true);
});
