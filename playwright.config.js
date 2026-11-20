import { defineConfig, devices } from '@playwright/test';

// Browser tests for the language menu, page addresses and the responsive layout. They run
// against the production build (`vite preview`), the same files GitHub Pages serves.

// In GitHub Actions, vite.config.js builds the site under /durgdrishti/ (as on GitHub Pages);
// locally it uses relative paths. The tests must open the site at the same path, otherwise
// `page.goto('./#/…')` lands on a different path and reloads the page instead of changing the hash.
const basePath = process.env.GITHUB_ACTIONS === 'true' ? '/durgdrishti/' : '/';
const siteUrl = `http://localhost:4173${basePath}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: siteUrl, trace: 'on-first-retry' },
  projects: [
    { name: 'small-phone', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: siteUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
