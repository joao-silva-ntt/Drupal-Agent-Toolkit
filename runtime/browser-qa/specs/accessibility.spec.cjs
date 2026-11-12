const { test } = require('@playwright/test');
const { loadConfig } = require('../config.cjs');
const { openPage, auditAccessibility } = require('../audits.cjs');

const config = loadConfig();

for (const target of config.pages) {
  test(`${target.name}: automated accessibility`, async ({ page }, testInfo) => {
    await openPage(page, config, target);
    await auditAccessibility(page, testInfo);
  });
}
