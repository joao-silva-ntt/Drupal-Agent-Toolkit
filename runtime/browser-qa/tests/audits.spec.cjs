const { test, expect } = require('@playwright/test');
const { auditAccessibility, auditLayoutAndKeyboard, preparePerformance, auditPerformance, openPage, reportPerformance } = require('../audits.cjs');

const html = '<!doctype html><html lang="en"><head><title>Fixture page</title></head><body><main><h1>Fixture heading</h1><p>Public content for browser QA.</p></main></body></html>';
const config = {
  baseURL: 'http://fixture.test',
  allowedOrigins: ['http://fixture.test'],
  budgets: { ttfbMs: 30000, loadMs: 30000, lcpMs: 30000, cls: 1, firstPartyTransferKb: 10000, firstPartyRequests: 100 },
};

test('axe passes a semantic fixture and reports an unnamed button', async ({ page }) => {
  const attachments = [];
  const info = { attach: async (name, data) => attachments.push({ name, data }) };
  await page.setContent(html);
  await auditAccessibility(page, info);
  await page.locator('main').evaluate((main) => main.insertAdjacentHTML('beforeend', '<button></button>'));
  await expect(auditAccessibility(page, info)).rejects.toThrow();
  const report = JSON.parse(attachments.at(-1).data.body.toString());
  expect(report.violations.some((violation) => violation.id === 'button-name')).toBe(true);
});

test('performance records metrics, enforces budgets and rejects missing LCP', async ({ page }) => {
  await page.route('http://fixture.test/**', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  const count = await preparePerformance(page, config.baseURL);
  await page.goto(config.baseURL, { waitUntil: 'load' });
  const attachments = [];
  const info = { project: { name: 'fixture' }, attach: async (name, data) => attachments.push({ name, data }) };
  await auditPerformance(page, info, config, count);
  const report = JSON.parse(attachments[0].data.body.toString());
  expect(report.metrics.firstPartyRequests).toBeGreaterThanOrEqual(1);
  expect(report.metrics.lcpMs).toBeGreaterThan(0);
  await expect(auditPerformance(page, info, {
    ...config, budgets: { ...config.budgets, lcpMs: 0.001 },
  }, count)).rejects.toThrow(/lcpMs/);
  await page.evaluate(() => { window.__toolkitMetrics.lcpMs = 0; });
  await expect(auditPerformance(page, info, config, count)).rejects.toThrow(/LCP must be observed/);
});

test('a navigation ending outside the target fails explicitly', async ({ page }) => {
  await page.route('**/*', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await expect(openPage(page, config, { path: 'http://unapproved.test/' })).rejects.toThrow(/redirected outside/);
});

test('keyboard destinations and narrow layout expose regressions', async ({ page, browser }, testInfo) => {
  await page.setContent(html.replace('</main>', '<button id="action">Read more</button></main>'));
  await auditLayoutAndKeyboard(page, testInfo, { keyboard: [{ selector: '#action', tabs: 1 }] });
  await page.setContent(html.replace('</main>', '<button id="action" tabindex="-1">Read more</button></main>'));
  await expect(auditLayoutAndKeyboard(page, testInfo, {
    keyboard: [{ selector: '#action', tabs: 1 }],
  })).rejects.toThrow(/focus/);
  await page.setContent(html.replace('<main>', '<main style="width: 900px">'));
  await expect(auditLayoutAndKeyboard(page, testInfo, {})).rejects.toThrow(/overflow/);
  const context = await browser.newContext({ isMobile: true, viewport: { width: 320, height: 900 } });
  try {
    const mobile = await context.newPage();
    await mobile.setContent(html);
    await expect(auditLayoutAndKeyboard(mobile, testInfo, {})).rejects.toThrow(/layout viewport/);
  } finally {
    await context.close();
  }
});

test('performance budgets use medians but missing samples never pass', async ({ page }) => {
  await page.setContent(html);
  const captured = [];
  const info = { project: { name: 'fixture' }, attach: async (name, data) => captured.push(JSON.parse(data.body)) };
  const sample = {
    ttfbMs: 1, loadMs: 10, lcpMs: 10, cls: 0, firstPartyTransferKb: 1,
    firstPartyRequests: 1, totalRequests: 2, observableTotalTransferKb: 1, opaqueCrossOriginResources: 1,
  };
  await reportPerformance(page, info, config, [sample, { ...sample, lcpMs: 99999 }, sample]);
  expect(captured[0].metrics.lcpMs).toBe(10);
  expect(captured[0].samples).toHaveLength(3);
  await expect(reportPerformance(page, info, config, [sample, { ...sample, lcpMs: 0 }, sample]))
    .rejects.toThrow(/LCP must be observed/);
  await expect(reportPerformance(page, info, config, [sample, { ...sample, ttfbMs: -1 }, sample]))
    .rejects.toThrow(/ttfbMs must be a finite/);
});
