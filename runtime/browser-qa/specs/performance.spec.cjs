const { test } = require('@playwright/test');
const { loadConfig } = require('../config.cjs');
const { openPage, preparePerformance, measurePerformance, reportPerformance } = require('../audits.cjs');

const config = loadConfig('performance');

for (const target of config.pages) {
  test(`${target.name}: performance budgets`, async ({ browser }, testInfo) => {
    const samples = [];
    for (let index = 0; index < config.performance.samples; index++) {
      const options = Object.fromEntries([
        'viewport', 'userAgent', 'deviceScaleFactor', 'isMobile', 'hasTouch',
      ].filter((key) => testInfo.project.use[key] !== undefined)
        .map((key) => [key, testInfo.project.use[key]]));
      const context = await browser.newContext({
        ...options, baseURL: config.baseURL,
        ignoreHTTPSErrors: config.ignoreHTTPSErrors, serviceWorkers: 'block',
      });
      try {
        const page = await context.newPage();
        const count = await preparePerformance(page, config.baseURL);
        await openPage(page, config, target);
        samples.push(await measurePerformance(page, config, count));
        if (index === config.performance.samples - 1) {
          await reportPerformance(page, testInfo, config, samples);
        }
      } finally {
        await context.close();
      }
    }
  });
}
