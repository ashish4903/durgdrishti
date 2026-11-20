import { useMemo } from 'react';
import Icon from './Icon.jsx';
import TrailInsights from './TrailInsights.jsx';
import { forts } from '../data/forts.js';
import { mappedTrailLocations } from '../data/fortCatalogue.js';
import { calculateLocationForecast, slotMultipliers } from '../data/forecast.js';
import { createNumberFormatter, formatMessage } from '../lib/format.js';

const windows = ['alpine', 'early', 'peak'];

/**
 * The crowd-planning estimate for one fort: departure window, weekend surge, the four figures,
 * a comparison of the three windows, and the insight cards beside them.
 */
export default function TrailBriefing({ copy, language, fortId, mappedLocationId, planner, onCompareAlternative }) {
  const { slot, setSlot, surge, setSurge } = planner;
  const formatNumber = createNumberFormatter(language);

  const selectedLocation = mappedTrailLocations.find((item) => item.id === mappedLocationId);
  const forecastFort = selectedLocation
    ? forts.find((item) => item.id === selectedLocation.forecastId)
    : forts.find((item) => item.id === fortId);
  const fort = useMemo(
    () => (selectedLocation ? { ...(forecastFort ?? {}), ...selectedLocation } : forecastFort ?? forts[0]),
    [selectedLocation, forecastFort],
  );
  const hasForecast = Boolean(fort.coordinates);
  const hasBenchmarkedForecast = Boolean(forecastFort);
  const forecast = useMemo(
    () => (hasForecast ? calculateLocationForecast(fort, slot, surge) : null),
    [fort, hasForecast, slot, surge],
  );
  const modelFort = forecast?.profile ?? forecastFort ?? forts[0];
  const alpineLoad = hasForecast ? calculateLocationForecast(fort, 'alpine', surge).activeLoad : null;
  const departureForecasts = hasForecast
    ? windows.map((window) => ({ window, ...calculateLocationForecast(fort, window, surge) }))
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

  return (
    <div className="workspace" id="fort-briefing">
      <section className="briefing-column">
        <div className="section-heading">
          <div><span className="section-kicker">02 / {copy.planKicker}</span><h2>{formatMessage(copy.fortBriefingTitle, { name: fort.name })}</h2><p>{copy.planningSub}</p></div>
          <span className="live-badge"><span className="status-dot" />{copy.localBadge}</span>
        </div>

        <div className="control-panel">
          <div className="field-label departure-label">{copy.departure}<span className="field-meta">{copy.arrivalModel}</span></div>
          <div className="slot-options" role="radiogroup" aria-label={copy.departure}>
            {windows.map((key, index) => (
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

      <TrailInsights
        copy={copy}
        fort={fort}
        forecast={forecast}
        forecastFort={forecastFort}
        modelFort={modelFort}
        alpineLoad={alpineLoad}
        formatNumber={formatNumber}
        planner={planner}
        onCompareAlternative={onCompareAlternative}
      />
    </div>
  );
}
