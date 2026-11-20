import CrowdChip from './CrowdChip.jsx';
import { bestWindow, busiestWindow, windowForecasts } from '../lib/crowd.js';
import { createNumberFormatter, formatMessage } from '../lib/format.js';

/**
 * The answer most visitors come for, shown without opening anything: when to start, how
 * crowded it is then, and how crowded it gets at the busiest time. Same model and figures as
 * the trail briefing below it.
 */
export default function GlanceCard({ copy, language, location }) {
  const formatNumber = createNumberFormatter(language);
  const rows = windowForecasts(location);
  const best = bestWindow(rows);
  const busiest = busiestWindow(rows);
  const waitText = (row) => (Math.round(row.forecast.queueDelay) > 0
    ? formatMessage(copy.glanceWait, { minutes: formatNumber(row.forecast.queueDelay) })
    : copy.glanceNoWait);

  return (
    <section className="glance-card" aria-labelledby="glance-title">
      <span className="section-kicker">{copy.recommendation}</span>
      <h2 id="glance-title">{copy.glanceTitle}</h2>
      <dl className="glance-grid">
        <div>
          <dt>{copy.glanceBestTime}</dt>
          <dd>{copy[best.window]}<small>{copy[`${best.window}Time`]}</small></dd>
        </div>
        <div>
          <dt>{copy.glanceCrowdThen}</dt>
          <dd><CrowdChip copy={copy} level={best.level} /><small>{waitText(best)}</small></dd>
        </div>
        <div>
          <dt>{copy.glanceBusiest}</dt>
          <dd><CrowdChip copy={copy} level={busiest.level} /><small>{copy[busiest.window]} · {waitText(busiest)}</small></dd>
        </div>
      </dl>
      <p className="glance-note">{copy.glanceNote}</p>
    </section>
  );
}
