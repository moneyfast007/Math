import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production build (vite preview) so that the
 * service worker, manifest and headers match what Cloudflare Pages serves.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    locale: 'he-IL',
    // Most specs walk through design A of the entry screen and the parents' area; the
    // default design (C) has its own spec, which switches with ?ui=c.
    storageState: {
      cookies: [],
      origins: [
        { origin: 'http://localhost:4173', localStorage: [{ name: 'ui-variant', value: 'a' }] },
      ],
    },
  },
  projects: [
    {
      // Primary target: iPad in landscape, WebKit engine (same as Safari).
      name: 'ipad',
      use: { ...devices['iPad (gen 7) landscape'] },
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
