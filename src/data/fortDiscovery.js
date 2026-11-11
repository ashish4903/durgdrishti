import { fortCatalogue } from './fortCatalogue.js';
import { calculateLocationForecast } from './forecast.js';
import { forts } from './forts.js';

const normalize = (value = '') => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
const normalizeFortName = (value) => normalize(value).replace(/fort$/, '');
const districtAliases = new Map([
  ['nagar', 'Ahmednagar'],
  ['ahmednagar', 'Ahmednagar'],
  ['csambhajinagar', 'Chhatrapati Sambhajinagar'],
  ['sambhajinagar', 'Chhatrapati Sambhajinagar'],
  ['usmanabad', 'Dharashiv'],
  ['sindhudurga', 'Sindhudurg'],
  ['nahsik', 'Nashik'],
]);

const canonicalDistrict = (district) => districtAliases.get(normalize(district)) ?? district;

const interestTags = {
  history: 'history',
  architecture: 'architecture',
  openLandscape: 'openLandscape',
  waterfalls: 'waterfalls',
  challenging: 'challenging',
  quieter: 'quieter',
  flowers: 'flowers',
  photography: 'photography',
};

const fortTags = {
  rajgad: ['history', 'architecture', 'openLandscape'],
  sinhagad: ['history', 'architecture'],
  torna: ['history', 'architecture', 'openLandscape', 'challenging'],
  visapur: ['architecture', 'waterfalls', 'challenging'],
  korigad: ['architecture', 'quieter'],
  harihar: ['architecture', 'challenging'],
  tringalwadi: ['architecture', 'openLandscape'],
};

export function getFortCoverage(place) {
  const benchmark = forts.find((fort) => fort.id === place.forecastId);
  const hasCoordinates = Boolean(place.coordinates?.length === 2);
  const hasFortNotes = Boolean(benchmark?.aboutKey);
  const hasCrowdBenchmark = Boolean(benchmark);
  const hasDistrict = Boolean(place.district);
  const availableCount = [hasCoordinates, hasFortNotes, hasCrowdBenchmark].filter(Boolean).length;

  return {
    hasCoordinates,
    hasFortNotes,
    hasCrowdBenchmark,
    hasDistrict,
    availableCount,
    totalCount: 3,
    isBestDocumented: availableCount === 3,
  };
}

export function getRecommendedForts(profile, limit = 3) {
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const visited = new Set(
    (profile?.visitedForts ?? '').split(/[,;|]/).map(normalizeFortName).filter(Boolean),
  );
  const curated = fortCatalogue
    .filter((place) => getFortCoverage(place).isBestDocumented)
    .map((place) => {
      const tags = fortTags[place.forecastId] ?? [];
      const matchingInterest = interests.find((interest) => tags.includes(interestTags[interest]));
      const alreadyVisited = visited.has(normalizeFortName(place.name));
      return {
        place,
        matchingInterest,
        alreadyVisited,
        score: (matchingInterest ? 10 : 0) - (alreadyVisited ? 100 : 0),
      };
    })
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'en'));

  return curated.slice(0, limit);
}

export function getUnsupportedInterests(profile) {
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const documentedTags = new Set(Object.values(fortTags).flat());
  return interests.filter((interest) => interestTags[interest] && !documentedTags.has(interestTags[interest]));
}

export function getDistrictCounts(places = fortCatalogue) {
  const counts = new Map();
  for (const place of places) {
    const district = place.district?.trim() ? canonicalDistrict(place.district.trim()) : '';
    if (district) counts.set(district, (counts.get(district) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district, 'en'));
}

export function getBenchmarkHotspots(slot = 'peak') {
  return forts
    .map((fort) => ({
      fort,
      forecast: calculateLocationForecast({ ...fort, forecastId: fort.id }, slot, false),
    }))
    .sort((a, b) => b.forecast.activeLoad - a.forecast.activeLoad);
}

export function createContributionUrl(place) {
  const coverage = getFortCoverage(place);
  const missing = [];
  if (!coverage.hasCoordinates) missing.push('- Verified coordinates or a map pin');
  if (!coverage.hasFortNotes) missing.push('- Fort history, architecture, nature, or route notes');
  if (!coverage.hasCrowdBenchmark) missing.push('- A sourced planning/crowd benchmark (not live visitor counts)');
  if (!place.district) missing.push('- District and a source confirming the location');
  missing.push('- Corrections or additional cited sources');

  const title = `Fort guide contribution: ${place.name}`;
  const body = [
    `## Fort\n${place.name}${place.district ? `, ${place.district}` : ''}`,
    '',
    '## Information to add or correct',
    ...(missing.length ? missing : ['- Corrections or additional cited sources']),
    '',
    '## Details and source links',
    'Please include a reliable public source URL and note when the information was last checked.',
    '',
    'Do not include personal, medical, or sensitive information. Contributions are submitted publicly on GitHub.',
  ].join('\n');

  const params = new URLSearchParams({ title, body });
  return `https://github.com/mrajat31/durgdrishti/issues/new?${params}`;
}
