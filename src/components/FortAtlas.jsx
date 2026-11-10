import { useEffect, useMemo, useState } from 'react';
import FortAtlasMap from './FortAtlasMap.jsx';
import {
  fortCatalogue,
  fortCatalogueSource,
  fortMapFeatures,
  mappedTrailLocations,
  OpenStreetMapFortSource,
  TrekshitizFortSource,
  UNESCOFortSource,
} from '../data/fortCatalogue.js';

export default function FortAtlas({ copy, onPlanFort, onPlanLocation, selectedFortId, selectedLocationId }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => (
    fortCatalogue.find((place) => place.forecastId === selectedFortId)?.id ?? fortCatalogue[0]?.id
  ));
  useEffect(() => {
    const selectedTrail = fortCatalogue.find((place) => place.forecastId === selectedFortId);
    if (selectedTrail) setSelectedId(selectedTrail.id);
  }, [selectedFortId]);
  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return fortCatalogue;
    return fortCatalogue.filter((place) => (
      place.name.toLocaleLowerCase().includes(normalizedQuery)
      || place.district?.toLocaleLowerCase().includes(normalizedQuery)
    ));
  }, [query]);
  const mappedPlaces = useMemo(() => fortCatalogue.filter((place) => place.coordinates), []);
  const mappedLocationForPlace = (place) => {
    const normalize = (name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
    return mappedTrailLocations.find((location) => (
      location.feature?.names.some((name) => normalize(name) === normalize(place.name))
      || (location.name && normalize(location.name) === normalize(place.name))
    ));
  };
  useEffect(() => {
    if (!selectedLocationId) return;
    const selectedPlace = fortCatalogue.find((place) => mappedLocationForPlace(place)?.id === selectedLocationId);
    if (selectedPlace) setSelectedId(selectedPlace.id);
  }, [selectedLocationId]);
  const selectPlace = (place) => {
    setSelectedId(place.id);
    const mappedLocation = mappedLocationForPlace(place);
    if (place.forecastId) onPlanFort(place.forecastId);
    else if (mappedLocation) onPlanLocation(mappedLocation.id);
  };
  const selected = fortCatalogue.find((place) => place.id === selectedId);
  const googleMapsSearch = (place) => {
    const location = [place.name, place.district, 'Maharashtra', 'India'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };
  const formatMessage = (message, values) => Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    message,
  );

  return (
    <section className="atlas-workspace">
      <div className="atlas-heading">
        <div>
          <span className="section-kicker">04 / {copy.atlasKicker}</span>
          <h2>{copy.atlasTitle}</h2>
          <p>{copy.atlasIntro}</p>
        </div>
        <div className="atlas-count">
          <strong>{fortCatalogue.length}</strong>
          <span>{copy.indexedForts}</span>
        </div>
      </div>

      <div className="atlas-map-section">
        <FortAtlasMap
          places={mappedPlaces}
          features={fortMapFeatures}
          selectedId={selectedId}
          selectedLocationId={selectedLocationId}
          onSelect={setSelectedId}
          onPlanLocation={onPlanLocation}
          copy={copy}
        />
        <div className="atlas-legend">
          <span><i className="legend-dot legend-red" />{copy.selectedFortMarker}</span>
          <span><i className="legend-dot legend-green" />{copy.mappedOsmFeatures}</span>
          <span><i className="legend-ring" />{copy.bufferLegend}</span>
          <span>{mappedPlaces.length} / {fortCatalogue.length} {copy.withPublishedCoordinates}</span>
        </div>
      </div>

      <div className="atlas-browser">
        <div className="atlas-browser-heading">
          <div>
            <span className="section-kicker">05 / {copy.browseForts}</span>
            <h3>{copy.fortIndex}</h3>
          </div>
          <span className="atlas-result-count">{filteredPlaces.length} / {fortCatalogue.length}</span>
        </div>
        <label className="sr-only" htmlFor="fort-search">{copy.searchForts}</label>
        <input
          id="fort-search"
          className="atlas-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchForts}
        />
        <div className="atlas-place-list" role="list">
          {filteredPlaces.map((place) => (
            <article key={place.id} className={`atlas-place ${selectedId === place.id ? 'atlas-place-selected' : ''}`} role="listitem">
              <button type="button" className="atlas-place-select" onClick={() => selectPlace(place)}>
                <span className="atlas-place-name">{place.name}</span>
                <span className="atlas-place-meta">
                  {place.coordinates ? copy.mapLocationAvailable : copy.mapSearchAvailable}
                  {place.district ? ` · ${place.district}` : ''}
                </span>
              </button>
              {place.forecastId
                ? <button type="button" className="atlas-place-action" onClick={() => onPlanFort(place.forecastId)}>{copy.openForecast}</button>
                : place.coordinates && mappedLocationForPlace(place)
                  ? <button type="button" className="atlas-place-action" onClick={() => onPlanLocation(mappedLocationForPlace(place).id)}>{copy.openTrailBriefing}</button>
                : <a className="atlas-place-action" href={googleMapsSearch(place)} target="_blank" rel="noreferrer">{copy.findOnMap}</a>}
            </article>
          ))}
          {filteredPlaces.length === 0 && <p className="atlas-empty">{copy.noFortMatches}</p>}
        </div>
        <p className="atlas-source">
          {copy.atlasSourceNote}{' '}
          <a href={fortCatalogueSource} target="_blank" rel="noreferrer">{copy.publicIndexLink}</a>
          {' · '}
          <a href={OpenStreetMapFortSource} target="_blank" rel="noreferrer">{copy.osmDataLink}</a>
          {' · '}
          <a href={TrekshitizFortSource} target="_blank" rel="noreferrer">{copy.directorySourceLink}</a>
          {' · '}
          <a href="https://en.wikipedia.org/wiki/Category:Forts_in_Maharashtra" target="_blank" rel="noreferrer">{copy.categoryIndexLink}</a>
          {' · '}
          <a href={UNESCOFortSource} target="_blank" rel="noreferrer">{copy.unescoListLink}</a>
        </p>
        <p className="atlas-coverage-note">{formatMessage(copy.mapCoverageCaveat, {
          count: fortCatalogue.length,
          mapped: mappedPlaces.length,
          features: fortMapFeatures.length,
          pins: fortMapFeatures.length + mappedPlaces.filter((place) => !fortMapFeatures.some((feature) => (
            feature.names.some((name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
              === place.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ''))
          ))).length,
        })}</p>
        <p className="atlas-coverage-note">{copy.atlasCoverageNote}</p>
        {selected && !selected.coordinates && <p className="atlas-selection-note">{copy.noCoordinatesNote}</p>}
      </div>
    </section>
  );
}
