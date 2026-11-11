import { getFortCoverage, getRecommendedForts, getUnsupportedInterests } from '../data/fortDiscovery.js';
import { forts } from '../data/forts.js';

function formatMessage(message, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

export default function RecommendedForts({ copy, profile, onOpenFort, compact = false }) {
  const recommendations = getRecommendedForts(profile);
  const unsupportedInterests = getUnsupportedInterests(profile);
  const allVisited = recommendations.every((entry) => entry.alreadyVisited);

  return (
    <section className={`recommended-forts ${compact ? 'recommended-forts-compact' : ''}`}>
      <div className="recommended-heading">
        <div>
          <span className="section-kicker">{copy.profileRecommendationsTitle}</span>
          {profile?.name && <h2>{formatMessage(copy.profileGreeting, { name: profile.name })}</h2>}
          <p>{copy.profileRecommendationsIntro}</p>
          {profile?.trekCount !== undefined && profile?.trekCount !== '' && (
            <p className="recommendation-experience">
              {Number(profile.trekCount) === 0
                ? copy.profileFirstTrekContext
                : formatMessage(copy.profileTrekCountContext, { count: profile.trekCount })}
            </p>
          )}
        </div>
      </div>
      {unsupportedInterests.length > 0 && (
        <p className="recommendation-note">
          {formatMessage(copy.profileUnsupportedInterests, {
            interests: unsupportedInterests.map((interest) => copy[`interest${interest[0].toUpperCase()}${interest.slice(1)}`]).join(', '),
          })}
        </p>
      )}
      {allVisited && profile?.visitedForts && <p className="recommendation-note">{copy.profileAllVisited}</p>}
      <div className="recommended-card-grid">
        {recommendations.map(({ place, matchingInterest }) => {
          const coverage = getFortCoverage(place);
          const fort = forts.find((entry) => entry.id === place.forecastId);
          const reason = matchingInterest
            ? formatMessage(copy.profileRecommendationReason, { interest: copy[`interest${matchingInterest[0].toUpperCase()}${matchingInterest.slice(1)}`] })
            : copy.profileBestDocumentedReason;
          return (
            <article className="recommended-card" key={place.id}>
              <div className="recommended-card-meta">
                <span>{copy.profileCoverage.replace('{count}', coverage.availableCount).replace('{total}', coverage.totalCount)}</span>
                <span>{fort?.cluster ?? place.district ?? copy.mapLocationAvailable}</span>
              </div>
              <h3>{place.name}</h3>
              <ul className="recommended-coverage-tags">
                {coverage.hasCoordinates && <li>{copy.coverageCoordinates}</li>}
                {coverage.hasFortNotes && <li>{copy.coverageNotes}</li>}
                {coverage.hasCrowdBenchmark && <li>{copy.coverageCrowdBenchmark}</li>}
              </ul>
              <p>{reason}</p>
              <p className="recommended-card-summary">{fort?.aboutKey ? copy[fort.aboutKey] : ''}</p>
              <button type="button" className="atlas-place-action" onClick={() => onOpenFort(place)}>{copy.getInsights}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
