const { test } = require('@playwright/test');
const { loadConfig } = require('../config.cjs');
const { openPage, preparePerformance, auditPerformance } = require('../audits.cjs');

const config = loadConfig();

for (const target of config.pages) {
  test(`${target.name}: performance budgets`, async ({ page }, testInfo) => {
    const count = await preparePerformance(page, config.baseURL);
    await openPage(page, config, target);
    await auditPerformance(page, testInfo, config, count);
  });
}
