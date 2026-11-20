import en from './translations/en.js';
import { isSupportedLanguage } from './languages.js';

// English is bundled with the app; Marathi and Hindi are fetched the first time they are chosen.
const loaders = {
  mr: () => import('./translations/mr.js'),
  hi: () => import('./translations/hi.js'),
};

export const defaultCopy = en;

export async function loadTranslation(language) {
  if (language === 'en') return en;
  if (!isSupportedLanguage(language) || !loaders[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const module = await loaders[language]();
  return module.default;
}
