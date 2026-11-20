// Fort search used by the header search dialog and the atlas list.
// Matching ignores case and extra spaces; it does not strip non-Latin letters, so a Marathi or
// Hindi query is compared as typed.

const fold = (text) => String(text ?? '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();

/** True when a place's name or district contains the query (an empty query matches all). */
export function matchesQuery(place, query) {
  const needle = fold(query);
  if (!needle) return true;
  return fold(place.name).includes(needle) || fold(place.district).includes(needle);
}

/** A score for ordering results: name start, then a word start, then anywhere, then district. */
export function scoreMatch(place, query) {
  const needle = fold(query);
  const name = fold(place.name);
  const district = fold(place.district);
  if (!needle) return 0;
  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;
  if (name.split(/[\s-]+/).some((word) => word.startsWith(needle))) return 60;
  if (name.includes(needle)) return 40;
  if (district.startsWith(needle)) return 20;
  if (district.includes(needle)) return 10;
  return -1;
}

/** The best matches, ordered by score and then name. */
export function searchPlaces(places, query, limit = 8) {
  if (!fold(query)) return [];
  return places
    .map((place) => ({ place, score: scoreMatch(place, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'en'))
    .slice(0, limit)
    .map((entry) => entry.place);
}

/** Splits text around the first match of the query, for highlighting: [before, match, after]. */
export function splitOnMatch(text, query) {
  const needle = fold(query);
  const index = needle ? String(text).toLocaleLowerCase().indexOf(needle) : -1;
  if (index < 0) return [String(text), '', ''];
  return [text.slice(0, index), text.slice(index, index + needle.length), text.slice(index + needle.length)];
}

/** Districts of the given places, most forts first (ties by name). */
export function districtsByCount(places) {
  const counts = new Map();
  for (const place of places) {
    if (place.district) counts.set(place.district, (counts.get(place.district) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
    .map(([district, count]) => ({ district, count }));
}
