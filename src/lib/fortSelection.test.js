import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cataloguePlaceForLocation,
  defaultSelection,
  mappedLocationForPlace,
  normalizeName,
  resolveInsightLocation,
  routeExists,
  selectionForMappedLocation,
  selectionForPlace,
  selectionForRoute,
} from './fortSelection.js';
import { fortRoute, placeRoute } from './route.js';
import { fortCatalogue, mappedTrailLocations } from '../data/fortCatalogue.js';
import { forts } from '../data/forts.js';

test('names are compared without case, spaces or punctuation', () => {
  assert.equal(normalizeName('Raj-Gad Fort'), normalizeName('rajgad fort'));
});

test('the default selection is Rajgad', () => {
  assert.equal(defaultSelection.fortId, 'rajgad');
  assert.equal(defaultSelection.mappedLocationId, null);
  assert.ok(fortCatalogue.some((place) => place.id === defaultSelection.selectedCatalogueId));
});

test('every catalogue fort opens a page with its own name', () => {
  for (const place of fortCatalogue) {
    const selection = { ...defaultSelection, ...selectionForRoute(fortRoute(place.id)) };
    const location = resolveInsightLocation(selection);
    assert.ok(location, `${place.id} has no page`);
    assert.equal(location.name, place.name, place.id);
  }
});

test('every mapped location opens a page', () => {
  for (const mapped of mappedTrailLocations) {
    const selection = { ...defaultSelection, ...selectionForRoute(placeRoute(mapped.id)) };
    const location = resolveInsightLocation(selection);
    assert.ok(location?.name, `${mapped.id} has no page`);
    assert.equal(selection.mappedLocationId, mapped.id);
  }
});

test('a benchmarked fort selects its forecast', () => {
  const place = fortCatalogue.find((entry) => entry.forecastId);
  if (!place) return;
  assert.deepEqual(selectionForPlace(place), { selectedCatalogueId: place.id, fortId: place.forecastId, mappedLocationId: null });
});

test('a fort without a forecast keeps the previous forecast fort, as before routing', () => {
  const place = fortCatalogue.find((entry) => !entry.forecastId);
  assert.ok(!('fortId' in selectionForPlace(place)));
});

test('the seven benchmarked forts open from their map records with their forecast', () => {
  for (const fort of forts) {
    const mapped = mappedTrailLocations.find((location) => location.id === `atlas:${fort.id}`);
    assert.ok(mapped, `${fort.id} has no map record`);
    assert.equal(selectionForMappedLocation(mapped).fortId, fort.id);
  }
});

test('catalogue places and map records are linked both ways by name', () => {
  for (const place of fortCatalogue) {
    const mapped = mappedLocationForPlace(place);
    if (mapped?.feature) assert.ok(cataloguePlaceForLocation(mapped), `${mapped.id} does not link back`);
  }
});

test('unknown fort and place ids do not exist; other pages always do', () => {
  assert.equal(selectionForRoute(fortRoute('no-such-fort')), null);
  assert.equal(selectionForRoute(placeRoute('atlas:node/0')), null);
  assert.equal(routeExists(fortRoute('no-such-fort')), false);
  assert.equal(routeExists(placeRoute('atlas:node/0')), false);
  assert.equal(routeExists(fortRoute(fortCatalogue[0].id)), true);
  for (const page of ['home', 'explore', 'insights', 'dashboard', 'photo']) assert.equal(routeExists({ page }), true);
});
