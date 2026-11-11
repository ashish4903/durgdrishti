import { useMemo, useState } from 'react';
import { fortCatalogue } from '../data/fortCatalogue.js';
import { getBenchmarkHotspots, getDistrictCounts } from '../data/fortDiscovery.js';

export default function FortDashboard({ copy, language, onGetInsights }) {
  const [slot, setSlot] = useState('peak');
  const districts = useMemo(() => getDistrictCounts(), []);
  const hotspots = useMemo(() => getBenchmarkHotspots(slot), [slot]);
  const maxDistrictCount = districts[0]?.count ?? 1;
  const maxHotspotLoad = hotspots[0]?.forecast.activeLoad ?? 1;
  const numberFormat = new Intl.NumberFormat(
    language === 'en' ? 'en-IN' : language === 'mr' ? 'mr-IN' : 'hi-IN',
    { maximumFractionDigits: 0 },
  );

  return (
    <section className="fort-dashboard">
      <header className="dashboard-heading">
        <span className="section-kicker">{copy.navDashboard}</span>
        <h1>{copy.dashboardTitle}</h1>
        <p>{copy.dashboardIntro}</p>
      </header>
      <div className="dashboard-grid">
        <section className="dashboard-panel district-panel">
          <div className="dashboard-panel-heading">
            <div><span className="section-kicker">{copy.districtRollupTitle}</span><p>{copy.districtRecordsNote}</p></div>
            <strong>{districts.length}<small>{copy.districtCountLabel}</small></strong>
          </div>
          <div className="district-chart">
            {districts.map(({ district, count }) => (
              <div className="district-row" key={district}>
                <span>{district}</span>
                <div className="dashboard-track" aria-hidden="true"><i style={{ width: `${(count / maxDistrictCount) * 100}%` }} /></div>
                <strong>{numberFormat.format(count)}</strong>
              </div>
            ))}
            {!districts.length && <p className="dashboard-empty">{copy.noDistrictData}</p>}
          </div>
          <p className="dashboard-panel-foot">{numberFormat.format(fortCatalogue.length)} {copy.indexedForts}</p>
        </section>

        <section className="dashboard-panel hotspot-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="section-kicker">{copy.modeledHotspotsTitle}</span>
              <p>{copy.modeledHotspotsIntro}</p>
            </div>
            <label className="dashboard-window-select">
              <span>{copy.hotspotWindowLabel}</span>
              <select value={slot} onChange={(event) => setSlot(event.target.value)} aria-label={copy.hotspotWindowLabel}>
                {['alpine', 'early', 'peak'].map((window) => <option value={window} key={window}>{copy[window]}</option>)}
              </select>
            </label>
          </div>
          <div className="hotspot-list">
            {hotspots.map(({ fort, forecast }, index) => {
              const place = fortCatalogue.find((entry) => entry.forecastId === fort.id);
              return (
                <button type="button" className="hotspot-row" key={fort.id} onClick={() => place && onGetInsights(place)}>
                  <span className="hotspot-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="hotspot-info"><strong>{fort.name}</strong><small>{copy.modeledLoadLabel}</small></span>
                  <span className="hotspot-bar dashboard-track" aria-hidden="true"><i style={{ width: `${Math.min(100, (forecast.activeLoad / maxHotspotLoad) * 100)}%` }} /></span>
                  <strong className="hotspot-value">{numberFormat.format(forecast.activeLoad)}</strong>
                  <span className="hotspot-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
          <p className="dashboard-panel-foot">{copy.hotspotRank} · {copy.modeledLoadLabel}</p>
        </section>
      </div>
    </section>
  );
}
