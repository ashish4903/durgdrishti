import test from 'node:test';
import assert from 'node:assert/strict';
import { forts } from './forts.js';
import { translations } from './translations.js';

function distanceInKilometers([lat1, lon1], [lat2, lon2]) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

test('every fort has a base village destination and a listed alternative within 25 km', () => {
  for (const fort of forts) {
    assert.ok(fort.baseCoordinates?.length === 2, `${fort.name} needs base-village coordinates`);
    const alternative = forts.find((candidate) => candidate.name === fort.alternative);
    assert.ok(alternative, `${fort.name} needs a listed alternative`);
    assert.ok(
      distanceInKilometers(fort.coordinates, alternative.coordinates) <= 25,
      `${alternative.name} is outside ${fort.name}'s 25 km alternative radius`,
    );
  }
});

test('every benchmarked trail has a localized fort profile', () => {
  for (const fort of forts) {
    assert.ok(fort.aboutKey, `${fort.name} needs a fort profile translation key`);
    for (const [locale, copy] of Object.entries(translations)) {
      assert.ok(copy[fort.aboutKey], `${locale} is missing the ${fort.name} profile`);
    }
  }
});

test('photo finder examples are present in every supported locale', () => {
  const keys = ['finderExampleLabel', 'finderExampleFort', 'finderExampleFortVerdict', 'finderExamplePeak', 'finderExamplePeakVerdict', 'finderExampleCaveat'];
  for (const [locale, copy] of Object.entries(translations)) {
    for (const key of keys) assert.ok(copy[key], `${locale}.${key} is missing`);
  }
});
