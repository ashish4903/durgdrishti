import test from 'node:test';
import assert from 'node:assert/strict';
import { bestWindow, busiestWindow, crowdLevel, departureWindows, windowForecasts } from './crowd.js';
import { forts } from '../data/forts.js';
import { mappedTrailLocations } from '../data/fortCatalogue.js';

test('crowd levels follow the wait at the narrow section and parking', () => {
  assert.equal(crowdLevel({ queueDelay: 0, parkingPercent: 30 }), 'low');
  assert.equal(crowdLevel({ queueDelay: 9, parkingPercent: 79 }), 'low');
  assert.equal(crowdLevel({ queueDelay: 10, parkingPercent: 0 }), 'medium');
  assert.equal(crowdLevel({ queueDelay: 0, parkingPercent: 80 }), 'medium');
  assert.equal(crowdLevel({ queueDelay: 30, parkingPercent: 0 }), 'high');
  assert.equal(crowdLevel({ queueDelay: 0, parkingPercent: 150 }), 'high');
});

test('every benchmarked fort is quiet at the alpine start and very busy at peak, as modelled', () => {
  for (const fort of forts) {
    const rows = windowForecasts(fort);
    assert.deepEqual(rows.map((row) => row.window), departureWindows);
    assert.equal(rows[0].level, 'low', `${fort.id} alpine`);
    assert.equal(bestWindow(rows).window, 'alpine', `${fort.id} best`);
    assert.equal(busiestWindow(rows).window, 'peak', `${fort.id} busiest`);
  }
});

test('Rajgad matches the published model figures', () => {
  const rows = windowForecasts(forts.find((fort) => fort.id === 'rajgad'));
  assert.deepEqual(rows.map((row) => row.level), ['low', 'medium', 'high']);
  assert.equal(Math.round(rows[2].forecast.queueDelay), 71);
});

test('the best window prefers the quieter level, then fewer people, then the earlier start', () => {
  const row = (window, level, activeLoad) => ({ window, level, forecast: { activeLoad } });
  assert.equal(bestWindow([row('alpine', 'medium', 10), row('early', 'low', 50)]).window, 'early');
  assert.equal(bestWindow([row('early', 'low', 50), row('alpine', 'low', 10)]).window, 'alpine');
  assert.equal(bestWindow([row('early', 'low', 10), row('alpine', 'low', 10)]).window, 'alpine');
  assert.equal(busiestWindow([row('alpine', 'low', 10), row('peak', 'high', 5)]).window, 'peak');
});

test('every mapped location gets a level for every window', () => {
  for (const location of mappedTrailLocations) {
    for (const { level } of windowForecasts(location)) assert.ok(['low', 'medium', 'high'].includes(level), location.id);
  }
});
