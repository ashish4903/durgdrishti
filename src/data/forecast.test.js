import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateForecast, calculateLocationForecast, nearestBenchmark, slotMultipliers } from './forecast.js';
import { forts } from './forts.js';
import { mappedTrailLocations } from './fortCatalogue.js';

const sampleFort = {
  baseVolume: 5_200,
  chokeCapacity: 11,
  parkingCapacity: 420,
  baseJamMinutes: 38,
  wasteCapacity: 520,
};

test('calculates the alpine baseline locally with zero queue delay', () => {
  const result = calculateForecast(sampleFort, 'alpine', false);
  assert.equal(result.activeLoad, (5_200 / 3) * 0.25);
  assert.equal(result.arrivalRate, result.activeLoad / 120);
  assert.equal(result.queueDelay, 0);
  assert.ok(Math.abs(result.baseDelay - 15.2) < 1e-10);
  assert.equal(result.wasteLoad, result.activeLoad * 0.18);
});

test('applies peak and surge multipliers and caps choke delay at 85 minutes', () => {
  const result = calculateForecast(sampleFort, 'peak', true);
  assert.equal(result.activeLoad, (5_200 / 3) * 1.85 * 1.4);
  assert.equal(result.baseDelay, 38 * 1.4);
  assert.equal(result.queueDelay, 85);
  assert.equal(result.parkingPercent, ((result.activeLoad * 0.32) / 420) * 100);
});

test('does not report a waste-capacity deficit below disposal capacity', () => {
  const result = calculateForecast({ ...sampleFort, wasteCapacity: 10_000 }, 'early', false);
  assert.equal(result.wasteDeficit, 0);
});

test('benchmark forecasts preserve existing calculations and identify their source profile', () => {
  const rajgad = forts.find((fort) => fort.id === 'rajgad');
  const expected = calculateForecast(rajgad, 'alpine', false);
  const actual = calculateLocationForecast({
    name: 'Rajgad',
    coordinates: rajgad.coordinates,
    forecastId: 'rajgad',
  }, 'alpine', false);

  assert.deepEqual(
    Object.fromEntries(Object.keys(expected).map((key) => [key, actual[key]])),
    expected,
  );
  assert.equal(actual.profile, rajgad);
  assert.equal(actual.isProxy, false);
});

test('every mapped location has finite estimates for each departure window', () => {
  assert.ok(mappedTrailLocations.length >= 347);
  for (const location of mappedTrailLocations) {
    for (const slot of Object.keys(slotMultipliers)) {
      const forecast = calculateLocationForecast(location, slot, false);
      assert.ok(forecast, `${location.name} should have a forecast`);
      for (const key of ['activeLoad', 'queueDelay', 'parkingPercent', 'baseDelay', 'wasteLoad', 'wasteDeficit']) {
        assert.ok(Number.isFinite(forecast[key]), `${location.name} ${slot} ${key} should be finite`);
      }
      assert.equal(forecast.isProxy, !location.forecastId);
      if (!location.forecastId) assert.ok(forecast.proxyDistanceKm > 0);
    }
  }
});

test('nearest benchmark uses coordinates rather than assigning a fort profile to the location', () => {
  const location = { name: 'Example site', coordinates: [18.2466, 73.6822] };
  const nearest = nearestBenchmark(location);
  const forecast = calculateLocationForecast(location, 'peak', true);
  assert.equal(nearest.fort.id, 'rajgad');
  assert.ok(nearest.distance < 1);
  assert.equal(forecast.profile.id, 'rajgad');
  assert.equal(forecast.isProxy, true);
});

test('locations beyond the 25 km radius use statewide median inputs rather than distant trail values', () => {
  const forecast = calculateLocationForecast({
    name: 'Ankai Fort',
    coordinates: [20.18722222, 74.44763889],
  }, 'early', false);
  assert.equal(forecast.isProxy, true);
  assert.equal(forecast.isRegionalProxy, true);
  assert.equal(forecast.profile.id, 'maharashtra-baseline');
  assert.ok(forecast.proxyDistanceKm > 25);
});
