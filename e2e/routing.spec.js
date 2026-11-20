import { test, expect } from '@playwright/test';
import { fortCatalogue, mappedTrailLocations } from '../src/data/fortCatalogue.js';

const tabs = [{ page: 'explore' }, { page: 'insights' }, { page: 'dashboard' }, { page: 'photo' }];
const benchmarked = mappedTrailLocations.find((location) => location.id === 'atlas:rajgad');
const directoryFort = fortCatalogue.find((place) => place.id.startsWith('directory-'));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('durgdrishti-profile-setup-dismissed-v1', '1'); } catch { /* private mode */ }
  });
});

const hashOf = (page) => page.evaluate(() => window.location.hash);
const tab = (page, name) => page.locator(`.tab-bar a[href="#/${name}"]`);

test('each tab has its own address and is marked as the current page', async ({ page }) => {
  await page.goto('./');
  for (const { page: name } of tabs) {
    await tab(page, name).click();
    await expect.poll(() => hashOf(page)).toBe(`#/${name}`);
    await expect(tab(page, name)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.tab-bar [aria-current="page"]')).toHaveCount(1);
  }
});

test('Back and Forward move between pages instead of leaving the site', async ({ page }) => {
  await page.goto('./');
  await tab(page, 'explore').click();
  await tab(page, 'dashboard').click();
  await expect.poll(() => hashOf(page)).toBe('#/dashboard');
  await page.goBack();
  await expect.poll(() => hashOf(page)).toBe('#/explore');
  await expect(tab(page, 'explore')).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page.locator('.home-hero')).toBeVisible();
  await page.goForward();
  await expect.poll(() => hashOf(page)).toBe('#/explore');
});

test('refreshing keeps the current page', async ({ page }) => {
  await page.goto('./#/dashboard');
  await expect(tab(page, 'dashboard')).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(tab(page, 'dashboard')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.home-hero')).toHaveCount(0);
});

test('a shared link to a catalogue fort opens that fort', async ({ page }) => {
  await page.goto(`./#/fort/${directoryFort.id}`);
  await expect(page.locator('h1')).toHaveText(directoryFort.name);
  await expect(page).toHaveTitle(`${directoryFort.name} · DurgDrishti`);
  await expect(tab(page, 'insights')).toHaveAttribute('aria-current', 'page');
});

test('a shared link to a mapped location opens it, with its trail briefing', async ({ page }) => {
  await page.goto('./#/place/rajgad');
  await expect(page.locator('h1')).toContainText(benchmarked.name.split(' ')[0]);
  // The briefing starts open on wide screens and closed on phones.
  if (!(await page.locator('.estimate-details').evaluate((details) => details.open))) {
    await page.locator('.estimate-details > summary').click();
  }
  await expect(page.locator('#fort-briefing')).toBeVisible();
});

test('opening a fort from a page adds a history entry, and Back returns there', async ({ page }) => {
  await page.goto('./#/dashboard');
  const row = page.locator('.hotspot-row').first();
  await row.click();
  await expect.poll(() => hashOf(page)).toMatch(/^#\/fort\/.+/);
  await expect(page.locator('.profile-heading h1')).toBeVisible();
  await page.goBack();
  await expect.poll(() => hashOf(page)).toBe('#/dashboard');
});

test('the back link on a fort page returns to the fort list', async ({ page }) => {
  await page.goto(`./#/fort/${directoryFort.id}`);
  await page.locator('.back-link').click();
  await expect.poll(() => hashOf(page)).toBe('#/insights');
});

test('an unknown fort opens the fort list and its address is corrected, not kept in history', async ({ page }) => {
  await page.goto('./#/explore');
  await page.evaluate(() => { window.location.hash = '#/fort/no-such-fort'; });
  await expect.poll(() => hashOf(page)).toBe('#/insights');
  await expect(tab(page, 'insights')).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect.poll(() => hashOf(page)).toBe('#/explore');
});

test('the same unknown address is corrected every time it is opened', async ({ page }) => {
  await page.goto('./#/explore');
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.evaluate(() => { window.location.hash = '#/nowhere'; });
    await expect.poll(() => hashOf(page)).toBe('#/');
  }
});

test('unknown and old addresses open the home page', async ({ page }) => {
  for (const hash of ['#/nowhere', '#top']) {
    await page.goto(`./${hash}`);
    await expect(page.locator('.home-hero')).toBeVisible();
    await expect.poll(() => hashOf(page)).toBe('#/');
  }
});

test('the logo links home', async ({ page }) => {
  await page.goto('./#/photo');
  await page.locator('.brand').click();
  await expect(page.locator('.home-hero')).toBeVisible();
  await expect.poll(() => hashOf(page)).toBe('#/');
});

test('the chosen language stays while moving between pages and forts', async ({ page }) => {
  await page.goto('./');
  await page.locator('header select').selectOption('mr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'mr');
  await tab(page, 'dashboard').click();
  // Open a fort the way a visitor does, from the dashboard. (page.goto would be a fresh visit,
  // and the language is not remembered between visits.)
  await page.locator('.hotspot-row').first().click();
  await expect.poll(() => hashOf(page)).toMatch(/^#\/fort\/.+/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'mr');
  await page.goBack();
  await expect.poll(() => hashOf(page)).toBe('#/dashboard');
  await expect(page.locator('html')).toHaveAttribute('lang', 'mr');
  await expect(page.locator('header select')).toHaveValue('mr');
});

test('opening a page scrolls to its top', async ({ page }) => {
  await page.goto('./');
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.locator('.home-action-explore').click();
  await expect.poll(() => hashOf(page)).toBe('#/explore');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
