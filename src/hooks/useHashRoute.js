import { useCallback, useEffect, useState } from 'react';
import { formatRoute, parseRoute } from '../lib/route.js';

/**
 * The current route, read from the address bar's hash and kept in step with it, so the Back
 * and Forward buttons, refreshing and shared links all work.
 *
 * `routeExists` decides whether a fort or place address points at a real record. An unknown
 * one opens the fort list instead, and the address is corrected without adding a history
 * entry, so Back still leaves the broken address behind.
 */
export function useHashRoute(routeExists) {
  // Each change is stored as a new object, so returning to the same hash after it was
  // corrected below still counts as a change.
  const [visit, setVisit] = useState(() => ({ hash: window.location.hash }));
  const { hash } = visit;

  useEffect(() => {
    const onHashChange = () => setVisit({ hash: window.location.hash });
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const parsed = parseRoute(hash);
  const route = routeExists(parsed) ? parsed : { page: 'insights' };
  const address = formatRoute(route);

  // Runs for every new hash, not only a new route: two different unknown addresses both
  // open the home page, and each must still be corrected.
  useEffect(() => {
    // A first visit without any hash is already the home page; leave that address as it is.
    if (hash === address || (hash === '' && address === '#/')) return;
    window.history.replaceState(window.history.state, '', address);
  }, [visit, hash, address]);

  const navigate = useCallback((next) => {
    const target = formatRoute(next);
    if (window.location.hash !== target) window.location.hash = target;
    window.scrollTo(0, 0);
  }, []);

  return [route, navigate];
}
