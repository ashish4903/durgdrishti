import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRoute, fortRoute, parseRoute, placeRoute, sectionPages, tabForRoute } from './route.js';
import { fortCatalogue, mappedTrailLocations } from '../data/fortCatalogue.js';

test('the home page is the address without a hash, "#" and "#/"', () => {
  for (const hash of ['', '#', '#/', '#//', undefined]) assert.deepEqual(parseRoute(hash), { page: 'home' });
  assert.equal(formatRoute({ page: 'home' }), '#/');
});

test('each section page has its own address', () => {
  assert.deepEqual(sectionPages, ['explore', 'insights', 'dashboard', 'photo']);
  for (const page of sectionPages) {
    assert.equal(formatRoute({ page }), `#/${page}`);
    assert.deepEqual(parseRoute(`#/${page}`), { page });
    assert.deepEqual(parseRoute(`#/${page}/`), { page }, 'a trailing slash is allowed');
  }
});

test('a fort address carries the catalogue id', () => {
  assert.equal(formatRoute(fortRoute('directory-aad')), '#/fort/directory-aad');
  assert.deepEqual(parseRoute('#/fort/directory-aad'), { page: 'fort', fortId: 'directory-aad' });
});

test('a place address keeps the map id readable, without its "atlas:" prefix', () => {
  assert.equal(formatRoute(placeRoute('atlas:node/342119741')), '#/place/node/342119741');
  assert.deepEqual(parseRoute('#/place/node/342119741'), { page: 'place', locationId: 'atlas:node/342119741' });
  assert.equal(formatRoute(placeRoute('atlas:rajgad')), '#/place/rajgad');
});

test('every catalogue fort and mapped location survives a round trip through its address', () => {
  for (const place of fortCatalogue) {
    assert.deepEqual(parseRoute(formatRoute(fortRoute(place.id))), fortRoute(place.id), place.id);
  }
  for (const location of mappedTrailLocations) {
    assert.deepEqual(parseRoute(formatRoute(placeRoute(location.id))), placeRoute(location.id), location.id);
  }
});

test('special characters in an id are encoded and decoded', () => {
  const route = fortRoute('a b/c?d#e');
  assert.equal(formatRoute(route), '#/fort/a%20b%2Fc%3Fd%23e');
  assert.deepEqual(parseRoute(formatRoute(route)), route);
});

test('unknown, malformed and old addresses open the home page', () => {
  for (const hash of ['#top', '#/nowhere', '#/explore/extra', '#/fort', '#/fort/', '#/fort/a/b', '#/place', '#/fort/%E0%A4', '#/%']) {
    assert.deepEqual(parseRoute(hash), { page: 'home' }, hash);
  }
});

test('a fort or place page highlights the insights tab', () => {
  assert.equal(tabForRoute(fortRoute('x')), 'insights');
  assert.equal(tabForRoute(placeRoute('atlas:x')), 'insights');
  for (const page of ['home', ...sectionPages]) assert.equal(tabForRoute({ page }), page);
});
