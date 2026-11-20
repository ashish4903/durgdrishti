/** Fills "{name}" placeholders in translated text. */
export const formatMessage = (message, values) => Object.entries(values).reduce(
  (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
  message,
);

const numberLocales = { en: 'en-IN', mr: 'mr-IN', hi: 'hi-IN' };

/** A whole-number formatter in the interface language (Devanagari digits for Marathi and Hindi). */
export function createNumberFormatter(language) {
  const formatter = new Intl.NumberFormat(numberLocales[language] ?? 'en-IN', { maximumFractionDigits: 0 });
  return (value) => formatter.format(Math.round(value));
}
