import { structuralFeatures, verifiedLandmarks } from './forts.js';
import { fortCatalogue } from './fortCatalogue.js';

const indexedFortLandmarks = Object.fromEntries(
  fortCatalogue.map((fort) => [
    fort.name.trim().toLocaleLowerCase().replace(/\s+/g, ' '),
    { type: 'fort', name: fort.name },
  ]),
);

export function classifyLandmark(name, selectedFeatures) {
  const normalized = name.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const known = verifiedLandmarks[normalized] ?? indexedFortLandmarks[normalized];
  const featurePoints = structuralFeatures
    .filter((feature) => selectedFeatures.includes(feature.id))
    .reduce((total, feature) => total + feature.points, 0);
  const hasFortSuffix = /(?:-|\s)?(?:gad|garh|durg|kot)$/.test(normalized);
  const points = Math.min(100, featurePoints + (hasFortSuffix ? 25 : 0));

  if (known) return { type: known.type, points: known.type === 'fort' ? 100 : 0, verified: true, name: known.name };
  return { type: points >= 70 ? 'fort' : points >= 45 ? 'outpost' : 'peak', points, verified: false };
}
