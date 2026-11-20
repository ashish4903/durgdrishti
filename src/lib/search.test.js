import test from 'node:test';
import assert from 'node:assert/strict';
import { districtsByCount, matchesQuery, scoreMatch, searchPlaces, splitOnMatch } from './search.js';
import { fortCatalogue } from '../data/fortCatalogue.js';

const places = [
  { id: 'a', name: 'Rajgad', district: 'Pune' },
  { id: 'b', name: 'Raigad Fort', district: 'Raigad' },
  { id: 'c', name: 'Shivneri', district: 'Pune' },
  { id: 'd', name: 'Old Rajmachi', district: 'Pune' },
  { id: 'e', name: 'शिवनेरी', district: 'पुणे' },
];

test('matching ignores case and extra spaces, and an empty query matches everything', () => {
  assert.equal(matchesQuery(places[0], '  RAJ  '), true);
  assert.equal(matchesQuery(places[2], 'pune'), true, 'district matches');
  assert.equal(matchesQuery(places[2], 'nashik'), false);
  assert.equal(matchesQuery(places[2], ''), true);
});

test('Devanagari queries are compared as typed', () => {
  assert.equal(matchesQuery(places[4], 'शिव'), true);
  assert.equal(matchesQuery(places[4], 'पुणे'), true);
  assert.deepEqual(searchPlaces(places, 'शिवने').map((place) => place.id), ['e']);
});

test('results rank name starts above word starts, name matches and district matches', () => {
  assert.ok(scoreMatch(places[0], 'raj') > scoreMatch(places[3], 'raj'));
  assert.ok(scoreMatch(places[3], 'raj') > scoreMatch(places[1], 'gad fort'));
  assert.ok(scoreMatch(places[1], 'fort') > scoreMatch(places[1], 'raig') - 100);
  assert.deepEqual(searchPlaces(places, 'raj').map((place) => place.id), ['a', 'd']);
  assert.deepEqual(searchPlaces(places, 'raigad').map((place) => place.id), ['b']);
});

test('search returns nothing for an empty query and respects the limit', () => {
  assert.deepEqual(searchPlaces(places, '   '), []);
  assert.equal(searchPlaces(fortCatalogue, 'gad', 5).length, 5);
});

test('every catalogue fort can be found by its full name, first', () => {
  for (const place of fortCatalogue) {
    const results = searchPlaces(fortCatalogue, place.name, 50);
    assert.ok(results.some((result) => result.name === place.name), place.name);
    assert.equal(results[0].name.toLocaleLowerCase(), place.name.toLocaleLowerCase(), place.name);
  }
});

test('highlighting splits around the first match, keeping the original letters', () => {
  assert.deepEqual(splitOnMatch('Rajgad', 'JG'), ['Ra', 'jg', 'ad']);
  assert.deepEqual(splitOnMatch('Rajgad', 'xyz'), ['Rajgad', '', '']);
  assert.deepEqual(splitOnMatch('Rajgad', ''), ['Rajgad', '', '']);
});

test('districts are listed with the most forts first', () => {
  assert.deepEqual(districtsByCount(places), [
    { district: 'Pune', count: 3 },
    { district: 'Raigad', count: 1 },
    { district: 'पुणे', count: 1 },
  ]);
  const all = districtsByCount(fortCatalogue);
  assert.ok(all.length > 10);
  assert.equal(all.reduce((sum, entry) => sum + entry.count, 0), fortCatalogue.filter((place) => place.district).length);
});
