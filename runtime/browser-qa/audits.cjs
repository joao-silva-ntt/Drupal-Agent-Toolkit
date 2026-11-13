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
  if (target.readySelector) await page.locator(target.readySelector).waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
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

async function auditLayoutAndKeyboard(page, testInfo, target) {
  const steps = target.keyboard || [];
  for (const step of steps) {
    for (let index = 0; index < step.tabs; index++) await page.keyboard.press('Tab');
    await expect(page.locator(step.selector), 'Configured keyboard destination must receive focus.').toBeFocused();
    await expect(page.locator(step.selector)).toBeInViewport();
    await testInfo.attach(`keyboard-focus-${steps.indexOf(step)}.png`, {
      body: await page.screenshot(), contentType: 'image/png',
    });
  }
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth,
  }));
  await attach(testInfo, 'layout-keyboard.json', {
    dimensions, keyboardSteps: steps.length,
    manualReview: 'Review focus screenshots for visible/obscured focus. Overflow may be valid for two-dimensional content; inspect before claiming a WCAG failure.',
  });
  await page.setViewportSize(viewport);
  expect(dimensions.viewport, 'The layout viewport must be at most 320 CSS pixels; review the viewport configuration.')
    .toBeLessThanOrEqual(320);
  expect(dimensions.content, 'Horizontal overflow at 320px needs review (not an automatic WCAG conformance verdict).')
    .toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function preparePerformance(page, baseURL) {
  let firstPartyRequests = 0;
  let totalRequests = 0;
  page.on('request', (request) => {
    totalRequests++;
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
  return () => ({ firstPartyRequests, totalRequests });
}

async function measurePerformance(page, config, requestCount) {
  // Use a fixed post-load observation window, not networkidle on streaming pages.
  await page.waitForTimeout(config.performance?.observationMs ?? 2000);
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation || !window.__toolkitMetrics) throw new Error('Performance instrumentation is missing.');
    const resources = performance.getEntriesByType('resource')
      .filter((entry) => new URL(entry.name).origin === location.origin);
    const allResources = performance.getEntriesByType('resource');
    return {
      ttfbMs: navigation.responseStart - navigation.requestStart,
      loadMs: navigation.loadEventEnd - navigation.startTime,
      lcpMs: window.__toolkitMetrics.lcpMs,
      cls: window.__toolkitMetrics.cls,
      firstPartyTransferKb: (navigation.transferSize
        + resources.reduce((sum, entry) => sum + entry.transferSize, 0)) / 1024,
      observableTotalTransferKb: (navigation.transferSize
        + allResources.reduce((sum, entry) => sum + entry.transferSize, 0)) / 1024,
      opaqueCrossOriginResources: allResources.filter((entry) =>
        new URL(entry.name).origin !== location.origin && entry.transferSize === 0).length,
    };
  });
  Object.assign(metrics, requestCount());
  return metrics;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function reportPerformance(page, testInfo, config, samples) {
  const metrics = Object.fromEntries(Object.keys(samples[0]).map(
    (name) => [name, median(samples.map((sample) => sample[name]))],
  ));
  await attach(testInfo, 'performance-metrics.json', {
    url: page.url(), project: testInfo.project.name, metrics, samples, aggregation: 'median',
    budgets: config.budgets, observationMs: config.performance?.observationMs ?? 2000,
    scope: 'Fresh-context Chromium lab; budgets are first-party. Observable total transfer excludes opaque cross-origin bytes; see opaqueCrossOriginResources. No video exclusions.',
  });
  for (const sample of samples) {
    for (const name of budgetNames) {
      expect(Number.isFinite(sample[name]) && sample[name] >= 0,
        `${name} must be a finite non-negative measurement in every sample.`).toBe(true);
    }
    expect(sample.lcpMs, 'LCP must be observed in every sample; missing data is not a pass.').toBeGreaterThan(0);
    expect(sample.loadMs, 'The load event must be measured.').toBeGreaterThan(0);
  }
  for (const name of budgetNames) {
    expect(metrics[name], `${name} exceeds the configured budget.`).toBeLessThanOrEqual(config.budgets[name]);
  }
}

async function auditPerformance(page, testInfo, config, requestCount) {
  await reportPerformance(page, testInfo, config, [await measurePerformance(page, config, requestCount)]);
}

module.exports = {
  openPage, auditAccessibility, auditLayoutAndKeyboard, preparePerformance,
  auditPerformance, measurePerformance, reportPerformance, median,
};
