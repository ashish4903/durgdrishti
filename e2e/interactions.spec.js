import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, context }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('durgdrishti-profile-setup-dismissed-v1', '1'); } catch { /* private mode */ }
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
});

const hashOf = (page) => page.evaluate(() => window.location.hash);

test('search opens from the header, works with the keyboard and opens the fort', async ({ page }) => {
  await page.goto('./#/dashboard');
  await page.locator('.search-button').click();
  const input = page.locator('#site-search');
  await expect(input).toBeFocused();
  await input.fill('rajg');
  await expect(page.locator('#site-search-results [role="option"]').first()).toContainText('Rajgad');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect.poll(() => hashOf(page)).toMatch(/^#\/fort\/.+/);
  await expect(page.locator('.profile-heading h1')).toContainText('Rajgad');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('search: "/" opens it, Esc closes it and returns focus, and no match says so', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcuts are for keyboards');
  await page.goto('./');
  await page.locator('.search-button').focus();
  await page.keyboard.press('/');
  await expect(page.locator('#site-search')).toBeFocused();
  await page.locator('#site-search').fill('zzzz');
  await expect(page.locator('.search-empty')).toContainText('zzzz');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.search-button')).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#site-search')).toBeFocused();
});

test('a fort page answers "when should I go?" without opening anything', async ({ page }) => {
  await page.goto('./#/place/rajgad');
  const glance = page.locator('.glance-card');
  await expect(glance).toBeVisible();
  await expect(glance).toContainText('Alpine start');
  await expect(glance.locator('.crowd-low')).toContainText('Quiet');
  await expect(glance.locator('.crowd-high')).toContainText('Very busy');
  await expect(glance).toContainText('71 min');
});

test('the full briefing starts open on wide screens and closed on phones', async ({ page }) => {
  await page.goto('./#/place/rajgad');
  const open = await page.locator('.estimate-details').evaluate((details) => details.open);
  expect(open).toBe(page.viewportSize().width >= 960);
});

test('departure bars show each window with its crowd level', async ({ page }) => {
  await page.goto('./#/place/rajgad');
  if (!(await page.locator('.estimate-details').evaluate((details) => details.open))) {
    await page.locator('.estimate-details > summary').click();
  }
  await expect(page.locator('.departure-bar')).toHaveCount(3);
  await expect(page.locator('.departure-bar').nth(2).locator('.crowd-chip')).toHaveText('Very busy');
  // The same figures are in a table for screen readers.
  await expect(page.locator('.departure-table tbody tr')).toHaveCount(3);
});

test('share copies the link where there is no share sheet, with a confirmation', async ({ page, isMobile, browserName }) => {
  test.skip(isMobile || browserName !== 'chromium', 'phones use the system share sheet');
  await page.goto('./#/place/rajgad');
  await page.locator('.share-button').click();
  await expect(page.locator('.toast')).toHaveText('Link copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await page.evaluate(() => window.location.href));
});

test('saving a fort adds it to the trek list on Home, and it opens from there', async ({ page }) => {
  await page.goto('./#/place/rajgad');
  const save = page.locator('.profile-heading .save-button');
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.toast')).toHaveText('Added to your trek list');

  await page.locator('.tab-bar a[href="#/"]').click();
  const chip = page.locator('.saved-chip');
  await expect(chip).toHaveCount(1);
  await expect(chip).toContainText('Rajgad');
  await page.reload();
  await expect(page.locator('.saved-chip')).toHaveCount(1);
  await page.locator('.saved-chip').click();
  await expect.poll(() => hashOf(page)).toBe('#/place/rajgad');

  await page.locator('.profile-heading .save-button').click();
  await page.locator('.tab-bar a[href="#/"]').click();
  await expect(page.locator('.saved-forts')).toHaveCount(0);
});

test('atlas filters narrow the list and can be cleared', async ({ page }) => {
  await page.goto('./#/insights');
  const count = page.locator('.atlas-result-count');
  await expect(count).toHaveText(/^421 of 421 forts$/);
  const firstDistrict = page.locator('.atlas-filters .chip').nth(1);
  const districtName = (await firstDistrict.innerText()).split('·')[0].trim();
  await firstDistrict.click();
  await expect(firstDistrict).toHaveAttribute('aria-pressed', 'true');
  await expect(count).not.toHaveText(/^421 of/);
  for (const meta of await page.locator('.atlas-place-meta').allInnerTexts()) expect(meta).toContain(districtName);
  await page.locator('.chip-clear').click();
  await expect(count).toHaveText(/^421 of 421 forts$/);
});

test('every tab is visible and tappable on a phone, in a bar at the bottom', async ({ page, isMobile }) => {
  test.skip(!isMobile || page.viewportSize().width > 600, 'phone layout');
  await page.goto('./');
  const bar = page.locator('.tab-bar');
  const box = await bar.boundingBox();
  expect(Math.round(box.y + box.height)).toBe(page.viewportSize().height);
  for (const tab of await page.locator('.tab-bar .tab').all()) {
    const tabBox = await tab.boundingBox();
    expect(tabBox.x).toBeGreaterThanOrEqual(0);
    expect(tabBox.x + tabBox.width).toBeLessThanOrEqual(page.viewportSize().width);
    expect(tabBox.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('.tab-bar a[href="#/dashboard"]').click();
  await expect.poll(() => hashOf(page)).toBe('#/dashboard');
});

test('no visible text is smaller than 12px on any page', async ({ page }) => {
  for (const hash of ['#/', '#/explore', '#/insights', '#/dashboard', '#/photo', '#/place/rajgad']) {
    await page.goto(`./${hash}`);
    await page.waitForLoadState('networkidle');
    const tooSmall = await page.evaluate(() => [...document.querySelectorAll('body *')]
      .filter((element) => {
        const text = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (!text || element.closest('.sr-only')) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1 && parseFloat(getComputedStyle(element).fontSize) < 12;
      })
      .map((element) => `${element.className || element.tagName}: ${getComputedStyle(element).fontSize}`));
    expect(tooSmall, hash).toEqual([]);
  }
});

test('every button and link has a name screen readers can announce', async ({ page }) => {
  for (const hash of ['#/', '#/insights', '#/dashboard', '#/place/rajgad']) {
    await page.goto(`./${hash}`);
    await page.waitForLoadState('networkidle');
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('button, a[href], select, input:not([type="hidden"])')]
      .filter((element) => {
        const label = element.getAttribute('aria-label') || element.textContent.trim() || element.labels?.[0]?.textContent.trim() || element.getAttribute('title');
        return !label;
      })
      .map((element) => element.outerHTML.slice(0, 80)));
    expect(unnamed, hash).toEqual([]);
  }
});

test('with reduced motion, nothing animates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/dashboard');
  const duration = await page.locator('.dashboard-track i').first().evaluate((bar) => getComputedStyle(bar).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});
