import en from './translations/en.js';
import mr from './translations/mr.js';
import hi from './translations/hi.js';

// All languages together, for tests. The app loads English up front and the others on demand
// (see loadTranslation.js), so a visitor only downloads the language they use.
export const translations = { en, mr, hi };
