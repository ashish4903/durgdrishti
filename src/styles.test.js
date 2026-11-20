import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guards for the mobile and Devanagari fixes in index.css. The real layout is checked in a
// browser by e2e/responsive.spec.js; these catch an accidental revert without one.
const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('the page declares a responsive viewport', () => {
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1(\.0)?"/);
});

test('the page has no minimum width that would force sideways scrolling on small phones', () => {
  assert.doesNotMatch(css, /(^|[\s,{])(html|body)[^{]*\{[^}]*min-width:\s*3\d\dpx/m);
});

test('the language menu draws its arrow instead of using a text glyph', () => {
  const arrow = css.match(/\.language-select::after\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(arrow, /content:\s*''/);
  assert.match(arrow, /top:\s*50%/);
});

test('the language menu uses a Devanagari-capable font and is wide enough for its labels', () => {
  const select = css.match(/\.language-select select\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(select, /Devanagari|Nirmala UI|Mangal/);
  assert.match(select, /min-width:\s*\d+px/);
  assert.doesNotMatch(select, /var\(--mono\)/);
});

test('the language menu is 16px on phones and tablets so iOS does not zoom when it is tapped', () => {
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?\.language-select select\s*\{[^}]*font-size:\s*16px/);
  assert.match(css, /@media \(pointer: coarse\)\s*\{\s*\.language-select select\s*\{[^}]*font-size:\s*16px/);
});

test('Marathi and Hindi text has no letter spacing', () => {
  assert.match(css, /html:is\(\[lang="mr"\], \[lang="hi"\]\)[^{]*\{\s*letter-spacing:\s*normal/);
});
