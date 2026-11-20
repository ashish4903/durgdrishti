// The visitor's saved forts ("trek list"), kept only in this browser's localStorage, as page
// addresses (#/fort/… or #/place/…) so each opens straight from the list.

export const savedFortsKey = 'durgdrishti-saved-forts-v1';
export const maxSavedForts = 50;

const isEntry = (value) => value
  && typeof value === 'object'
  && typeof value.address === 'string'
  && /^#\/(fort|place)\/.+/.test(value.address)
  && typeof value.name === 'string';

/** Turns stored JSON into a clean list: bad entries and duplicates dropped, names shortened. */
export function parseSavedForts(stored) {
  if (!stored) return [];
  const value = JSON.parse(stored);
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const list = [];
  for (const entry of value) {
    if (!isEntry(entry) || seen.has(entry.address)) continue;
    seen.add(entry.address);
    list.push({ address: entry.address, name: entry.name.slice(0, 80) });
    if (list.length === maxSavedForts) break;
  }
  return list;
}

export function readSavedForts(storage = globalThis.localStorage) {
  try {
    return parseSavedForts(storage.getItem(savedFortsKey));
  } catch {
    return [];
  }
}

/** Saves the list; returns false when the browser refuses storage (e.g. private mode). */
export function writeSavedForts(list, storage = globalThis.localStorage) {
  try {
    storage.setItem(savedFortsKey, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const isSaved = (list, address) => list.some((entry) => entry.address === address);

/** Adds the fort if missing (newest first) or removes it if present. */
export function toggleSaved(list, entry) {
  if (isSaved(list, entry.address)) return list.filter((item) => item.address !== entry.address);
  return [{ address: entry.address, name: entry.name }, ...list].slice(0, maxSavedForts);
}
