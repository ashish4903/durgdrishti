// The optional visitor profile, kept only in this browser's localStorage.

export const visitorProfileKey = 'durgdrishti-visitor-profile-v1';
export const profileDismissedKey = 'durgdrishti-profile-setup-dismissed-v1';
const validProfileInterests = new Set(['history', 'architecture', 'openLandscape', 'waterfalls', 'challenging', 'quieter', 'flowers', 'photography']);
const validAgeRanges = new Set(['under18', '18to24', '25to34', '35to44', '45to54', '55plus']);

/** Turns stored JSON into a safe profile: unknown values are dropped and text is shortened. */
export function parseVisitorProfile(stored) {
  if (!stored) return null;
  const value = JSON.parse(stored);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    name: typeof value.name === 'string' ? value.name.slice(0, 60) : '',
    ageRange: validAgeRanges.has(value.ageRange) ? value.ageRange : '',
    trekCount: Number.isInteger(value.trekCount) ? Math.min(500, Math.max(0, value.trekCount)) : '',
    visitedForts: typeof value.visitedForts === 'string' ? value.visitedForts.slice(0, 240) : '',
    interests: Array.isArray(value.interests) ? [...new Set(value.interests.filter((interest) => validProfileInterests.has(interest)))] : [],
  };
}

export function readVisitorProfile(storage = globalThis.localStorage) {
  try {
    return parseVisitorProfile(storage.getItem(visitorProfileKey));
  } catch (error) {
    console.error('Could not read the locally saved visitor profile.', error);
    return null;
  }
}

export function shouldShowProfileSetup(storage = globalThis.localStorage) {
  try {
    return !readVisitorProfile(storage) && !storage.getItem(profileDismissedKey);
  } catch (error) {
    console.error('Could not read visitor profile setup preference.', error);
    return true;
  }
}

/** Each of these returns false when the browser refuses storage (e.g. private mode). */
export function storeVisitorProfile(profile, storage = globalThis.localStorage) {
  try {
    storage.setItem(visitorProfileKey, JSON.stringify(profile));
    storage.setItem(profileDismissedKey, 'true');
    return true;
  } catch (error) {
    console.error('Could not save visitor preferences in browser storage.', error);
    return false;
  }
}

export function storeProfileDismissed(storage = globalThis.localStorage) {
  try {
    storage.setItem(profileDismissedKey, 'true');
    return true;
  } catch (error) {
    console.error('Could not save the visitor profile setup preference.', error);
    return false;
  }
}

export function removeVisitorProfile(storage = globalThis.localStorage) {
  try {
    storage.removeItem(visitorProfileKey);
    storage.setItem(profileDismissedKey, 'true');
    return true;
  } catch (error) {
    console.error('Could not clear the locally saved visitor profile.', error);
    return false;
  }
}
