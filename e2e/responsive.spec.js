import { test, expect } from '@playwright/test';

const languages = [
  { code: 'en', label: 'EN', title: 'Discover the forts of Maharashtra.' },
  { code: 'mr', label: 'मराठी', title: 'महाराष्ट्रातील गड शोधा.' },
  { code: 'hi', label: 'हिन्दी', title: 'महाराष्ट्र के किले खोजें।' },
];

test.beforeEach(async ({ page }) => {
  // Skip the first-visit profile dialog so the header and tabs can be used.
  await page.addInitScript(() => {
    try { localStorage.setItem('durgdrishti-profile-setup-dismissed-v1', '1'); } catch { /* private mode */ }
  });
  await page.goto('./');
});

const languageMenu = (page) => page.locator('header select');

async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const language of languages) {
  test(`switching to ${language.code} translates the page and sets <html lang>`, async ({ page }) => {
    if (language.code !== 'en') await languageMenu(page).selectOption('mr' === language.code ? 'en' : 'mr');
    await languageMenu(page).selectOption(language.code);
    await expect(page.locator('h1').first()).toHaveText(language.title);
    await expect(page.locator('html')).toHaveAttribute('lang', language.code);
    await expect(languageMenu(page)).toHaveValue(language.code);
  });

  test(`the ${language.code} menu label is shown in full with the arrow inside the box`, async ({ page }) => {
    await languageMenu(page).selectOption(language.code);
    await expect(page.locator('h1').first()).toHaveText(language.title);
    const box = await languageMenu(page).evaluate((select) => {
      const style = getComputedStyle(select);
      const measure = document.createElement('span');
      measure.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${style.font}`;
      measure.textContent = select.selectedOptions[0].textContent;
      document.body.append(measure);
      const textWidth = measure.getBoundingClientRect().width;
      measure.remove();
      const rect = select.getBoundingClientRect();
      const available = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const arrow = getComputedStyle(select.parentElement, '::after');
      return { label: select.selectedOptions[0].textContent, textWidth, available, height: rect.height, arrowTop: arrow.top, rect };
    });
    expect(box.label).toBe(language.label);
    expect(box.textWidth).toBeLessThanOrEqual(box.available + 0.5);
    expect(box.height).toBeGreaterThanOrEqual(32);
    expect(box.rect.right).toBeLessThanOrEqual(page.viewportSize().width);
  });

  test(`no page scrolls sideways in ${language.code}`, async ({ page }) => {
    await languageMenu(page).selectOption(language.code);
    await expect(page.locator('html')).toHaveAttribute('lang', language.code);
    const tabs = page.locator('.tab-bar .tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await tabs.nth(index).click();
      await page.waitForLoadState('networkidle');
      expect(await horizontalOverflow(page), `tab ${index} overflows`).toBeLessThanOrEqual(0);
    }
  });
}

test('the last language picked wins when switching quickly', async ({ page }) => {
  // Hold back the Marathi download so Hindi finishes first.
  await page.route(/\/mr-[^/]*\.js$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await languageMenu(page).selectOption('mr');
  await languageMenu(page).selectOption('hi');
  await expect(page.locator('h1').first()).toHaveText('महाराष्ट्र के किले खोजें।');
  await page.waitForTimeout(1200);
  await expect(page.locator('h1').first()).toHaveText('महाराष्ट्र के किले खोजें।');
  await expect(languageMenu(page)).toHaveValue('hi');
});

test('a failed language download keeps the page usable in the current language', async ({ page }) => {
  await page.route(/\/hi-[^/]*\.js$/, (route) => route.abort());
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await languageMenu(page).selectOption('hi');
  await expect(languageMenu(page)).toHaveValue('en');
  await expect(page.locator('h1').first()).toHaveText('Discover the forts of Maharashtra.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
});

test('the language menu is big enough to tap on touch screens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch target size matters on phones and tablets');
  const rect = await languageMenu(page).boundingBox();
  expect(rect.height).toBeGreaterThanOrEqual(40);
  const fontSize = await languageMenu(page).evaluate((select) => parseFloat(getComputedStyle(select).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);
});
