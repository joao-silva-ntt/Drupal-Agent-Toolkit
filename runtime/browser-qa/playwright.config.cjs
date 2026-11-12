const { defineConfig, devices } = require('@playwright/test');
const { loadConfig } = require('./config.cjs');

const config = loadConfig();

module.exports = defineConfig({
  testDir: './specs',
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: config.baseURL,
    ignoreHTTPSErrors: config.ignoreHTTPSErrors,
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'accessibility-desktop', testMatch: '**/accessibility.spec.cjs', use: devices['Desktop Chrome'] },
    { name: 'accessibility-mobile', testMatch: '**/accessibility.spec.cjs', use: devices['Pixel 5'] },
    { name: 'performance-desktop', testMatch: '**/performance.spec.cjs', use: devices['Desktop Chrome'] },
    { name: 'performance-mobile', testMatch: '**/performance.spec.cjs', use: devices['Pixel 5'] },
  ],
});
