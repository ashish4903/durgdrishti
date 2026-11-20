import { useEffect, useState } from 'react';
import { effectiveTheme, readThemePreference, toggledTheme, writeThemePreference } from '../lib/theme.js';

const darkQuery = '(prefers-color-scheme: dark)';
const deviceIsDark = () => typeof window.matchMedia === 'function' && window.matchMedia(darkQuery).matches;

/** The theme shown, kept in step with the device setting until the visitor picks one. */
export function useTheme() {
  const [preference, setPreference] = useState(readThemePreference);
  const [deviceDark, setDeviceDark] = useState(deviceIsDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(darkQuery);
    const onChange = (event) => setDeviceDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = effectiveTheme(preference, deviceDark);

  useEffect(() => {
    if (preference) document.documentElement.dataset.theme = preference;
    else delete document.documentElement.dataset.theme;
  }, [preference]);

  const toggleTheme = () => {
    const next = toggledTheme(theme);
    // Apply now, before the re-render, so components that read the colours see the new theme.
    document.documentElement.dataset.theme = next;
    setPreference(next);
    writeThemePreference(next);
  };

  return { theme, toggleTheme };
}
