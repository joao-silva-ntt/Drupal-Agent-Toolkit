const { expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { budgetNames } = require('./config.cjs');

async function attach(testInfo, name, data) {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(data, null, 2)),
    contentType: 'application/json',
  });
}

async function openPage(page, config, target) {
  const response = await page.goto(target.path, { waitUntil: 'load' });
  expect(response?.status(), 'The configured public page must return HTTP 200.').toBe(200);
  expect(new URL(page.url()).origin, 'Navigation redirected outside the approved target.').toBe(config.baseURL);
}

async function auditAccessibility(page, testInfo) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await attach(testInfo, 'axe-results.json', results);
  expect(results.violations, 'Automated axe violations; see axe-results.json.').toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('lang', /\S+/);
  expect((await page.title()).trim(), 'Page title must not be empty.').not.toBe('');
}

async function preparePerformance(page, baseURL) {
  let firstPartyRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).origin === baseURL) firstPartyRequests++;
  });
  await page.addInitScript(() => {
    const metrics = { lcpMs: 0, cls: 0, sessionValue: 0, sessionStart: 0, lastShift: 0 };
    window.__toolkitMetrics = metrics;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.lcpMs = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        if (entry.startTime - metrics.lastShift > 1000
            || entry.startTime - metrics.sessionStart > 5000) {
          metrics.sessionValue = 0;
          metrics.sessionStart = entry.startTime;
        }
        metrics.sessionValue += entry.value;
        metrics.lastShift = entry.startTime;
        metrics.cls = Math.max(metrics.cls, metrics.sessionValue);
      }
    }).observe({ type: 'layout-shift', buffered: true });
    performance.setResourceTimingBufferSize(10000);
  });
  return () => firstPartyRequests;
}

async function auditPerformance(page, testInfo, config, requestCount) {
  // Use a fixed post-load observation window, not networkidle on streaming pages.
  await page.waitForTimeout(2000);
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation || !window.__toolkitMetrics) throw new Error('Performance instrumentation is missing.');
    const resources = performance.getEntriesByType('resource')
      .filter((entry) => new URL(entry.name).origin === location.origin);
    return {
      ttfbMs: navigation.responseStart - navigation.requestStart,
      loadMs: navigation.loadEventEnd - navigation.startTime,
      lcpMs: window.__toolkitMetrics.lcpMs,
      cls: window.__toolkitMetrics.cls,
      firstPartyTransferKb: (navigation.transferSize
        + resources.reduce((sum, entry) => sum + entry.transferSize, 0)) / 1024,
    };
  });
  metrics.firstPartyRequests = requestCount();
  await attach(testInfo, 'performance-metrics.json', {
    url: page.url(), project: testInfo.project.name, metrics, budgets: config.budgets,
    observationMs: 2000, scope: 'Cold-context Chromium lab; transfer and requests are first-party only. No video exclusions.',
  });
  expect(metrics.lcpMs, 'LCP must be observed; a missing measurement is not a pass.').toBeGreaterThan(0);
  expect(metrics.loadMs, 'The load event must be measured.').toBeGreaterThan(0);
  for (const name of budgetNames) {
    expect(metrics[name], `${name} exceeds the configured budget.`).toBeLessThanOrEqual(config.budgets[name]);
  }
}

module.exports = { openPage, auditAccessibility, preparePerformance, auditPerformance };
