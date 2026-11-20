import Icon from './Icon.jsx';
import { forts } from '../data/forts.js';
import { formatMessage } from '../lib/format.js';

const directionsUrl = ([lat, lon]) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

function wikipediaUrlFor(feature) {
  if (!feature?.wikipedia) return null;
  const [locale, article] = feature.wikipedia.split(':');
  return `https://${locale}.wikipedia.org/wiki/${encodeURIComponent(article.replaceAll(' ', '_'))}`;
}

function InsightTopline({ icon, label, number }) {
  return (
    <div className="insight-topline">
      <span className="insight-icon"><Icon name={icon} size={17} /></span><span>{label}</span>
      {number && <span className="insight-number">{number}</span>}
    </div>
  );
}

function PledgeButton({ copy, pledged, onPledge }) {
  return (
    <button type="button" className={`pledge-button ${pledged ? 'pledge-confirmed' : ''}`} onClick={onPledge} disabled={pledged}>
      {pledged ? <><Icon name="check" size={15} />{copy.pledgeConfirmed}</> : copy.pledgeAction}
    </button>
  );
}

/** Cards for one of the seven benchmarked forts, with its own crowd and parking figures. */
function BenchmarkedInsights({ copy, fort, forecast, forecastFort, alpineLoad, formatNumber, planner, onCompareAlternative }) {
  const { slot, setSlot, pledged, setPledged } = planner;
  const baseDirectionsUrl = directionsUrl(forecastFort.baseCoordinates ?? fort.coordinates);
  const baseDirections = (
    <a className="action-link" href={baseDirectionsUrl} target="_blank" rel="noreferrer">{formatMessage(copy.baseDirectionsAction, { village: fort.baseVillage })}<Icon name="arrow" size={15} /></a>
  );
  const alternative = forts.find((item) => item.name === forecastFort.alternative);

  return (
    <>
      <article className="insight-card action-card">
        <InsightTopline icon="timer" label={copy.recommendation} number="01" />
        <h3>{slot === 'alpine' ? copy.alpinePlanTitle : copy.alpineNudgeTitle}</h3>
        <p>{slot === 'alpine'
          ? copy.alpinePlanBody
          : formatMessage(copy.alpineNudgeBody, {
            current: formatNumber(forecast.activeLoad),
            alpine: formatNumber(alpineLoad),
            reduction: formatNumber((1 - alpineLoad / forecast.activeLoad) * 100),
          })}</p>
        {slot === 'alpine'
          ? baseDirections
          : <button type="button" className="action-link action-button" onClick={() => setSlot('alpine')}>{copy.alpineNudgeAction}<Icon name="arrow" size={15} /></button>}
      </article>

      <article className="insight-card action-card">
        <InsightTopline icon="road" label={copy.parking} number="02" />
        <h3>{forecast.parkingPercent >= 100 ? copy.parkingOverTitle : copy.parkingWithinTitle}</h3>
        <p>{formatMessage(forecast.parkingPercent >= 100 ? copy.parkingOverBody : copy.parkingWithinBody, {
          percent: formatNumber(forecast.parkingPercent),
          remaining: formatNumber(Math.max(0, fort.parkingCapacity - Math.ceil(forecast.activeLoad * 0.32))),
        })}</p>
        {baseDirections}
      </article>

      <article className="insight-card action-card">
        <InsightTopline icon="leaf" label={copy.wasteAction} number="03" />
        <h3>{copy.wasteActionTitle}</h3>
        <p>{formatMessage(copy.wasteActionBody, { amount: formatNumber(forecast.wasteLoad) })}</p>
        <PledgeButton copy={copy} pledged={pledged} onPledge={() => setPledged(true)} />
      </article>

      <article className="insight-card anatomy-card">
        <InsightTopline icon="shield" label={copy.anatomy} number="04" />
        <h3>{copy.anatomyTitle}</h3><p>{copy.anatomyBody}</p>
        <div className="anatomy-tags">{fort.anatomy.map((item) => <span key={item}>{copy[item]}</span>)}</div>
      </article>

      <article className="insight-card fort-about-card">
        <InsightTopline icon="compass" label={copy.fortAboutKicker} number="05" />
        <h3>{formatMessage(copy.fortAboutTitle, { name: fort.name })}</h3>
        <p>{copy[fort.aboutKey]}</p>
        <dl className="fort-about-facts">
          <div><dt>{copy.fortAboutElevation}</dt><dd>{formatNumber(fort.elevation)} m</dd></div>
          <div><dt>{copy.fortAboutBase}</dt><dd>{fort.baseVillage}</dd></div>
          <div><dt>{copy.fortAboutChoke}</dt><dd>{fort.chokeName}</dd></div>
        </dl>
        {baseDirections}
      </article>

      <article className="alternative-card">
        <div className="alternative-mark"><Icon name="leaf" size={20} /></div>
        <div className="alternative-content"><span className="alternative-kicker">{copy.alternative}</span><h3>{alternative ? copy.alternativeTitle.replace('{name}', alternative.name) : copy.noAlternatives}</h3><p>{copy.alternativeBody}</p>
          {alternative && <button type="button" className="alternative-link alternative-compare" onClick={() => onCompareAlternative(alternative.id)}>{copy.compareAlternative}<Icon name="arrow" size={16} /></button>}
        </div>
      </article>
    </>
  );
}

