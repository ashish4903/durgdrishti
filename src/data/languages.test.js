import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlLangFor, isSupportedLanguage, languages } from './languages.js';
import { defaultCopy, loadTranslation } from './loadTranslation.js';
import { translations } from './translations.js';

test('the language menu offers English, Marathi and Hindi, each with a unique code and label', () => {
  assert.deepEqual(languages.map((language) => language.code), ['en', 'mr', 'hi']);
  assert.equal(new Set(languages.map((language) => language.label)).size, languages.length);
  for (const language of languages) {
    assert.ok(language.label.trim(), `${language.code} needs a menu label`);
    assert.match(language.htmlLang, /^[a-z]{2}$/, `${language.code} needs a valid <html lang> code`);
  }
});

test('Marathi and Hindi menu labels are written in Devanagari', () => {
  const devanagari = /^[\u0900-\u097F]+$/;
  for (const code of ['mr', 'hi']) {
    assert.match(languages.find((language) => language.code === code).label, devanagari);
  }
});

test('every menu language has a translation file', () => {
  for (const language of languages) assert.ok(translations[language.code], `${language.code} has no translation`);
  assert.deepEqual(Object.keys(translations).sort(), languages.map((language) => language.code).sort());
});

test('isSupportedLanguage accepts only the menu languages', () => {
  for (const language of languages) assert.equal(isSupportedLanguage(language.code), true);
  for (const code of ['', 'fr', 'EN', 'mr-IN', undefined, null, 'constructor', '__proto__']) {
    assert.equal(isSupportedLanguage(code), false, `${String(code)} should not be supported`);
  }
});

test('htmlLangFor gives the page language and falls back to English', () => {
  assert.equal(htmlLangFor('en'), 'en');
  assert.equal(htmlLangFor('mr'), 'mr');
  assert.equal(htmlLangFor('hi'), 'hi');
  assert.equal(htmlLangFor('xx'), 'en');
});

test('loadTranslation returns the right copy for each menu language', async () => {
  assert.equal(await loadTranslation('en'), defaultCopy);
  for (const language of languages) {
    const copy = await loadTranslation(language.code);
    assert.deepEqual(copy, translations[language.code], `${language.code} loaded the wrong copy`);
  }
});

test('loadTranslation rejects an unknown language instead of crashing with a TypeError', async () => {
  for (const code of ['fr', 'constructor', '__proto__', '']) {
    await assert.rejects(loadTranslation(code), /Unsupported language/);
  }
});

test('the home title differs in each language, so a switch is visible', () => {
  const titles = languages.map((language) => translations[language.code].homeTitle);
  assert.equal(new Set(titles).size, languages.length);
});
