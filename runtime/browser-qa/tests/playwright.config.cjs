const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: '**/audits.spec.cjs',
  workers: 1,
  retries: 0,
  use: { browserName: 'chromium', serviceWorkers: 'block' },
});
