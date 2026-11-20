import { fortCatalogue, mappedTrailLocations } from '../data/fortCatalogue.js';

// Which fort the insights page shows. A fort can be opened from the catalogue (directory and
// reference entries) or from a mapped location (OpenStreetMap and the seven benchmarked forts);
// these helpers link the two so either way shows the same details.

export const normalizeName = (name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');

const sameName = (a, b) => normalizeName(a ?? '') === normalizeName(b ?? '');

export const defaultSelection = {
  selectedCatalogueId: fortCatalogue.find((place) => place.forecastId === 'rajgad')?.id ?? fortCatalogue[0]?.id,
  fortId: 'rajgad',
  mappedLocationId: null,
};

export const findCataloguePlace = (id) => fortCatalogue.find((place) => place.id === id);
export const findMappedLocation = (id) => mappedTrailLocations.find((location) => location.id === id);

/** The mapped location that has the same name as a catalogue place, if any. */
export function mappedLocationForPlace(place) {
  if (!place) return undefined;
  return mappedTrailLocations.find((location) => (
    location.feature?.names.some((name) => sameName(name, place.name))
    || sameName(location.name, place.name)
  ));
}

/** The catalogue place for a mapped location: same name, or the same coordinates. */
export function cataloguePlaceForLocation(location) {
  if (!location) return undefined;
  return fortCatalogue.find((entry) => (
    location.feature?.names.some((name) => sameName(name, entry.name))
    || (entry.coordinates && location.coordinates
      && Math.abs(entry.coordinates[0] - location.coordinates[0]) < 0.0001
      && Math.abs(entry.coordinates[1] - location.coordinates[1]) < 0.0001)
  ));
}

/**
 * The selection change for opening a catalogue place. Without a benchmarked forecast the
 * previous `fortId` is kept (it is left out), as before the routes were added.
 */
export function selectionForPlace(place) {
  if (place.forecastId) {
    return { selectedCatalogueId: place.id, fortId: place.forecastId, mappedLocationId: null };
  }
  return { selectedCatalogueId: place.id, mappedLocationId: mappedLocationForPlace(place)?.id ?? null };
}

/** The selection change for opening a mapped location. */
export function selectionForMappedLocation(location) {
  return {
    mappedLocationId: location.id,
    selectedCatalogueId: cataloguePlaceForLocation(location)?.id ?? null,
    ...(location.forecastId ? { fortId: location.forecastId } : {}),
  };
}

/** The selection change a fort or place route asks for, or null when its id is unknown. */
export function selectionForRoute(route) {
  if (route.page === 'fort') {
    const place = findCataloguePlace(route.fortId);
    return place ? selectionForPlace(place) : null;
  }
  if (route.page === 'place') {
    const location = findMappedLocation(route.locationId);
    return location ? selectionForMappedLocation(location) : null;
  }
  return null;
}

/** True when a route points at a fort or place that exists (other pages always exist). */
export const routeExists = (route) => (
  route.page !== 'fort' && route.page !== 'place' ? true : selectionForRoute(route) !== null
);

/** The fort shown in the insights heading: catalogue details merged with its mapped location. */
export function resolveInsightLocation({ selectedCatalogueId, mappedLocationId }) {
  const place = findCataloguePlace(selectedCatalogueId);
  const mapped = findMappedLocation(mappedLocationId) ?? mappedLocationForPlace(place);
  if (!place) return mapped;
  return {
    ...mapped,
    ...place,
    id: mapped?.id ?? place.id,
    name: place.name ?? mapped?.name,
    coordinates: place.coordinates ?? mapped?.coordinates,
    feature: mapped?.feature,
  };
}
