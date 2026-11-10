import { useEffect, useMemo, useState } from 'react';
import {
  describeWeatherCode,
  findCommonsPhoto,
  findWikipediaHistory,
  getLandmarkWeather,
  weatherAdvice,
} from '../data/landmarkResources.js';

function LandmarkPhoto({ location, copy }) {
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setPhoto(null);
    setStatus('loading');
    findCommonsPhoto(location, controller.signal)
      .then((result) => {
        setPhoto(result);
        setStatus(result ? 'ready' : 'missing');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus('error');
      });
    return () => controller.abort();
  }, [location.id, retry]);

  return (
    <figure className="landmark-photo-card">
      {photo
        ? <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
        : <div className="landmark-photo-placeholder" role="img" aria-label={location.name}>
          <span>{status === 'loading' ? copy.photoLoading : status === 'error' ? copy.photoFailed : copy.photoUnavailable}</span>
          {status === 'error' && <button type="button" onClick={() => setRetry((value) => value + 1)}>{copy.tryAgain}</button>}
        </div>}
      <figcaption>
        {photo ? (
          <>
            <span>{photo.title}{photo.artist ? ` · ${photo.artist}` : ''}</span>
            <a href={photo.pageUrl} target="_blank" rel="noreferrer">{photo.licenseUrl ? `${copy.photoLicense}: ${photo.license}` : copy.photoCommonsSource} ↗</a>
            {photo.licenseUrl && <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{copy.photoLicenseText} ↗</a>}
          </>
        ) : <a href={`https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(location.name)}`} target="_blank" rel="noreferrer">{copy.searchCommons} ↗</a>}
      </figcaption>
    </figure>
  );
}

function WeatherCard({ location, copy }) {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setWeather(null);
    setStatus('loading');
    setErrorMessage('');
    getLandmarkWeather(location.coordinates, controller.signal)
      .then((result) => {
        setWeather(result);
        setSelectedDate(result.daily.time[0]);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setErrorMessage(error.message);
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, [location.id, retry]);

  const selectedDay = useMemo(
    () => weather?.daily.time.findIndex((date) => date === selectedDate) ?? -1,
    [weather, selectedDate],
  );

  return (
    <article className="toolkit-card weather-card">
      <div className="toolkit-card-heading">
        <span className="section-kicker">{copy.liveWeather}</span>
        <span className={`weather-status weather-status-${status}`}>{status === 'loading' ? copy.weatherLoading : status === 'error' ? copy.weatherUnavailable : copy.weatherForecast}</span>
      </div>
      <h3>{location.name}</h3>
      {weather && selectedDay >= 0 ? (
        <>
          <div className="weather-current">
            <strong>{Math.round(weather.current.temperature_2m)}°C</strong>
            <span>{describeWeatherCode(weather.current.weather_code, copy)}</span>
            <small>{copy.weatherUpdated} {weather.current.time.replace('T', ' ')}</small>
          </div>
          <label className="toolkit-field" htmlFor="weather-date">{copy.trekDate}</label>
          <select id="weather-date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
            {weather.daily.time.map((date) => <option key={date} value={date}>{date}</option>)}
          </select>
          <div className="weather-metrics">
            <span><strong>{Math.round(weather.daily.temperature_2m_min[selectedDay])}–{Math.round(weather.daily.temperature_2m_max[selectedDay])}°C</strong>{copy.weatherTemperature}</span>
            <span><strong>{weather.daily.precipitation_probability_max[selectedDay]}%</strong>{copy.weatherRainChance}</span>
            <span><strong>{Math.round(weather.daily.wind_speed_10m_max[selectedDay])} km/h</strong>{copy.weatherWind}</span>
          </div>
          <p className="weather-advice">{weatherAdvice({
            weather_code: weather.daily.weather_code[selectedDay],
            precipitation_probability_max: weather.daily.precipitation_probability_max[selectedDay],
            wind_speed_10m_max: weather.daily.wind_speed_10m_max[selectedDay],
          }, copy)}</p>
        </>
      ) : (
        <p className="toolkit-state-message">
          {status === 'loading' ? copy.weatherLoading : `${copy.weatherError} ${errorMessage}`}
          {status === 'error' && <button type="button" className="toolkit-retry" onClick={() => setRetry((value) => value + 1)}>{copy.tryAgain}</button>}
        </p>
      )}
      <p className="toolkit-disclaimer">{copy.weatherDisclaimer}</p>
      <a className="toolkit-source" href="https://open-meteo.com/" target="_blank" rel="noreferrer">{copy.weatherSource} ↗</a>
    </article>
  );
}

function HistoryCard({ location, copy, language }) {
  const [history, setHistory] = useState(null);
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);
  const searchUrl = `https://${language}.wikipedia.org/w/index.php?search=${encodeURIComponent(`${location.name} Maharashtra fort`)}`;

  useEffect(() => {
    const controller = new AbortController();
    setHistory(null);
    setStatus('loading');
    findWikipediaHistory(location, language, controller.signal)
      .then((result) => {
        setHistory(result);
        setStatus(result ? 'ready' : 'missing');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus('error');
      });
    return () => controller.abort();
  }, [location.id, language, retry]);

  return (
    <article className="toolkit-card history-card">
      <span className="section-kicker">{copy.fortHistory}</span>
      <h3>{history?.title ?? location.name}</h3>
      <p>{history?.extract ?? (status === 'loading' ? copy.historyLoading : status === 'error' ? copy.historyError : copy.historyUnavailable)}</p>
      {status === 'error' && <button type="button" className="toolkit-retry" onClick={() => setRetry((value) => value + 1)}>{copy.tryAgain}</button>}
      <a className="toolkit-source" href={history?.url ?? searchUrl} target="_blank" rel="noreferrer">
        {history ? copy.historySource : copy.searchHistory} ↗
      </a>
    </article>
  );
}

