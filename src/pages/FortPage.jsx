import { lazy, Suspense } from 'react';
import Icon from '../components/Icon.jsx';
import TrailBriefing from '../components/TrailBriefing.jsx';
import { createContributionUrl, getFortCoverage } from '../data/fortDiscovery.js';
import { formatRoute } from '../lib/route.js';

const LandmarkToolkit = lazy(() => import('../components/LandmarkToolkit.jsx'));

const mapsSearchUrl = (location) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${location.name}${location.district ? `, ${location.district}` : ''}, Maharashtra, India`,
)}`;

/** One fort's page (#/fort/… or #/place/…): details, history and weather, and the trail briefing. */
export default function FortPage({ copy, language, location, selection, planner, onCompareAlternative }) {
  const coverage = getFortCoverage(location);
  const contributionGaps = [
    !coverage.hasCoordinates && copy.contributionMissingCoordinates,
    !coverage.hasFortNotes && copy.contributionMissingNotes,
    !coverage.hasCrowdBenchmark && copy.contributionMissingCrowd,
    !coverage.hasDistrict && copy.contributionMissingDistrict,
  ].filter(Boolean);

  return (
    <>
      <section className="profile-heading">
        <a className="back-link" href={formatRoute({ page: 'insights' })}>← {copy.backToFortSearch}</a>
        <span className="section-kicker">{copy.insightsPageTitle}</span>
        <h1>{location.name}</h1>
        <p>{[location.district, location.coordinates ? copy.mapLocationAvailable : copy.mapSearchAvailable].filter(Boolean).join(' · ')}</p>
        <div className="profile-header-actions">
          <a className="profile-action-primary" href={mapsSearchUrl(location)} target="_blank" rel="noreferrer">{copy.openMap} ↗</a>
          {location.feature?.url && <a className="profile-action-secondary" href={location.feature.url} target="_blank" rel="noreferrer">{copy.openOsmFeature} ↗</a>}
        </div>
      </section>
      <Suspense fallback={<div className="mapped-forecast-panel">{copy.toolkitLoading}</div>}>
        <LandmarkToolkit location={location} copy={copy} language={language} />
      </Suspense>
      {contributionGaps.length > 0 && (
        <section className="contribution-card">
          <div>
            <span className="section-kicker">{copy.contributeTitle}</span>
            <h2>{location.name}</h2>
            <p>{copy.contributeIntro}</p>
            <ul>{contributionGaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
            <small>{copy.contributionSourcePrompt} {copy.contributionPublicNote}</small>
          </div>
          <a className="profile-action-primary" href={createContributionUrl(location)} target="_blank" rel="noreferrer">{copy.contributeAction} ↗</a>
        </section>
      )}
      {!location.coordinates && <div className="mapped-forecast-panel"><Icon name="compass" size={19} /><span>{copy.noForecastForRecord}</span></div>}
      {location.coordinates && (
        <details className="estimate-details">
          <summary>{copy.openTrailPressureInsights}</summary>
          <p className="estimate-details-intro">{copy.trailPressureInsightsIntro}</p>
          <TrailBriefing
            copy={copy}
            language={language}
            fortId={selection.fortId}
            mappedLocationId={selection.mappedLocationId}
            planner={planner}
            onCompareAlternative={onCompareAlternative}
          />
        </details>
      )}
    </>
  );
}
