import en from './translations/en.js';

// English is bundled with the app; Marathi and Hindi are fetched the first time they are chosen.
const loaders = {
  mr: () => import('./translations/mr.js'),
  hi: () => import('./translations/hi.js'),
};

export const defaultCopy = en;

export async function loadTranslation(language) {
  if (language === 'en') return en;
  const module = await loaders[language]();
  return module.default;
}