export default function LandmarkToolkit({ location, copy, language }) {
  const query = encodeURIComponent(`${location.name}, Maharashtra, India`);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates[0]},${location.coordinates[1]}`;
  const mapsSearch = (term) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${term} near ${location.name}, Maharashtra`)}`;
  const routeSearch = `https://www.google.com/search?q=${encodeURIComponent(`site:alltrails.com OR site:wikiloc.com hiking trail ${location.name} Maharashtra`)}`;
  const conditionSearch = `https://www.google.com/search?q=${encodeURIComponent(`${location.name} Maharashtra fort access notice permit`)}`;
  const serviceTerms = [
    { key: 'serviceFood', query: 'restaurants food' },
    { key: 'serviceStay', query: 'hotels homestays' },
    { key: 'serviceTransport', query: 'bus taxi transport' },
    { key: 'serviceParking', query: 'parking' },
    { key: 'serviceMedical', query: 'hospital pharmacy' },
  ];

  return (
    <section className="landmark-toolkit">
      <div className="toolkit-heading">
        <div>
          <span className="section-kicker">{copy.trekToolkit}</span>
          <h3>{copy.toolkitTitle.replace('{name}', location.name)}</h3>
          <p>{copy.toolkitIntro}</p>
        </div>
      </div>

      <div className="toolkit-grid">
        <div className="toolkit-primary">
          <HistoryCard location={location} copy={copy} language={language} />
          <LandmarkPhoto location={location} copy={copy} />
          <WeatherCard key={location.id} location={location} copy={copy} />
          <article className="toolkit-card">
            <span className="section-kicker">{copy.routePlanning}</span>
            <h3>{copy.planYourApproach}</h3>
            <p>{copy.routeDirectoryDisclaimer}</p>
            <div className="toolkit-link-list">
              <a href={directionsUrl} target="_blank" rel="noreferrer">{copy.navigateToLandmark} ↗</a>
              <a href={routeSearch} target="_blank" rel="noreferrer">{copy.searchHikingRoutes} ↗</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer">{copy.searchTrailhead} ↗</a>
              {location.feature?.url && <a href={location.feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature} ↗</a>}
            </div>
          </article>
        </div>

        <div className="toolkit-secondary">
          <article className="toolkit-card">
            <span className="section-kicker">{copy.preparationChecklist}</span>
            <h3>{copy.beforeYouGo}</h3>
            <ul className="toolkit-checklist">{copy.checklistItems.split('|').map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="toolkit-card">
            <span className="section-kicker">{copy.villageServices}</span>
            <h3>{copy.findNearbyServices}</h3>
            <p>{copy.servicesNotVerified}</p>
            <div className="toolkit-link-list">
              {serviceTerms.map(({ key, query: term }) => <a key={key} href={mapsSearch(term)} target="_blank" rel="noreferrer">{copy[key]} ↗</a>)}
            </div>
          </article>
          <article className="toolkit-card">
            <span className="section-kicker">{copy.accessConditions}</span>
            <h3>{copy.verifyBeforeTravel}</h3>
            <p>{copy.accessDisclaimer}</p>
            <div className="toolkit-link-list">
              <a href={conditionSearch} target="_blank" rel="noreferrer">{copy.searchLatestAccess} ↗</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Forest department office near ${location.name}, Maharashtra`)}`} target="_blank" rel="noreferrer">{copy.contactLocalAuthority} ↗</a>
            </div>
          </article>
        </div>
      </div>
      <p className="toolkit-disclaimer">{copy.planningDisclaimer}</p>
    </section>
  );
}
