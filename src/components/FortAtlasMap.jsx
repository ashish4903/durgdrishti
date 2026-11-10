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

export default function FortAtlasMap({ places, features, selectedId, selectedLocationId, onSelect, onPlanLocation, copy }) {
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
      <MapContainer center={[19.3, 75.1]} zoom={6} scrollWheelZoom className="trail-map atlas-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AtlasViewport places={mappedPlaces} features={features} selected={selectedLocation} />
        {selectedLocation?.coordinates && (
          <Circle
            center={selectedLocation.coordinates}
            radius={25_000}
            pathOptions={{ color: '#8ebc91', weight: 1, dashArray: '5 7', fillColor: '#8ebc91', fillOpacity: 0.035 }}
          />
        )}
        {features.map((feature) => {
          const isSelectedLocation = selectedLocationId === `atlas:${feature.key}`;
          const matchingPlace = mappedPlaces.find((place) => feature.names.some((name) => (
            name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
              === place.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
          )));
          return (
            <CircleMarker
              key={feature.key}
              center={[feature.lat, feature.lon]}
              radius={isSelectedLocation || matchingPlace?.id === selectedId ? 7 : 4}
              pathOptions={{
                color: isSelectedLocation || matchingPlace?.id === selectedId ? '#ef8273' : '#9cc18d',
                fillColor: isSelectedLocation || matchingPlace?.id === selectedId ? '#ef8273' : '#9cc18d',
                fillOpacity: 0.8,
                weight: 1,
              }}
            >
              <Popup>
                <strong>{feature.name}</strong><br />
                <a href={`https://www.google.com/maps/search/?api=1&query=${feature.lat},${feature.lon}`} target="_blank" rel="noreferrer">{copy.openMap} ↗</a><br />
                <a href={feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature} ↗</a>
                <br /><button type="button" className="map-compare-button" onClick={() => onPlanLocation(`atlas:${feature.key}`)}>{copy.openTrailBriefing}</button>
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
            html: `<span class="map-marker ${isSelectedLocation || place.id === selectedId ? 'map-marker-red' : 'map-marker-green'}"></span>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          return (
            <Marker key={place.id} position={place.coordinates} icon={icon}>
              <Popup>
                <strong>{place.name}</strong><br />
                <a href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates[0]},${place.coordinates[1]}`} target="_blank" rel="noreferrer">{copy.openMap} ↗</a><br />
                <button type="button" className="map-compare-button" onClick={() => onPlanLocation(`atlas:${place.id}`)}>{copy.openTrailBriefing}</button><br />
                <button type="button" className="map-compare-button" onClick={() => onSelect(place.id)}>{copy.openFortRecord}</button>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <span className="atlas-map-count">{mapPinCount} {copy.mapPinLabel}</span>
    </div>
  );
}
