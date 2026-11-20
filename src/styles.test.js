import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guards for the design system in index.css: colour contrast in both themes, no stray colours,
// readable text sizes, and the mobile and Devanagari fixes. The real layout is checked in a
// browser by the e2e/ tests; these catch an accidental change without one.
const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/** The custom properties declared in the first block that starts at `selector`. */
function tokensIn(selector) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `${selector} block is missing`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
}

const light = tokensIn(':root {\n  color-scheme: light;');
const darkMedia = tokensIn(':root:not([data-theme="light"]) {');
const darkToggle = tokensIn(':root[data-theme="dark"] {');
const dark = { ...light, ...darkToggle };

function luminance(hex) {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// Text colour on background colour, as used in index.css. 4.5:1 is WCAG AA for normal text.
const textPairs = [
  ['ink', 'bg'], ['ink', 'surface'], ['ink', 'surface-2'], ['ink', 'bg-tint'],
  ['muted', 'bg'], ['muted', 'surface'], ['muted', 'surface-2'], ['muted', 'bg-tint'],
  ['primary', 'bg'], ['primary', 'surface'], ['primary', 'primary-soft'],
  ['accent', 'bg'], ['accent', 'surface'], ['accent', 'accent-soft'], ['muted', 'accent-soft'], ['ink', 'accent-soft'],
  ['on-accent', 'accent'], ['on-primary', 'primary'], ['on-highlight', 'highlight'],
  ['crowd-low', 'crowd-low-soft'], ['crowd-med', 'crowd-med-soft'], ['crowd-high', 'crowd-high-soft'],
  ['crowd-low', 'surface'], ['crowd-high', 'surface'],
];

for (const [name, tokens] of [['light', light], ['dark', dark]]) {
  test(`every text colour meets WCAG AA (4.5:1) in the ${name} theme`, () => {
    for (const [text, background] of textPairs) {
      const ratio = contrast(tokens[text], tokens[background]);
      assert.ok(ratio >= 4.5, `${name}: --${text} on --${background} is ${ratio.toFixed(2)}:1`);
    }
  });

  test(`the focus ring stands out (3:1) in the ${name} theme`, () => {
    for (const background of ['bg', 'surface']) {
      assert.ok(contrast(tokens.focus, tokens[background]) >= 3, `${name}: focus on --${background}`);
    }
  });
}

test('the dark theme is the same whether it comes from the device or the toggle', () => {
  assert.deepEqual(darkMedia, darkToggle);
});

test('colours are only defined as tokens, never written into component rules', () => {
  const rules = css.slice(css.indexOf('/* ---------- Base ---------- */'));
  assert.deepEqual(rules.match(/#[0-9a-f]{3,8}\b/gi) ?? [], []);
});

test('no text is smaller than 12px', () => {
  const sizes = [...css.matchAll(/font(?:-size)?:[^;]*?\b(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
  assert.ok(sizes.length > 0);
  assert.deepEqual(sizes.filter((size) => size < 12), []);
  assert.equal(light['fs-xs'], '12px');
});

test('the page declares a responsive viewport and both colour schemes', () => {
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1(\.0)?"/);
  assert.match(html, /<meta name="color-scheme" content="light dark"/);
});

test('a saved theme is applied before the page draws', () => {
  assert.match(html, /localStorage\.getItem\('durgdrishti-theme-v1'\)[\s\S]*setAttribute\('data-theme'/);
  assert.ok(html.indexOf('durgdrishti-theme-v1') < html.indexOf('src="/src/main.jsx"'));
});

test('the page has no minimum width that would force sideways scrolling on small phones', () => {
  assert.doesNotMatch(css, /(^|[\s,{])(html|body)[^{]*\{[^}]*min-width:\s*3\d\dpx/m);
});

test('the language menu draws its arrow, fits its labels and is 16px so iOS does not zoom', () => {
  const arrow = css.match(/\.language-select::after\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(arrow, /content:\s*''/);
  assert.match(arrow, /top:\s*50%/);
  const select = css.match(/\.language-select select\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(select, /min-width:\s*\d+px/);
  assert.match(select, /font:\s*600 16px/);
  assert.match(light.font, /Devanagari/);
});

test('Marathi and Hindi text has no letter spacing', () => {
  assert.match(css, /html:is\(\[lang="mr"\], \[lang="hi"\]\)[^{]*\{\s*letter-spacing:\s*normal/);
});

test('buttons and tabs are at least 44px tall to tap', () => {
  assert.equal(light.tap, '44px');
  for (const selector of ['.tab {', '.icon-button {', '.chip {']) {
    const start = css.indexOf(`\n${selector}`);
    assert.ok(start >= 0, selector);
  }
  assert.match(css, /\.tab \{[^}]*min-height: var\(--tap\)/);
  assert.match(css, /\.icon-button \{[^}]*height: var\(--tap\)/);
});

test('animations are switched off for visitors who ask for reduced motion', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: \.01ms !important/);
});
