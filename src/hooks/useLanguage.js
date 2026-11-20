import { useEffect, useRef, useState } from 'react';
import { defaultCopy, loadTranslation } from '../data/loadTranslation.js';
import { htmlLangFor, isSupportedLanguage } from '../data/languages.js';

/**
 * The interface language and its text.
 *
 * English is bundled; other languages download the first time they are chosen. The page
 * switches once the chosen language has loaded; if loading fails (e.g. offline), it stays in
 * the current language. The menu shows the choice straight away, and only the most recent
 * choice is applied, so a slow download cannot switch the page back to a language the visitor
 * has already moved away from.
 */
export function useLanguage() {
  const [language, setLanguage] = useState('en');
  const [requestedLanguage, setRequestedLanguage] = useState('en');
  const [loadedCopy, setLoadedCopy] = useState({ en: defaultCopy });
  const latestRequest = useRef('en');

  useEffect(() => {
    document.documentElement.lang = htmlLangFor(language);
  }, [language]);

  const changeLanguage = (next) => {
    if (!isSupportedLanguage(next)) return;
    latestRequest.current = next;
    setRequestedLanguage(next);
    if (loadedCopy[next]) {
      setLanguage(next);
      return;
    }
    loadTranslation(next)
      .then((nextCopy) => {
        setLoadedCopy((current) => ({ ...current, [next]: nextCopy }));
        if (latestRequest.current === next) setLanguage(next);
      })
      .catch(() => {
        if (latestRequest.current !== next) return;
        latestRequest.current = language;
        setRequestedLanguage(language);
      });
  };

  return {
    language,
    requestedLanguage,
    copy: loadedCopy[language] ?? defaultCopy,
    changeLanguage,
  };
}
