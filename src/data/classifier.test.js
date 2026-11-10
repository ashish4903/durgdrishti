import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLandmark } from './classifier.js';

test('verified landmarks take precedence over feature heuristic', () => {
  assert.deepEqual(classifyLandmark('Rajgad', []), {
    type: 'fort', points: 100, verified: true, name: 'Rajgad',
  });
  assert.equal(classifyLandmark('Kalsubai', ['bastion', 'gateway']).type, 'peak');
});

test('classifies fort-name suffixes and structural evidence at thresholds', () => {
  assert.equal(classifyLandmark('Somegad', []).points, 25);
  assert.equal(classifyLandmark('Unnamed', ['cistern', 'bastion', 'gateway']).type, 'outpost');
  assert.equal(classifyLandmark('Unnamed', ['cistern', 'bastion', 'gateway', 'machi']).type, 'fort');
});

test('normalizes whitespace and casing for registry lookup', () => {
  assert.equal(classifyLandmark('  SINHAGAD  ', []).name, 'Sinhagad');
});
