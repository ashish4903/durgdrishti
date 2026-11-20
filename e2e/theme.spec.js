import { test, expect } from '@playwright/test';

const dismissProfile = () => {
  try { localStorage.setItem('durgdrishti-profile-setup-dismissed-v1', '1'); } catch { /* private mode */ }
};
const pageBackground = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

for (const scheme of ['light', 'dark']) {
  test(`with no saved choice the site follows a ${scheme} device`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(dismissProfile);
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
    expect(await pageBackground(page)).toBe(scheme === 'dark' ? 'rgb(17, 26, 23)' : 'rgb(251, 247, 239)');
  });
}

test('the toggle switches theme, is remembered after a reload, and is applied before the page draws', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(dismissProfile);
  await page.goto('./');
  const toggle = page.locator('.theme-toggle');
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await pageBackground(page)).toBe('rgb(17, 26, 23)');
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');

  // On reload, check the attribute before the app's script has run: no flash of the light theme.
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      window.themeBeforeApp = document.documentElement.getAttribute('data-theme');
    }, { once: true });
  });
  await page.reload();
  expect(await page.evaluate(() => window.themeBeforeApp)).toBe('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await pageBackground(page)).toBe('rgb(251, 247, 239)');
});

test('a saved choice wins over the device setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    localStorage.setItem('durgdrishti-profile-setup-dismissed-v1', '1');
    localStorage.setItem('durgdrishti-theme-v1', 'light');
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await pageBackground(page)).toBe('rgb(251, 247, 239)');
});

test('blocked storage still shows the site, following the device', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('h1').first()).toBeVisible();
  expect(await pageBackground(page)).toBe('rgb(17, 26, 23)');
  expect(errors).toEqual([]);
});
