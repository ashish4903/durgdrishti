// Hash routes give every page its own address. GitHub Pages serves only static files, so the
// part after "#" is the only part of the URL the app can use without a server:
//   #/                      home
//   #/explore               fort atlas
//   #/insights              choose a fort for insights
//   #/dashboard             district overview
//   #/photo                 photo field guide
//   #/fort/<catalogue id>   one fort from the catalogue, e.g. #/fort/directory-aad
//   #/place/<map id>        one mapped location, e.g. #/place/node/342119741 (map id without "atlas:")

export const sectionPages = ['explore', 'insights', 'dashboard', 'photo'];

const mapIdPrefix = 'atlas:';

const decode = (part) => {
  try {
    return decodeURIComponent(part);
  } catch {
    return null;
  }
};

/** Reads a location hash such as "#/fort/directory-aad". Anything unrecognised is the home page. */
export function parseRoute(hash = '') {
  const path = String(hash).replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!path) return { page: 'home' };
  const parts = path.split('/').map(decode);
  if (parts.some((part) => part === null || part === '')) return { page: 'home' };
  const [head, ...rest] = parts;
  if (head === 'fort' && rest.length === 1) return { page: 'fort', fortId: rest[0] };
  if (head === 'place' && rest.length > 0) return { page: 'place', locationId: `${mapIdPrefix}${rest.join('/')}` };
  if (sectionPages.includes(head) && rest.length === 0) return { page: head };
  return { page: 'home' };
}

/** The hash for a route; parseRoute(formatRoute(route)) gives the same route back. */
export function formatRoute(route) {
  switch (route?.page) {
    case 'fort':
      return `#/fort/${encodeURIComponent(route.fortId)}`;
    case 'place':
      return `#/place/${route.locationId.replace(mapIdPrefix, '').split('/').map(encodeURIComponent).join('/')}`;
    default:
      return sectionPages.includes(route?.page) ? `#/${route.page}` : '#/';
  }
}

export const fortRoute = (fortId) => ({ page: 'fort', fortId });
export const placeRoute = (locationId) => ({ page: 'place', locationId });

/** Which main tab is highlighted for a route. A fort page belongs to "insights". */
export function tabForRoute(route) {
  if (route.page === 'fort' || route.page === 'place') return 'insights';
  return route.page;
}
