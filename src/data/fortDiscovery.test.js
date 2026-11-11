import test from 'node:test';
import assert from 'node:assert/strict';
import { fortCatalogue } from './fortCatalogue.js';
import { translations } from './translations.js';
import {
  createContributionUrl,
  getBenchmarkHotspots,
  getDistrictCounts,
  getFortCoverage,
  getRecommendedForts,
  getUnsupportedInterests,
} from './fortDiscovery.js';

test('best-documented recommendations have coordinates, fort notes, and benchmark data', () => {
  const recommendations = getRecommendedForts(null, 20);
  assert.equal(recommendations.length, 7);
  for (const { place } of recommendations) {
    assert.equal(getFortCoverage(place).isBestDocumented, true);
  }
});

test('recommendations favor selected interests and de-prioritize already visited forts', () => {
  const historyPicks = getRecommendedForts({ interests: ['history'] });
  assert.ok(historyPicks.every((item) => item.matchingInterest === 'history'));
  const newPicks = getRecommendedForts({
    interests: ['history'],
    visitedForts: historyPicks[0].place.name,
  });
  assert.ok(newPicks.every((item) => !item.alreadyVisited));
});

test('unsupported interests are not presented as matched recommendations', () => {
  const picks = getRecommendedForts({ interests: ['flowers'] });
  assert.ok(picks.every((item) => item.matchingInterest === undefined));
  assert.deepEqual(getUnsupportedInterests({ interests: ['history', 'flowers'] }), ['flowers']);
});

test('district rollup counts only records with district data', () => {
  const counts = getDistrictCounts();
  assert.ok(counts.length > 10);
  assert.ok(counts.every((item) => item.district && item.count > 0));
  assert.ok(counts.every((item, index) => index === 0 || counts[index - 1].count >= item.count));
  assert.deepEqual(getDistrictCounts([
    { district: 'C.Sambhaji Nagar' },
    { district: 'Chhatrapati Sambhajinagar' },
  ]), [{ district: 'Chhatrapati Sambhajinagar', count: 2 }]);
});

test('dashboard hotspots contain only sorted benchmark estimates', () => {
  const hotspots = getBenchmarkHotspots('peak');
  assert.equal(hotspots.length, 7);
  assert.ok(hotspots.every((item) => item.forecast.isProxy === false));
  assert.ok(hotspots.every((item, index) => index === 0
    || hotspots[index - 1].forecast.activeLoad >= item.forecast.activeLoad));
});

test('contribution links prefill fort data without including visitor profile data', () => {
  const place = fortCatalogue.find((entry) => !entry.coordinates);
  const url = new URL(createContributionUrl(place));
  assert.equal(url.origin, 'https://github.com');
  assert.match(url.pathname, /\/issues\/new$/);
  assert.match(url.searchParams.get('title'), new RegExp(place.name));
  assert.match(url.searchParams.get('body'), /Verified coordinates/);
  assert.doesNotMatch(url.toString(), /age|trekCount|visitedForts/);
});

test('all locales contain the visitor profile, recommendations, dashboard, and contribution copy', () => {
  const keys = [
    'navDashboard', 'dashboardTitle', 'districtRollupTitle', 'modeledHotspotsTitle',
    'profileSetupTitle', 'profileNameLabel', 'profileAgeLabel', 'treksCompletedLabel',
    'visitedFortsLabel', 'profileInterestsLabel', 'profilePrivacyNote', 'profileSave',
    'profileSkip', 'profileRecommendationsTitle', 'profileUnsupportedInterests',
    'coverageCoordinates', 'coverageNotes', 'coverageCrowdBenchmark',
    'interestHistory', 'interestArchitecture', 'interestOpenLandscape', 'interestWaterfalls',
    'interestChallenging', 'interestQuieter', 'interestFlowers', 'interestPhotography',
    'contributeTitle', 'contributeAction', 'contributionPublicNote',
  ];
  for (const [locale, copy] of Object.entries(translations)) {
    for (const key of keys) assert.ok(copy[key], `${locale}.${key} is missing`);
  }
});
