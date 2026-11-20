import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

function AtlasViewport({ places, features, selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected?.coordinates) {
      map.flyTo(selected.coordinates, 8, { duration: 0.6 });
      return;
    }

    const coordinates = [
      ...places.filter((place) => place.coordinates).map((place) => place.coordinates),
      ...features.map((feature) => [feature.lat, feature.lon]),
    ];
    if (coordinates.length) {
      map.fitBounds(L.latLngBounds(coordinates), {
        padding: [24, 24],
        maxZoom: 7,
      });
    }
  }, [map, places, features, selected]);
  return null;
}

// Leaflet draws circle pins as SVG with colour attributes, which cannot use CSS variables, so the
// theme colours are read from the page's tokens (and read again when the theme changes).
// eslint-disable-next-line no-unused-vars -- the theme only says when to read the colours again
function themeColours(theme) {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return { pin: read('--primary', '#1f5c4f'), selected: read('--accent', '#b4500e'), hover: read('--highlight', '#f3c969') };
}

export default function FortAtlasMap({ places, features, selectedId, selectedLocationId, hoveredId, onSelect, onPlanLocation, copy, theme }) {
  const colours = useMemo(() => themeColours(theme), [theme]);
  const selected = places.find((place) => place.id === selectedId);
  const selectedMappedFeature = features.find((feature) => selectedLocationId === `atlas:${feature.key}`);
  const selectedSupplement = places.find((place) => selectedLocationId === `atlas:${place.id}`);
  const selectedLocation = selectedMappedFeature
    ? { coordinates: [selectedMappedFeature.lat, selectedMappedFeature.lon] }
    : selectedSupplement ?? selected;
  const mappedPlaces = useMemo(() => places.filter((place) => place.coordinates), [places]);
  const supplementalPlaces = mappedPlaces.filter((place) => !features.some((feature) => (
    feature.names.some((name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
      === place.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ''))
  )));
  const mapPinCount = features.length + supplementalPlaces.length;

  return (
    <div className="atlas-map-frame">
      <MapContainer center={[19.3, 75.1]} zoom={6} scrollWheelZoom={false} className="trail-map atlas-map" aria-label={copy.atlasTitle}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AtlasViewport places={mappedPlaces} features={features} selected={selectedLocation} />
        {selectedLocation?.coordinates && (
          <Circle
            center={selectedLocation.coordinates}
            radius={25_000}
            pathOptions={{ color: colours.pin, weight: 1.5, dashArray: '5 7', fillColor: colours.pin, fillOpacity: 0.05 }}
          />
        )}
        {features.map((feature) => {
          const isSelectedLocation = selectedLocationId === `atlas:${feature.key}`;
          const matchingPlace = mappedPlaces.find((place) => feature.names.some((name) => (
            name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
              === place.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
          )));
          const isSelected = isSelectedLocation || matchingPlace?.id === selectedId;
          const isHovered = Boolean(hoveredId) && matchingPlace?.id === hoveredId;
          const colour = isHovered ? colours.hover : isSelected ? colours.selected : colours.pin;
          return (
            <CircleMarker
              key={feature.key}
              center={[feature.lat, feature.lon]}
              radius={isHovered ? 10 : isSelected ? 8 : 5}
              pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.85, weight: isHovered ? 3 : 1.5 }}
            >
              <Popup>
                <strong>{feature.name}</strong><br />
                <a href={`https://www.google.com/maps/search/?api=1&query=${feature.lat},${feature.lon}`} target="_blank" rel="noreferrer">{copy.openMap} ↗</a><br />
                <a href={feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature} ↗</a>
                <br /><button type="button" className="map-compare-button" onClick={() => onPlanLocation(`atlas:${feature.key}`)}>{copy.getInsights}</button>
                {matchingPlace && <><br /><button type="button" className="map-compare-button" onClick={() => onSelect(matchingPlace.id)}>{copy.openFortRecord}</button></>}
              </Popup>
            </CircleMarker>
          );
        })}
        {mappedPlaces.map((place) => {
          const isSelectedLocation = selectedLocationId === `atlas:${place.id}`;
          if (features.some((feature) => feature.names.some((name) => (
            name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
              === place.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
          )))) return null;
          const icon = L.divIcon({
            className: 'map-marker-wrapper',
            html: `<span class="map-marker ${place.id === hoveredId ? 'map-marker-hover' : isSelectedLocation || place.id === selectedId ? 'map-marker-red' : 'map-marker-green'}"></span>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          return (
            <Marker key={place.id} position={place.coordinates} icon={icon}>
              <Popup>
                <strong>{place.name}</strong><br />
                <a href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates[0]},${place.coordinates[1]}`} target="_blank" rel="noreferrer">{copy.openMap} ↗</a><br />
                <button type="button" className="map-compare-button" onClick={() => onPlanLocation(`atlas:${place.id}`)}>{copy.getInsights}</button><br />
                <button type="button" className="map-compare-button" onClick={() => onSelect(place.id)}>{copy.openFortRecord}</button>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <span className="atlas-map-count">{mapPinCount} {copy.mapPinLabel}</span>
      <span className="atlas-map-help">{copy.atlasMapHelp}</span>
    </div>
  );
}