/** Cards for any other mapped fort, whose figures are borrowed from the nearest benchmarked fort. */
function ProxyInsights({ copy, fort, forecast, modelFort, alpineLoad, formatNumber, planner }) {
  const { slot, setSlot, pledged, setPledged } = planner;
  const placeDirectionsUrl = directionsUrl(fort.coordinates);
  const wikipediaUrl = wikipediaUrlFor(fort.feature);

  return (
    <>
      <article className="insight-card action-card">
        <InsightTopline icon="timer" label={copy.recommendation} number="01" />
        <h3>{copy.proxyRecommendationTitle}</h3>
        <p>{formatMessage(copy.proxyRecommendationBody, { source: modelFort.name, load: formatNumber(alpineLoad), current: formatNumber(forecast.activeLoad) })}</p>
        {slot !== 'alpine' && <button type="button" className="action-link action-button" onClick={() => setSlot('alpine')}>{copy.alpineNudgeAction}<Icon name="arrow" size={15} /></button>}
        <a className="action-link" href={placeDirectionsUrl} target="_blank" rel="noreferrer">{copy.navigateToLandmark}<Icon name="arrow" size={15} /></a>
      </article>
      <article className="insight-card action-card">
        <InsightTopline icon="road" label={copy.parking} number="02" />
        <h3>{copy.proxyRoadTitle}</h3>
        <p>{formatMessage(copy.proxyRoadBody, { percent: formatNumber(forecast.parkingPercent), delay: formatNumber(forecast.baseDelay) })}</p>
        <a className="action-link" href={`https://www.google.com/maps/search/?api=1&query=${fort.coordinates[0]},${fort.coordinates[1]}`} target="_blank" rel="noreferrer">{copy.verifyLocalAccess}<Icon name="arrow" size={15} /></a>
      </article>
      <article className="insight-card action-card">
        <InsightTopline icon="leaf" label={copy.wasteAction} number="03" />
        <h3>{copy.wasteActionTitle}</h3>
        <p>{formatMessage(copy.proxyWasteBody, { amount: formatNumber(forecast.wasteLoad) })}</p>
        <PledgeButton copy={copy} pledged={pledged} onPledge={() => setPledged(true)} />
      </article>
      <article className="insight-card action-card mapped-detail-card">
        <InsightTopline icon="compass" label={copy.mappedLocationDetails} />
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
  );
}

/** The insight cards beside the trail briefing. */
export default function TrailInsights(props) {
  return (
    <aside className="insights-column">
      {props.forecastFort ? <BenchmarkedInsights {...props} /> : <ProxyInsights {...props} />}
    </aside>
  );
}
