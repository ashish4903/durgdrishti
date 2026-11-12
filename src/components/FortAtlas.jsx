import { useEffect, useMemo, useState } from 'react';
import FortAtlasMap from './FortAtlasMap.jsx';
import RecommendedForts from './RecommendedForts.jsx';
import {
  fortCatalogue,
  fortCatalogueSource,
  fortMapFeatures,
  mappedTrailLocations,
  OpenStreetMapFortSource,
  TrekshitizFortSource,
  UNESCOFortSource,
} from '../data/fortCatalogue.js';

export default function FortAtlas({ copy, mode, profile, onPlanLocation, onGetInsights, selectedFortId, selectedLocationId }) {
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
    onGetInsights(place);
  };
  const selected = fortCatalogue.find((place) => place.id === selectedId);
  const mapPinCount = fortMapFeatures.length + mappedPlaces.filter((place) => !fortMapFeatures.some((feature) => (
    feature.names.some((name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
      === place.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ''))
  ))).length;
  const formatMessage = (message, values) => Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    message,
  );

  return (
    <section className="atlas-workspace">
      {mode === 'chooseInsight' && <RecommendedForts copy={copy} profile={profile} onOpenFort={onGetInsights} compact />}
      <div className="atlas-heading">
        <div>
          <span className="section-kicker">{mode === 'chooseInsight' ? copy.insightsPageTitle : copy.atlasKicker}</span>
          <h2>{mode === 'chooseInsight' ? copy.insightPickerTitle : copy.atlasTitle}</h2>
          <p>{mode === 'chooseInsight' ? copy.insightPickerIntro : copy.atlasIntro}</p>
        </div>
        <div className="atlas-count">
          <strong>{fortCatalogue.length}</strong>
          <span>{copy.indexedForts}</span>
        </div>
      </div>

      <div className="atlas-browser">
        <div className="atlas-browser-heading">
          <div>
            <span className="section-kicker">{copy.browseForts}</span>
            <h3>{mode === 'chooseInsight' ? copy.insightPickerTitle : copy.fortIndex}</h3>
          </div>
          <span className="atlas-result-count" aria-live="polite">{filteredPlaces.length} / {fortCatalogue.length}</span>
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
        <div className="atlas-place-list" role="list" aria-label={copy.fortIndex}>
          {filteredPlaces.map((place) => (
            <article key={place.id} className={`atlas-place ${selectedId === place.id ? 'atlas-place-selected' : ''}`} role="listitem">
              <button type="button" className="atlas-place-select" onClick={() => selectPlace(place)}>
                <span className="atlas-place-name">{place.name}</span>
                <span className="atlas-place-meta">
                  {place.coordinates ? copy.mapLocationAvailable : copy.mapSearchAvailable}
                  {place.district ? ` · ${place.district}` : ''}
                </span>
              </button>
              <button type="button" className="atlas-place-action" onClick={() => selectPlace(place)}>{copy.getInsights}</button>
            </article>
          ))}
          {filteredPlaces.length === 0 && <p className="atlas-empty">{copy.noFortMatches}</p>}
        </div>
        {selected && !selected.coordinates && <p className="atlas-selection-note">{copy.noCoordinatesNote}</p>}
      </div>

      {mode === 'explore' && <div className="atlas-map-section">
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
      </div>}

      {mode === 'explore' && <div className="atlas-sources">
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
          pins: mapPinCount,
        })}</p>
        <p className="atlas-coverage-note">{copy.atlasCoverageNote}</p>
      </div>}
    </section>
  );
}
