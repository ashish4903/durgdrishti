import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import FortFinder from './components/FortFinder.jsx';
import FortDashboard from './components/FortDashboard.jsx';
import RecommendedForts from './components/RecommendedForts.jsx';
import VisitorProfileForm from './components/VisitorProfileForm.jsx';
import { forts } from './data/forts.js';
import { defaultCopy, loadTranslation } from './data/loadTranslation.js';
import { calculateLocationForecast, slotMultipliers } from './data/forecast.js';
import { fortCatalogue, mappedTrailLocations } from './data/fortCatalogue.js';
import { createContributionUrl, getFortCoverage } from './data/fortDiscovery.js';

// The fort atlas includes the map library, so it is loaded only when its page is opened.
const FortAtlas = lazy(() => import('./components/FortAtlas.jsx'));
const LandmarkToolkit = lazy(() => import('./components/LandmarkToolkit.jsx'));
const visitorProfileKey = 'durgdrishti-visitor-profile-v1';
const profileDismissedKey = 'durgdrishti-profile-setup-dismissed-v1';
const validProfileInterests = new Set(['history', 'architecture', 'openLandscape', 'waterfalls', 'challenging', 'quieter', 'flowers', 'photography']);
const validAgeRanges = new Set(['under18', '18to24', '25to34', '35to44', '45to54', '55plus']);

function readVisitorProfile() {
  try {
    const stored = localStorage.getItem(visitorProfileKey);
    if (!stored) return null;
    const value = JSON.parse(stored);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return {
      name: typeof value.name === 'string' ? value.name.slice(0, 60) : '',
      ageRange: validAgeRanges.has(value.ageRange) ? value.ageRange : '',
      trekCount: Number.isInteger(value.trekCount) ? Math.min(500, Math.max(0, value.trekCount)) : '',
      visitedForts: typeof value.visitedForts === 'string' ? value.visitedForts.slice(0, 240) : '',
      interests: Array.isArray(value.interests) ? [...new Set(value.interests.filter((interest) => validProfileInterests.has(interest)))] : [],
    };
  } catch (error) {
    console.error('Could not read the locally saved visitor profile.', error);
    return null;
  }
}

const languageKey = 'durgdrishti-language-v1';
const supportedLanguages = ['en', 'mr', 'hi'];

// The language chosen on an earlier visit, otherwise the first supported language the browser prefers.
function preferredLanguage() {
  try {
    const saved = localStorage.getItem(languageKey);
    if (supportedLanguages.includes(saved)) return saved;
  } catch {
    // Storage is blocked: fall back to the browser's languages.
  }
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return browserLanguages.map((tag) => String(tag).slice(0, 2).toLowerCase()).find((code) => supportedLanguages.includes(code)) ?? 'en';
}

function saveLanguage(language) {
  try {
    localStorage.setItem(languageKey, language);
  } catch {
    // Storage is blocked: the choice still applies until the page is closed.
  }
}

