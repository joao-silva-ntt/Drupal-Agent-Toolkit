const { defineConfig, devices } = require('@playwright/test');
const { loadConfig } = require('./config.cjs');

const suite = process.env.QA_SUITE;
const config = loadConfig(suite || 'all');
const accessibilityProjects = suite === 'performance' ? [] : config.accessibility.browsers.flatMap((browser) => [
  {
    name: browser === 'chromium' ? 'accessibility-desktop' : `accessibility-${browser}`,
    testMatch: '**/accessibility.spec.cjs',
    use: devices[{ chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }[browser]],
  },
  ...(browser === 'chromium' ? [{
    name: 'accessibility-mobile', testMatch: '**/accessibility.spec.cjs', use: devices['Pixel 5'],
  }] : []),
]);

module.exports = defineConfig({
  testDir: './specs',
  workers: 1,
  retries: 0,
  timeout: 360000,
  reporter: [['list'], ['html', { open: 'never' }], ['json']],
  use: {
    baseURL: config.baseURL,
    ignoreHTTPSErrors: config.ignoreHTTPSErrors,
    serviceWorkers: 'block',
  },
  projects: [
    ...(suite === 'performance' ? [] : accessibilityProjects),
    ...(suite === 'accessibility' ? [] : [
    { name: 'performance-desktop', testMatch: '**/performance.spec.cjs', use: devices['Desktop Chrome'] },
    { name: 'performance-mobile', testMatch: '**/performance.spec.cjs', use: devices['Pixel 5'] },
    ]),
  ],
});
