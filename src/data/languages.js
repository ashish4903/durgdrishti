// The interface languages, in the order the language menu shows them. `label` is written in
// the language itself so a visitor can find their own; `htmlLang` goes on <html lang> so the
// browser picks a Devanagari font and screen readers use the right voice.
export const languages = [
  { code: 'en', label: 'EN', name: 'English', htmlLang: 'en' },
  { code: 'mr', label: 'मराठी', name: 'Marathi', htmlLang: 'mr' },
  { code: 'hi', label: 'हिन्दी', name: 'Hindi', htmlLang: 'hi' },
];

export const isSupportedLanguage = (code) => languages.some((language) => language.code === code);

export const htmlLangFor = (code) => languages.find((language) => language.code === code)?.htmlLang ?? 'en';