function shouldShowProfileSetup() {
  try {
    return !readVisitorProfile() && !localStorage.getItem(profileDismissedKey);
  } catch (error) {
    console.error('Could not read visitor profile setup preference.', error);
    return true;
  }
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    mountain: <><path d="m3 20 7-14 4 8 2-4 5 10H3Z" /><path d="m8 10 2 2 2-1" /></>,
    timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6M12 2v3" /></>,
    road: <><path d="M5 22 9 2M19 22 15 2M12 6v3m0 4v3m0 4v1" /></>,
    leaf: <><path d="M20 4c-9 0-15 3-15 10a6 6 0 0 0 6 6c7 0 9-7 9-16Z" /><path d="M5 20c3-5 7-8 12-11" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function App() {
  const [language, setLanguage] = useState('en');
  const [page, setPage] = useState('home');
  const [visitorProfile, setVisitorProfile] = useState(readVisitorProfile);
  const [profileSetupOpen, setProfileSetupOpen] = useState(shouldShowProfileSetup);
  const [profileStorageWarning, setProfileStorageWarning] = useState(false);
  const [selectedCatalogueId, setSelectedCatalogueId] = useState(
    () => fortCatalogue.find((place) => place.forecastId === 'rajgad')?.id ?? fortCatalogue[0]?.id,
  );
  const [fortId, setFortId] = useState('rajgad');
  const [mappedLocationId, setMappedLocationId] = useState(null);
  const [slot, setSlot] = useState('alpine');
  const [surge, setSurge] = useState(false);
  const [pledged, setPledged] = useState(false);
  // Languages already downloaded. The page switches once the chosen language has loaded;
  // if loading fails (e.g. offline), it stays in the current language.
  const [loadedCopy, setLoadedCopy] = useState({ en: defaultCopy });
  const copy = loadedCopy[language] ?? defaultCopy;
  const showLanguage = (next) => {
    if (loadedCopy[next]) {
      setLanguage(next);
      return;
    }
    loadTranslation(next)
      .then((nextCopy) => {
        setLoadedCopy((current) => ({ ...current, [next]: nextCopy }));
        setLanguage(next);
      })
      .catch(() => {});
  };
  // A language the visitor picks is remembered for their next visit.
  const changeLanguage = (next) => {
    saveLanguage(next);
    showLanguage(next);
  };
  // On start, switch to the remembered or browser-preferred language (English is shown meanwhile).
  useEffect(() => {
    const preferred = preferredLanguage();
    if (preferred !== 'en') showLanguage(preferred);
    // Runs once on start; later changes go through changeLanguage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const saveVisitorProfile = (profile) => {
    setVisitorProfile(profile);
    setProfileSetupOpen(false);
    try {
      localStorage.setItem(visitorProfileKey, JSON.stringify(profile));
      localStorage.setItem(profileDismissedKey, 'true');
      setProfileStorageWarning(false);
    } catch (error) {
      console.error('Could not save visitor preferences in browser storage.', error);
      setProfileStorageWarning(true);
    }
  };
  const dismissProfileSetup = () => {
    setProfileSetupOpen(false);
    try {
      localStorage.setItem(profileDismissedKey, 'true');
    } catch (error) {
      console.error('Could not save the visitor profile setup preference.', error);
      setProfileStorageWarning(true);
    }
  };
  const clearVisitorProfile = () => {
    setVisitorProfile(null);
    setProfileSetupOpen(false);
    try {
      localStorage.removeItem(visitorProfileKey);
      localStorage.setItem(profileDismissedKey, 'true');
      setProfileStorageWarning(false);
    } catch (error) {
      console.error('Could not clear the locally saved visitor profile.', error);
      setProfileStorageWarning(true);
    }
  };
  const selectedCataloguePlace = fortCatalogue.find((place) => place.id === selectedCatalogueId);
  const activeMappedLocation = mappedTrailLocations.find((location) => location.id === mappedLocationId);
  const normalizeName = (name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
  const mappedInsightLocation = activeMappedLocation ?? (selectedCataloguePlace
    ? mappedTrailLocations.find((location) => (
      location.feature?.names.some((name) => normalizeName(name) === normalizeName(selectedCataloguePlace.name))
      || normalizeName(location.name ?? '') === normalizeName(selectedCataloguePlace.name)
    ))
    : null);
  const insightLocation = selectedCataloguePlace || mappedInsightLocation
    ? {
      ...mappedInsightLocation,
      ...selectedCataloguePlace,
      id: mappedInsightLocation?.id ?? selectedCataloguePlace?.id,
      name: selectedCataloguePlace?.name ?? mappedInsightLocation?.name,
      coordinates: selectedCataloguePlace?.coordinates ?? mappedInsightLocation?.coordinates,
      feature: mappedInsightLocation?.feature,
    }
    : mappedInsightLocation;
  const insightCoverage = insightLocation ? getFortCoverage(insightLocation) : null;
  const contributionGaps = insightCoverage ? [
    !insightCoverage.hasCoordinates && copy.contributionMissingCoordinates,
    !insightCoverage.hasFortNotes && copy.contributionMissingNotes,
    !insightCoverage.hasCrowdBenchmark && copy.contributionMissingCrowd,
    !insightCoverage.hasDistrict && copy.contributionMissingDistrict,
  ].filter(Boolean) : [];
  const formatMessage = (message, values) => Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    message,
  );
  const selectedLocation = mappedTrailLocations.find((item) => item.id === mappedLocationId);
  const forecastFort = selectedLocation
    ? forts.find((item) => item.id === selectedLocation.forecastId)
    : forts.find((item) => item.id === fortId);
  const fort = selectedLocation
    ? { ...(forecastFort ?? {}), ...selectedLocation }
    : forecastFort ?? forts[0];
  const hasForecast = Boolean(fort.coordinates);
  const hasBenchmarkedForecast = Boolean(forecastFort);
  const alternative = hasBenchmarkedForecast ? forts.find((item) => item.name === forecastFort.alternative) : null;
  const forecast = useMemo(
    () => (hasForecast ? calculateLocationForecast(fort, slot, surge) : null),
    [fort, hasForecast, slot, surge],
  );
  const modelFort = forecast?.profile ?? forecastFort ?? forts[0];
  const alpineLoad = hasForecast ? calculateLocationForecast(fort, 'alpine', surge).activeLoad : null;
  const departureForecasts = hasForecast
    ? ['alpine', 'early', 'peak'].map((window) => ({
      window,
      ...calculateLocationForecast(fort, window, surge),
    }))
    : [];
  const proxyEstimateNote = forecast?.isRegionalProxy
    ? formatMessage(copy.regionalProxyEstimateDisclaimer, {
      fort: forecast.nearestFort.name,
      distance: forecast.proxyDistanceKm.toFixed(1),
    })
    : forecast?.isProxy
      ? formatMessage(copy.proxyEstimateDisclaimer, {
        name: modelFort.name,
        distance: forecast.proxyDistanceKm.toFixed(1),
      })
      : copy.estimateDisclaimer;
  const baseDirectionsCoordinates = forecastFort?.baseCoordinates ?? fort.coordinates;
  const baseDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${baseDirectionsCoordinates[0]},${baseDirectionsCoordinates[1]}`;
  const selectLocation = (value) => {
    const mappedLocation = mappedTrailLocations.find((item) => item.id === value);
    if (mappedLocation) {
      setMappedLocationId(mappedLocation.id);
    } else {
      setMappedLocationId(null);
      setFortId(value);
    }
  };
  const openMappedLocation = (id) => {
    setMappedLocationId(id);
    const mapped = mappedTrailLocations.find((location) => location.id === id);
    const place = mapped && fortCatalogue.find((entry) => (
      mapped.feature?.names.some((name) => normalizeName(name) === normalizeName(entry.name))
      || (entry.coordinates && Math.abs(entry.coordinates[0] - mapped.coordinates[0]) < 0.0001
        && Math.abs(entry.coordinates[1] - mapped.coordinates[1]) < 0.0001)
    ));
    setSelectedCatalogueId(place?.id ?? null);
    if (mapped?.forecastId) setFortId(mapped.forecastId);
    setPage('profile');
  };
  const openFortInsights = (place) => {
    setSelectedCatalogueId(place.id);
    if (place.forecastId) {
      setFortId(place.forecastId);
      setMappedLocationId(null);
    } else {
      const location = mappedTrailLocations.find((item) => (
        item.feature?.names.some((name) => normalizeName(name) === normalizeName(place.name))
        || normalizeName(item.name ?? '') === normalizeName(place.name)
      ));
      setMappedLocationId(location?.id ?? null);
    }
    setPage('profile');
  };
  const placeDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fort.coordinates[0]},${fort.coordinates[1]}`;
  const wikipediaUrl = fort.feature?.wikipedia
    ? (() => {
      const [locale, article] = fort.feature.wikipedia.split(':');
      return `https://${locale}.wikipedia.org/wiki/${encodeURIComponent(article.replaceAll(' ', '_'))}`;
    })()
    : null;

  const formatNumber = (value) => new Intl.NumberFormat(language === 'en' ? 'en-IN' : language === 'mr' ? 'mr-IN' : 'hi-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label={`${copy.brand} home`}>
          <span className="brand-mark"><Icon name="mountain" size={22} /></span>
          <span>{copy.brand}</span>
        </a>
        <div className="topbar-right">
          <span className="topbar-status"><span className="status-dot" />{copy.liveModel}</span>
          <label className="language-select">
            <span className="sr-only">{copy.language}</span>
            <select value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={copy.language}>
              <option value="en">EN</option>
              <option value="mr">मराठी</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
        </div>
      </header>

      <main id="top">
        {page === 'home' && <section className="hero home-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" />{copy.eyebrow}</div>
            <h1>{copy.homeTitle}</h1>
            <p>{copy.homeIntro}</p>
            <div className="hero-stamp"><Icon name="compass" size={16} /><span>{copy.regionStamp}</span><span className="stamp-divider" /><span>{fortCatalogue.length} {copy.indexedForts}</span></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="contour contour-one" /><div className="contour contour-two" /><div className="contour contour-three" />
            <div className="hero-sun" /><div className="hero-ridge ridge-back" /><div className="hero-ridge ridge-front" />
            <span className="hero-coordinate">SAHYADRI · MH</span>
          </div>
        </section>}

        <nav className="tab-bar" aria-label="Main navigation">
          <button type="button" className={page === 'home' ? 'tab active' : 'tab'} onClick={() => setPage('home')}><Icon name="mountain" size={16} />{copy.navHome}</button>
          <button type="button" className={page === 'explore' ? 'tab active' : 'tab'} onClick={() => setPage('explore')}><Icon name="map" size={16} />{copy.navExplorer}</button>
          <button type="button" className={page === 'chooseInsight' || page === 'profile' ? 'tab active' : 'tab'} onClick={() => setPage('chooseInsight')}><Icon name="compass" size={16} />{copy.navInsights}</button>
          <button type="button" className={page === 'dashboard' ? 'tab active' : 'tab'} onClick={() => setPage('dashboard')}><Icon name="road" size={16} />{copy.navDashboard}</button>
          <button type="button" className={page === 'photo' ? 'tab active' : 'tab'} onClick={() => setPage('photo')}><Icon name="shield" size={16} />{copy.navClassifier}</button>
        </nav>

        {page === 'home' && (
          <section className="home-hub">
            <div className="home-section-heading">
              <span className="section-kicker">{copy.homeStartKicker}</span>
              <h2>{copy.homeStartTitle}</h2>
            </div>
            <div className="home-action-grid">
              <button type="button" className="home-action home-action-explore" onClick={() => setPage('explore')}>
                <span className="home-action-icon"><Icon name="map" size={23} /></span>
                <span className="home-action-copy"><strong>{copy.homeExploreTitle}</strong><small>{copy.homeExploreBody}</small></span>
                <Icon name="arrow" size={18} />
              </button>
              <button type="button" className="home-action home-action-insights" onClick={() => setPage('chooseInsight')}>
                <span className="home-action-icon"><Icon name="compass" size={23} /></span>
                <span className="home-action-copy"><strong>{copy.homeInsightsTitle}</strong><small>{copy.homeInsightsBody}</small></span>
                <Icon name="arrow" size={18} />
              </button>
              <button type="button" className="home-action home-action-photo" onClick={() => setPage('photo')}>
                <span className="home-action-icon"><Icon name="shield" size={23} /></span>
                <span className="home-action-copy"><strong>{copy.homePhotoTitle}</strong><small>{copy.homePhotoBody}</small></span>
                <Icon name="arrow" size={18} />
              </button>
            </div>
            <div className="home-profile-actions">
              <span>{visitorProfile?.name ? formatMessage(copy.profileGreeting, { name: visitorProfile.name }) : copy.profileSetupIntro}</span>
              <button type="button" className="profile-edit-button" onClick={() => setProfileSetupOpen(true)}>{visitorProfile ? copy.profileEdit : copy.profileSetupButton}</button>
            </div>
            {profileStorageWarning && <p className="profile-storage-warning" role="status">{copy.profileStorageWarning}</p>}
            <RecommendedForts copy={copy} profile={visitorProfile} onOpenFort={openFortInsights} />
            <details className="home-about">
              <summary>{copy.homeAboutTitle}</summary>
              <p>{copy.homeAboutBody}</p>
            </details>
          </section>
        )}

        {page === 'dashboard' && <FortDashboard copy={copy} language={language} onGetInsights={openFortInsights} />}

        {(page === 'explore' || page === 'chooseInsight') && (
          <>
            <section className="view-heading">
              <span className="section-kicker">{copy.eyebrow}</span>
              <h1>{page === 'explore' ? copy.explorePageTitle : copy.insightsPageTitle}</h1>
              <p>{page === 'explore' ? copy.explorePageIntro : copy.insightsPageIntro}</p>
            </section>
            <Suspense fallback={<div className="mapped-forecast-panel">{copy.atlasLoading}</div>}>
              <FortAtlas
                copy={copy}
                mode={page}
                profile={visitorProfile}
                selectedFortId={forecastFort?.id ?? fortId}
                selectedLocationId={mappedLocationId}
                onPlanLocation={openMappedLocation}
                onGetInsights={openFortInsights}
              />
            </Suspense>
          </>
        )}

        {page === 'profile' && insightLocation && (
          <>
            <section className="profile-heading">
              <button type="button" className="back-link" onClick={() => setPage('chooseInsight')}>← {copy.backToFortSearch}</button>
              <span className="section-kicker">{copy.insightsPageTitle}</span>
              <h1>{insightLocation.name}</h1>
              <p>{[insightLocation.district, insightLocation.coordinates ? copy.mapLocationAvailable : copy.mapSearchAvailable].filter(Boolean).join(' · ')}</p>
              <div className="profile-header-actions">
                <a className="profile-action-primary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${insightLocation.name}${insightLocation.district ? `, ${insightLocation.district}` : ''}, Maharashtra, India`)}`} target="_blank" rel="noreferrer">{copy.openMap} ↗</a>
                {insightLocation.feature?.url && <a className="profile-action-secondary" href={insightLocation.feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature} ↗</a>}
              </div>
            </section>
            <Suspense fallback={<div className="mapped-forecast-panel">{copy.toolkitLoading}</div>}>
              <LandmarkToolkit location={insightLocation} copy={copy} language={language} />
            </Suspense>
            {contributionGaps.length > 0 && (
              <section className="contribution-card">
                <div>
                  <span className="section-kicker">{copy.contributeTitle}</span>
                  <h2>{insightLocation.name}</h2>
                  <p>{copy.contributeIntro}</p>
                  <ul>{contributionGaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
                  <small>{copy.contributionSourcePrompt} {copy.contributionPublicNote}</small>
                </div>
                <a className="profile-action-primary" href={createContributionUrl(insightLocation)} target="_blank" rel="noreferrer">{copy.contributeAction} ↗</a>
              </section>
            )}
            {!insightLocation.coordinates && <div className="mapped-forecast-panel"><Icon name="compass" size={19} /><span>{copy.noForecastForRecord}</span></div>}
            {insightLocation.coordinates && (
              <details className="estimate-details">
                <summary>{copy.openTrailPressureInsights}</summary>
                <p className="estimate-details-intro">{copy.trailPressureInsightsIntro}</p>

          <div className="workspace" id="fort-briefing">
            <section className="briefing-column">
              <div className="section-heading">
                <div><span className="section-kicker">02 / {copy.planKicker}</span><h2>{formatMessage(copy.fortBriefingTitle, { name: fort.name })}</h2><p>{copy.planningSub}</p></div>
                <span className="live-badge"><span className="status-dot" />{copy.localBadge}</span>
              </div>

              <div className="control-panel">
                <div className="field-label departure-label">{copy.departure}<span className="field-meta">{copy.arrivalModel}</span></div>
                <div className="slot-options" role="radiogroup" aria-label={copy.departure}>
                  {['alpine', 'early', 'peak'].map((key, index) => (
                    <button type="button" role="radio" aria-checked={slot === key} key={key} className={`slot-card ${slot === key ? 'selected' : ''}`} onClick={() => setSlot(key)}>
                      <span className="slot-icon">{index === 0 ? '✳' : index === 1 ? '◷' : '↗'}</span>
                      <span className="slot-name">{copy[key]}</span>
                      <span className="slot-time">{copy[`${key}Time`]}</span>
                      <span className="slot-factor">{slotMultipliers[key].toFixed(2)}×</span>
                    </button>
                  ))}
                </div>
                <button type="button" role="switch" aria-checked={surge} className={`surge-toggle ${surge ? 'is-on' : ''}`} onClick={() => setSurge(!surge)}>
                  <span className="surge-icon">☼</span><span className="surge-copy"><strong>{copy.surge}</strong><small>{copy.surgeSub}</small></span><span className="toggle-track"><span /></span>
                </button>
              </div>

              {hasForecast ? (
                <>
              <div className="kpi-grid">
                <article className="kpi-card kpi-load">
                  <div className="kpi-top"><span className="kpi-icon"><Icon name="mountain" /></span><span className="kpi-index">01</span></div>
                  <span className="kpi-label">{copy.activeLoad}</span>
                  <strong className="kpi-value">{formatNumber(forecast.activeLoad)}</strong>
                  <span className="kpi-unit">{copy.trekkers}</span>
                  <div className="kpi-foot"><span>{copy.loadNote}</span></div>
                </article>
                <article className="kpi-card kpi-wait">
                  <div className="kpi-top"><span className="kpi-icon"><Icon name="timer" /></span><span className="kpi-index">02</span></div>
                  <span className="kpi-label">{copy.chokeWait}</span>
                  <strong className="kpi-value">{formatNumber(forecast.queueDelay)}<small> {copy.minutesShort}</small></strong>
                  <span className="kpi-unit">{hasBenchmarkedForecast ? fort.chokeName : copy.proxyChokeLabel}</span>
                  <div className="kpi-foot"><span>{copy.chokeNote} {hasBenchmarkedForecast ? fort.chokeName : copy.proxyChokeLabel}</span></div>
                </article>
                <article className="kpi-card kpi-road">
                  <div className="kpi-top"><span className="kpi-icon"><Icon name="road" /></span><span className="kpi-index">03</span></div>
                  <span className="kpi-label">{copy.baseDelay}</span>
                  <strong className="kpi-value">{formatNumber(forecast.baseDelay)}<small> {copy.minutesShort}</small></strong>
                  <span className="kpi-unit">{hasBenchmarkedForecast ? `${fort.baseVillage} · ` : ''}{Math.round(forecast.parkingPercent)}% {copy.parkingSaturation}</span>
                  <div className="kpi-foot"><span>{hasBenchmarkedForecast ? `${copy.baseNote} ${fort.baseVillage}` : copy.proxyRoadLabel}</span></div>
                </article>
                <article className="kpi-card kpi-waste">
                  <div className="kpi-top"><span className="kpi-icon"><Icon name="leaf" /></span><span className="kpi-index">04</span></div>
                  <span className="kpi-label">{copy.waste}</span>
                  <strong className="kpi-value">{formatNumber(forecast.wasteLoad)}<small> kg</small></strong>
                  <span className="kpi-unit">{hasBenchmarkedForecast
                    ? `${formatNumber(forecast.wasteDeficit)}% ${copy.overCapacity}`
                    : copy.proxyCapacityUnknown}</span>
                  <div className="kpi-foot"><span>{copy.wasteNote}</span></div>
                </article>
              </div>

              <div className="departure-comparison">
                <div className="departure-comparison-heading">
                  <div><span className="section-kicker">{copy.departureComparisonKicker}</span><h3>{copy.departureComparisonTitle}</h3></div>
                  <span>{copy.surge}{surge ? ' · ×1.40' : ' · ×1.00'}</span>
                </div>
                <div className="departure-table-wrap">
                  <table className="departure-table">
                    <thead><tr><th>{copy.departureWindow}</th><th>{copy.activeLoad}</th><th>{copy.chokeWait}</th><th>{copy.baseDelay}</th><th>{copy.waste}</th></tr></thead>
                    <tbody>{departureForecasts.map((row) => (
                      <tr key={row.window} className={row.window === slot ? 'departure-row-selected' : ''}>
                        <th scope="row">{copy[row.window]}<small>{copy[`${row.window}Time`]}</small></th>
                        <td>{formatNumber(row.activeLoad)}</td>
                        <td>{formatNumber(row.queueDelay)} {copy.minutesShort}</td>
                        <td>{formatNumber(row.baseDelay)} {copy.minutesShort}</td>
                        <td>{formatNumber(row.wasteLoad)} kg</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              <div className="estimate-note"><span className="note-mark">i</span>{proxyEstimateNote}</div>
                </>
              ) : (
                <div className="mapped-forecast-panel">
                  <Icon name="compass" size={19} />
                  <span>{copy.noMappedForecast}</span>
                </div>
              )}
            </section>

            <aside className="insights-column">
              {hasBenchmarkedForecast ? (
                <>
              <article className="insight-card action-card">
                <div className="insight-topline"><span className="insight-icon"><Icon name="timer" size={17} /></span><span>{copy.recommendation}</span><span className="insight-number">01</span></div>
                <h3>{slot === 'alpine' ? copy.alpinePlanTitle : copy.alpineNudgeTitle}</h3>
                <p>{slot === 'alpine'
                  ? copy.alpinePlanBody
                  : formatMessage(copy.alpineNudgeBody, {
                    current: formatNumber(forecast.activeLoad),
                    alpine: formatNumber(alpineLoad),
                    reduction: formatNumber((1 - alpineLoad / forecast.activeLoad) * 100),
                  })}</p>
                {slot === 'alpine'
                  ? <a className="action-link" href={baseDirectionsUrl} target="_blank" rel="noreferrer">{formatMessage(copy.baseDirectionsAction, { village: fort.baseVillage })}<Icon name="arrow" size={15} /></a>
                  : <button type="button" className="action-link action-button" onClick={() => setSlot('alpine')}>{copy.alpineNudgeAction}<Icon name="arrow" size={15} /></button>}
              </article>

              <article className="insight-card action-card">
                <div className="insight-topline"><span className="insight-icon"><Icon name="road" size={17} /></span><span>{copy.parking}</span><span className="insight-number">02</span></div>
                <h3>{forecast.parkingPercent >= 100 ? copy.parkingOverTitle : copy.parkingWithinTitle}</h3>
                <p>{formatMessage(forecast.parkingPercent >= 100 ? copy.parkingOverBody : copy.parkingWithinBody, {
                  percent: formatNumber(forecast.parkingPercent),
                  remaining: formatNumber(Math.max(0, fort.parkingCapacity - Math.ceil(forecast.activeLoad * 0.32))),
                })}</p>
                <a className="action-link" href={baseDirectionsUrl} target="_blank" rel="noreferrer">{formatMessage(copy.baseDirectionsAction, { village: fort.baseVillage })}<Icon name="arrow" size={15} /></a>
              </article>

              <article className="insight-card action-card">
                <div className="insight-topline"><span className="insight-icon"><Icon name="leaf" size={17} /></span><span>{copy.wasteAction}</span><span className="insight-number">03</span></div>
                <h3>{copy.wasteActionTitle}</h3>
                <p>{formatMessage(copy.wasteActionBody, { amount: formatNumber(forecast.wasteLoad) })}</p>
                <button type="button" className={`pledge-button ${pledged ? 'pledge-confirmed' : ''}`} onClick={() => setPledged(true)} disabled={pledged}>
                  {pledged ? <><Icon name="check" size={15} />{copy.pledgeConfirmed}</> : copy.pledgeAction}
                </button>
              </article>

              <article className="insight-card anatomy-card">
                <div className="insight-topline"><span className="insight-icon"><Icon name="shield" size={17} /></span><span>{copy.anatomy}</span><span className="insight-number">04</span></div>
                <h3>{copy.anatomyTitle}</h3><p>{copy.anatomyBody}</p>
                <div className="anatomy-tags">{fort.anatomy.map((item) => <span key={item}>{copy[item]}</span>)}</div>
              </article>

              <article className="insight-card fort-about-card">
                <div className="insight-topline"><span className="insight-icon"><Icon name="compass" size={17} /></span><span>{copy.fortAboutKicker}</span><span className="insight-number">05</span></div>
                <h3>{formatMessage(copy.fortAboutTitle, { name: fort.name })}</h3>
                <p>{copy[fort.aboutKey]}</p>
                <dl className="fort-about-facts">
                  <div><dt>{copy.fortAboutElevation}</dt><dd>{formatNumber(fort.elevation)} m</dd></div>
                  <div><dt>{copy.fortAboutBase}</dt><dd>{fort.baseVillage}</dd></div>
                  <div><dt>{copy.fortAboutChoke}</dt><dd>{fort.chokeName}</dd></div>
                </dl>
                <a className="action-link" href={baseDirectionsUrl} target="_blank" rel="noreferrer">{formatMessage(copy.baseDirectionsAction, { village: fort.baseVillage })}<Icon name="arrow" size={15} /></a>
              </article>

              <article className="alternative-card">
                <div className="alternative-mark"><Icon name="leaf" size={20} /></div>
                <div className="alternative-content"><span className="alternative-kicker">{copy.alternative}</span><h3>{alternative ? copy.alternativeTitle.replace('{name}', alternative.name) : copy.noAlternatives}</h3><p>{copy.alternativeBody}</p>
                  {alternative && <button type="button" className="alternative-link alternative-compare" onClick={() => selectLocation(alternative.id)}>{copy.compareAlternative}<Icon name="arrow" size={16} /></button>}
                </div>
              </article>
                </>
              ) : (
                <>
                  <article className="insight-card action-card">
                    <div className="insight-topline"><span className="insight-icon"><Icon name="timer" size={17} /></span><span>{copy.recommendation}</span><span className="insight-number">01</span></div>
                    <h3>{copy.proxyRecommendationTitle}</h3>
                    <p>{formatMessage(copy.proxyRecommendationBody, { source: modelFort.name, load: formatNumber(alpineLoad), current: formatNumber(forecast.activeLoad) })}</p>
                    {slot !== 'alpine' && <button type="button" className="action-link action-button" onClick={() => setSlot('alpine')}>{copy.alpineNudgeAction}<Icon name="arrow" size={15} /></button>}
                    <a className="action-link" href={placeDirectionsUrl} target="_blank" rel="noreferrer">{copy.navigateToLandmark}<Icon name="arrow" size={15} /></a>
                  </article>
                  <article className="insight-card action-card">
                    <div className="insight-topline"><span className="insight-icon"><Icon name="road" size={17} /></span><span>{copy.parking}</span><span className="insight-number">02</span></div>
                    <h3>{copy.proxyRoadTitle}</h3>
                    <p>{formatMessage(copy.proxyRoadBody, { percent: formatNumber(forecast.parkingPercent), delay: formatNumber(forecast.baseDelay) })}</p>
                    <a className="action-link" href={`https://www.google.com/maps/search/?api=1&query=${fort.coordinates[0]},${fort.coordinates[1]}`} target="_blank" rel="noreferrer">{copy.verifyLocalAccess}<Icon name="arrow" size={15} /></a>
                  </article>
                  <article className="insight-card action-card">
                    <div className="insight-topline"><span className="insight-icon"><Icon name="leaf" size={17} /></span><span>{copy.wasteAction}</span><span className="insight-number">03</span></div>
                    <h3>{copy.wasteActionTitle}</h3>
                    <p>{formatMessage(copy.proxyWasteBody, { amount: formatNumber(forecast.wasteLoad) })}</p>
                    <button type="button" className={`pledge-button ${pledged ? 'pledge-confirmed' : ''}`} onClick={() => setPledged(true)} disabled={pledged}>
                      {pledged ? <><Icon name="check" size={15} />{copy.pledgeConfirmed}</> : copy.pledgeAction}
                    </button>
                  </article>
                  <article className="insight-card action-card mapped-detail-card">
                    <div className="insight-topline"><span className="insight-icon"><Icon name="compass" size={17} /></span><span>{copy.mappedLocationDetails}</span></div>
                    <h3>{fort.name}</h3>
                    <p>{copy.mappedLocationDescription}</p>
                    <dl className="fort-about-facts">
                      <div><dt>{copy.mappedFeatureType}</dt><dd>{fort.feature?.historic ?? copy.publicIndexLocation}</dd></div>
                      <div><dt>{copy.mappedCoordinates}</dt><dd>{fort.coordinates.map((value) => value.toFixed(5)).join(', ')}</dd></div>
                      {fort.feature?.type && <div><dt>{copy.mapFeatureKind}</dt><dd>{fort.feature.type}</dd></div>}
                    </dl>
                    <a className="action-link" href={placeDirectionsUrl} target="_blank" rel="noreferrer">{copy.navigateToLandmark}<Icon name="arrow" size={15} /></a>
                    {fort.feature && <a className="action-link" href={fort.feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature}<Icon name="arrow" size={15} /></a>}
                    {wikipediaUrl && <a className="action-link" href={wikipediaUrl} target="_blank" rel="noreferrer">{copy.readLandmarkReference}<Icon name="arrow" size={15} /></a>}
                    {fort.feature?.wikidata && <a className="action-link" href={`https://www.wikidata.org/wiki/${fort.feature.wikidata}`} target="_blank" rel="noreferrer">{copy.wikidataRecord}<Icon name="arrow" size={15} /></a>}
                  </article>
                </>
              )}
            </aside>
          </div>
          </details>
            )}
          </>
        )}

        {page === 'photo' && <FortFinder copy={copy} />}
      </main>

      {profileSetupOpen && <VisitorProfileForm
        key={profileSetupOpen ? 'profile-open' : 'profile-closed'}
        copy={copy}
        profile={visitorProfile}
        onSave={saveVisitorProfile}
        onDismiss={dismissProfileSetup}
        onClear={visitorProfile ? clearVisitorProfile : null}
        storageWarning={profileStorageWarning}
      />}

      <footer className="footer"><a className="footer-brand" href="#top"><span className="brand-mark"><Icon name="mountain" size={17} /></span>{copy.brand}</a><span>{copy.footer}</span><span className="footer-credit">{copy.footerCredit}</span></footer>
    </div>
  );
}

export default App;
