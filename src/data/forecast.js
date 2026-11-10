import { forts } from './forts.js';

export const slotMultipliers = { alpine: 0.25, early: 0.7, peak: 1.85 };
const regionalProxyRadiusKm = 25;

export function calculateForecast(fort, slot, surge) {
  const activeLoad = (fort.baseVolume / 3) * slotMultipliers[slot] * (surge ? 1.4 : 1);
  const arrivalRate = activeLoad / 120;
  const queueDelay = arrivalRate <= fort.chokeCapacity
    ? 0
    : Math.min(85, ((arrivalRate - fort.chokeCapacity) / fort.chokeCapacity) * 50);
  const parkingPercent = ((activeLoad * 0.32) / fort.parkingCapacity) * 100;
  const baseDelay = fort.baseJamMinutes * (slot === 'peak' ? 1 : 0.4) * (surge ? 1.4 : 1);
  const wasteLoad = activeLoad * 0.18;
  const wasteDeficit = Math.max(0, ((wasteLoad - fort.wasteCapacity) / fort.wasteCapacity) * 100);
  return { activeLoad, arrivalRate, queueDelay, parkingPercent, baseDelay, wasteLoad, wasteDeficit };
}

function distanceInKm(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const [latitudeA, longitudeA] = from;
  const [latitudeB, longitudeB] = to;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const statewideProxy = {
  id: 'maharashtra-baseline',
  name: 'Maharashtra benchmark median',
  baseVolume: median(forts.map((fort) => fort.baseVolume)),
  chokeCapacity: median(forts.map((fort) => fort.chokeCapacity)),
  parkingCapacity: median(forts.map((fort) => fort.parkingCapacity)),
  baseJamMinutes: median(forts.map((fort) => fort.baseJamMinutes)),
  wasteCapacity: median(forts.map((fort) => fort.wasteCapacity)),
};

export function nearestBenchmark(location) {
  if (!location?.coordinates) return null;
  return forts.reduce((nearest, fort) => {
    const distance = distanceInKm(location.coordinates, fort.coordinates);
    return !nearest || distance < nearest.distance
      ? { fort, distance }
      : nearest;
  }, null);
}

export function calculateLocationForecast(location, slot, surge) {
  if (!location?.coordinates) return null;
  const benchmark = location.forecastId
    ? forts.find((fort) => fort.id === location.forecastId)
    : null;
  const nearest = benchmark ? { fort: benchmark, distance: 0 } : nearestBenchmark(location);
  if (!nearest) return null;
  const isRegionalProxy = !benchmark && nearest.distance > regionalProxyRadiusKm;
  const profile = isRegionalProxy ? statewideProxy : nearest.fort;

  return {
    ...calculateForecast(profile, slot, surge),
    profile,
    isProxy: !benchmark,
    isRegionalProxy,
    nearestFort: nearest.fort,
    proxyDistanceKm: nearest.distance,
  };
}
