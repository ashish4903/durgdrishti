// Light or dark. With no saved choice the site follows the device (prefers-color-scheme);
// the header toggle saves an explicit choice on this device only.
// index.html applies a saved choice before the page draws, so it never flashes the wrong theme;
// keep its inline script in step with `themeKey` and the values here.

export const themeKey = 'durgdrishti-theme-v1';
export const themes = ['light', 'dark'];

export function readThemePreference(storage = globalThis.localStorage) {
  try {
    const value = storage.getItem(themeKey);
    return themes.includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeThemePreference(theme, storage = globalThis.localStorage) {
  try {
    storage.setItem(themeKey, theme);
    return true;
  } catch {
    return false;
  }
}

/** The theme in use: the saved choice, otherwise the device setting. */
export const effectiveTheme = (preference, deviceIsDark) => preference ?? (deviceIsDark ? 'dark' : 'light');

/** The toggle switches to the other theme from the one currently shown. */
export const toggledTheme = (current) => (current === 'dark' ? 'light' : 'dark');
