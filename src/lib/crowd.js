import { calculateLocationForecast } from '../data/forecast.js';

// Plain-language crowd levels for the modelled estimates in src/data/forecast.js.
// "high" when the wait at the narrow section reaches half an hour or parking is half again over
// capacity; "medium" from a ten-minute wait or 80% parking; otherwise "low".
export const crowdThresholds = {
  high: { queueMinutes: 30, parkingPercent: 150 },
  medium: { queueMinutes: 10, parkingPercent: 80 },
};

export const departureWindows = ['alpine', 'early', 'peak'];

const levelRank = { low: 0, medium: 1, high: 2 };

export function crowdLevel({ queueDelay, parkingPercent }) {
  if (queueDelay >= crowdThresholds.high.queueMinutes || parkingPercent >= crowdThresholds.high.parkingPercent) return 'high';
  if (queueDelay >= crowdThresholds.medium.queueMinutes || parkingPercent >= crowdThresholds.medium.parkingPercent) return 'medium';
  return 'low';
}

/** The forecast for each departure window, with its crowd level. */
export function windowForecasts(location, surge = false) {
  return departureWindows.map((window) => {
    const forecast = calculateLocationForecast(location, window, surge);
    return { window, forecast, level: crowdLevel(forecast) };
  });
}

/** The window to recommend: the quietest level, then the fewest people, then the earliest. */
export function bestWindow(rows) {
  return [...rows].sort((a, b) => (
    levelRank[a.level] - levelRank[b.level]
    || a.forecast.activeLoad - b.forecast.activeLoad
    || departureWindows.indexOf(a.window) - departureWindows.indexOf(b.window)
  ))[0];
}

/** The busiest window, shown next to the best one for contrast. */
export function busiestWindow(rows) {
  return [...rows].sort((a, b) => (
    levelRank[b.level] - levelRank[a.level] || b.forecast.activeLoad - a.forecast.activeLoad
  ))[0];
}
