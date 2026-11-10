import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

const markerIcon = (color) => L.divIcon({
  className: 'map-marker-wrapper',
  html: `<span class="map-marker ${color}"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const redIcon = markerIcon('map-marker-red');
const greenIcon = markerIcon('map-marker-green');

function FitLandscape({ fort, alternative }) {
  const map = useMap();
  useEffect(() => {
    const [latitude, longitude] = fort.coordinates;
    const radiusLatitude = 25_000 / 111_320;
    const radiusLongitude = 25_000 / (111_320 * Math.cos(latitude * Math.PI / 180));
    const bounds = L.latLngBounds(
      [latitude - radiusLatitude, longitude - radiusLongitude],
      [latitude + radiusLatitude, longitude + radiusLongitude],
    );
    if (alternative) bounds.extend(alternative.coordinates);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 10, animate: true, duration: 0.6 });
  }, [map, fort, alternative]);
  return null;
}

export default function TrailMap({ fort, alternative, copy, language, onSelectAlternative }) {
  const [tileError, setTileError] = useState(false);
  const routeUrl = (coordinates) => `https://www.google.com/maps/dir/?api=1&destination=${coordinates[0]},${coordinates[1]}`;

  return (
    <div className="map-frame">
      <MapContainer center={fort.coordinates} zoom={9} scrollWheelZoom={false} className="trail-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }}
        />
        <FitLandscape fort={fort} alternative={alternative} />
        <Circle
          center={fort.coordinates}
          radius={25_000}
          pathOptions={{ color: '#8ebc91', weight: 1, dashArray: '5 7', fillColor: '#8ebc91', fillOpacity: 0.035 }}
        />
        <Marker position={fort.coordinates} icon={redIcon}>
          <Popup>
            <strong>{fort.name}</strong><br />
            {copy.summitLabel}: <a href={routeUrl(fort.coordinates)} target="_blank" rel="noreferrer">{copy.openMap} ↗</a>
            {fort.baseVillage && <><br />{copy.baseVillageLabel}: {fort.baseVillage}<br />
              <a href={routeUrl(fort.baseCoordinates)} target="_blank" rel="noreferrer">{copy.baseDirections} ↗</a></>}
            {fort.feature && <><br /><a href={fort.feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature} ↗</a></>}
          </Popup>
        </Marker>
        {alternative && (
          <Marker position={alternative.coordinates} icon={greenIcon}>
            <Popup>
              <strong>{alternative.name}</strong> · {copy.alternativeLegend}<br />
              {copy.baseVillageLabel}: {alternative.baseVillage}<br />
              <a href={routeUrl(alternative.baseCoordinates)} target="_blank" rel="noreferrer">{copy.baseDirections} ↗</a><br />
              <button type="button" className="map-compare-button" onClick={onSelectAlternative}>{copy.compareAlternative}</button>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      {tileError && <div className="map-offline-note">{copy.mapUnavailable}</div>}
      <span className="map-language" aria-hidden="true">{language.toUpperCase()}</span>
    </div>
  );
}
