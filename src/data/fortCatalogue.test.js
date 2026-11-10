import test from 'node:test';
import assert from 'node:assert/strict';
import { fortCatalogue, fortMapFeatures, mappedTrailLocations } from './fortCatalogue.js';
import { forts } from './forts.js';
import { calculateLocationForecast } from './forecast.js';
import { classifyLandmark } from './classifier.js';
import { translations } from './translations.js';

test('statewide catalogue includes more than 400 entries and all forecast trails', () => {
  assert.ok(fortCatalogue.length >= 400);
  assert.ok(fortCatalogue.filter((entry) => entry.coordinates).length >= 30);
  assert.ok(fortMapFeatures.length >= 300);
  assert.ok(fortMapFeatures.every((feature) => feature.url.startsWith('https://www.openstreetmap.org/')));
  for (const feature of fortMapFeatures) {
    assert.ok(feature.lat >= 15.5 && feature.lat <= 22.2, `${feature.name} latitude is outside Maharashtra`);
    assert.ok(feature.lon >= 72.5 && feature.lon <= 81.2, `${feature.name} longitude is outside Maharashtra`);
  }
  assert.ok(fortCatalogue.filter((entry) => entry.source === 'trekshitiz').length >= 250);
  assert.ok(fortCatalogue.filter((entry) => entry.source === 'trekshitiz').every((entry) => entry.district));
  for (const fort of forts) {
    assert.ok(fortCatalogue.some((entry) => entry.forecastId === fort.id), `${fort.name} is missing from the atlas`);
  }
});

test('fort explorer connects every mapped pin to a benchmark or explicit proxy forecast', () => {
  assert.equal(mappedTrailLocations.length, 347);
  assert.equal(new Set(mappedTrailLocations.map((location) => location.id)).size, 347);
  assert.equal(mappedTrailLocations.filter((location) => location.source === 'openstreetmap').length, 323);
  assert.equal(new Set(mappedTrailLocations.filter((location) => location.forecastId).map((location) => location.forecastId)).size, 7);
  assert.ok(mappedTrailLocations.every((location) => (
    location.name && location.coordinates?.length === 2
  )));
  assert.equal(mappedTrailLocations.filter((location) => location.forecastId).length, 12);
  for (const location of mappedTrailLocations) {
    const forecast = calculateLocationForecast(location, 'alpine', false);
    assert.ok(forecast, `${location.name} should have a planning forecast`);
    if (location.forecastId) {
      assert.ok(forts.some((fort) => fort.id === location.forecastId), `${location.name} references an unknown forecast`);
      assert.equal(forecast.isProxy, false);
    } else {
      assert.equal(forecast.isProxy, true);
      assert.ok(forecast.proxyDistanceKm > 0);
    }
  }
});

test('hero uses the approved trail-safety message', () => {
  assert.equal(translations.en.title, 'Ditch the trail jams. Trek responsibly.');
  assert.equal(
    translations.en.subtitle,
    'Forecast bottleneck queues across Maharashtra’s historic forts, discover crowd-free alternate trails, and identify unfortified peaks instantly using AI photo analysis.',
  );
});

test('catalogue coordinates are valid Maharashtra map points when present', () => {
  for (const place of fortCatalogue) {
    assert.ok(place.id && place.name);
    if (place.coordinates) {
      const [latitude, longitude] = place.coordinates;
      assert.ok(latitude >= 15.5 && latitude <= 22.2, `${place.name} latitude is outside Maharashtra`);
      assert.ok(longitude >= 72.5 && longitude <= 81.2, `${place.name} longitude is outside Maharashtra`);
    }
  }
});

test('statewide indexed fort names are recognized by the field classifier', () => {
  for (const place of fortCatalogue) {
    assert.equal(classifyLandmark(place.name, []).name, place.name, `${place.name} is not in the classifier registry`);
  }
});

test('all locales contain statewide fort atlas interface copy', () => {
  const keys = ['navExplorer', 'navAtlas', 'atlasTitle', 'atlasIntro', 'searchForts', 'findOnMap', 'directorySourceLink', 'unescoListLink', 'coverageCaveat', 'mapCoverageCaveat', 'mapPinLabel', 'atlasCoverageNote', 'mappedOsmFeatures', 'osmDataLink', 'openOsmFeature', 'mappedTrailGroup', 'forecastAvailable', 'noMappedForecast', 'mapSubMapped', 'mappedLandmark', 'mappedLocationDetails', 'mappedLocationDescription', 'mappedFeatureType', 'mappedCoordinates', 'publicIndexLocation', 'mapFeatureKind', 'navigateToLandmark', 'readLandmarkReference', 'wikidataRecord', 'openTrailBriefing', 'fortBriefingTitle', 'departureComparisonTitle', 'departureWindow', 'proxyEstimateDisclaimer', 'regionalProxyEstimateDisclaimer', 'proxyCapacityUnknown', 'proxyRecommendationBody', 'proxyRoadBody', 'proxyWasteBody'];
  for (const [locale, copy] of Object.entries(translations)) {
    for (const key of keys) assert.ok(copy[key], `${locale}.${key} is missing`);
  }
  assert.equal(translations.en.mapPinLabel, 'map pins');
  assert.match(translations.en.mapCoverageCaveat, /not a count of unique forts/);
});
