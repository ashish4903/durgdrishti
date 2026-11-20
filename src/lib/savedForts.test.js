import test from 'node:test';
import assert from 'node:assert/strict';
import { isSaved, maxSavedForts, parseSavedForts, readSavedForts, savedFortsKey, toggleSaved, writeSavedForts } from './savedForts.js';
import { effectiveTheme, readThemePreference, themeKey, toggledTheme, writeThemePreference } from './theme.js';

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    items,
  };
}
const blockedStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
};

const rajgad = { address: '#/place/rajgad', name: 'Rajgad' };
const aad = { address: '#/fort/directory-aad', name: 'Aad' };

test('saving adds a fort at the top; saving again removes it', () => {
  let list = toggleSaved([], rajgad);
  list = toggleSaved(list, aad);
  assert.deepEqual(list.map((entry) => entry.name), ['Aad', 'Rajgad']);
  assert.equal(isSaved(list, rajgad.address), true);
  list = toggleSaved(list, rajgad);
  assert.equal(isSaved(list, rajgad.address), false);
  assert.equal(list.length, 1);
});

test('the list keeps at most 50 forts', () => {
  let list = [];
  for (let index = 0; index < maxSavedForts + 5; index += 1) list = toggleSaved(list, { address: `#/fort/f${index}`, name: `F${index}` });
  assert.equal(list.length, maxSavedForts);
  assert.equal(list[0].name, `F${maxSavedForts + 4}`);
});

test('stored lists are cleaned: only fort or place addresses, no duplicates, short names', () => {
  const stored = JSON.stringify([
    rajgad, rajgad, aad,
    { address: 'https://example.com', name: 'Elsewhere' },
    { address: '#/explore', name: 'Not a fort' },
    { address: '#/fort/x', name: 'n'.repeat(200) },
    { address: '#/fort/y' },
    'text', null,
  ]);
  const list = parseSavedForts(stored);
  assert.deepEqual(list.map((entry) => entry.address), ['#/place/rajgad', '#/fort/directory-aad', '#/fort/x']);
  assert.equal(list[2].name.length, 80);
  for (const bad of [null, '', '{}', '"x"', '42']) assert.deepEqual(parseSavedForts(bad), [], bad);
});

test('saved forts survive a round trip through storage, and blocked storage is safe', () => {
  const storage = memoryStorage();
  assert.equal(writeSavedForts([rajgad], storage), true);
  assert.deepEqual(readSavedForts(storage), [rajgad]);
  assert.deepEqual(readSavedForts(memoryStorage({ [savedFortsKey]: '{broken' })), []);
  assert.deepEqual(readSavedForts(blockedStorage), []);
  assert.equal(writeSavedForts([rajgad], blockedStorage), false);
});

test('the theme follows the device until the visitor chooses, and the toggle flips what is shown', () => {
  assert.equal(effectiveTheme(null, false), 'light');
  assert.equal(effectiveTheme(null, true), 'dark');
  assert.equal(effectiveTheme('light', true), 'light');
  assert.equal(toggledTheme('light'), 'dark');
  assert.equal(toggledTheme('dark'), 'light');
});

test('the theme choice is stored only as light or dark, and blocked storage falls back to the device', () => {
  const storage = memoryStorage();
  assert.equal(readThemePreference(storage), null);
  writeThemePreference('dark', storage);
  assert.equal(readThemePreference(storage), 'dark');
  assert.equal(readThemePreference(memoryStorage({ [themeKey]: 'purple' })), null);
  assert.equal(readThemePreference(blockedStorage), null);
  assert.equal(writeThemePreference('dark', blockedStorage), false);
});
