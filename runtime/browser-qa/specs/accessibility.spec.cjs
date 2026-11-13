const { test } = require('@playwright/test');
const { loadConfig } = require('../config.cjs');
const { openPage, auditAccessibility, auditLayoutAndKeyboard } = require('../audits.cjs');

const config = loadConfig('accessibility');

for (const target of config.pages) {
  test(`${target.name}: automated accessibility`, async ({ page }, testInfo) => {
    await openPage(page, config, target);
    await auditAccessibility(page, testInfo);
    await auditLayoutAndKeyboard(page, testInfo, target);
  });
}
