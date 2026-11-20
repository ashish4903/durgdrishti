import { lazy, Suspense } from 'react';

// The fort atlas includes the map library, so it is loaded only when its page is opened.
const FortAtlas = lazy(() => import('../components/FortAtlas.jsx'));

/**
 * The fort atlas, used by two tabs: "explore" (browse every fort on the map) and "insights"
 * (pick a fort to read about). FortAtlas still calls the second mode "chooseInsight".
 */
export default function AtlasPage({ copy, page, visitorProfile, selection, onPlanLocation, onGetInsights }) {
  const isExplore = page === 'explore';
  return (
    <>
      <section className="view-heading">
        <span className="section-kicker">{copy.eyebrow}</span>
        <h1>{isExplore ? copy.explorePageTitle : copy.insightsPageTitle}</h1>
        <p>{isExplore ? copy.explorePageIntro : copy.insightsPageIntro}</p>
      </section>
      <Suspense fallback={<div className="mapped-forecast-panel">{copy.atlasLoading}</div>}>
        <FortAtlas
          copy={copy}
          mode={isExplore ? 'explore' : 'chooseInsight'}
          profile={visitorProfile}
          selectedFortId={selection.selectedFortId}
          selectedLocationId={selection.mappedLocationId}
          onPlanLocation={onPlanLocation}
          onGetInsights={onGetInsights}
        />
      </Suspense>
    </>
  );
}
