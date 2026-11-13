const fs = require('node:fs');
const path = require('node:path');

const budgetNames = [
  'ttfbMs', 'loadMs', 'lcpMs', 'cls', 'firstPartyTransferKb', 'firstPartyRequests',
];

function origin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Targets and allowedOrigins must be HTTP(S) origins without credentials or paths.');
  }
  if (url.hostname.endsWith('.invalid')) {
    throw new Error('Replace the example.invalid target with an explicitly approved site.');
  }
  return url.origin;
}

function validateConfig(config, baseOverride, suite = 'all') {
  if (!config || !Array.isArray(config.allowedOrigins) || !config.allowedOrigins.length) {
    throw new Error('Configure a non-empty allowedOrigins list before running browser QA.');
  }
  const allowedOrigins = config.allowedOrigins.map(origin);
  const baseURL = origin(baseOverride || config.baseURL);
  if (!allowedOrigins.includes(baseURL)) {
    throw new Error('BASE_URL is not in the configured allowedOrigins list.');
  }
  if (!Array.isArray(config.pages) || !config.pages.length) {
    throw new Error('Configure at least one public page.');
  }
  const names = new Set();
  for (const page of config.pages) {
    if (!page || typeof page.name !== 'string' || !page.name.trim()
        || names.has(page.name) || typeof page.path !== 'string'
        || !page.path.startsWith('/') || page.path.startsWith('//')
        || new URL(page.path, baseURL).origin !== baseURL) {
      throw new Error('Each page needs a unique name and a same-origin path starting with /.');
    }
    names.add(page.name);
    if (page.readySelector !== undefined
        && (typeof page.readySelector !== 'string' || !page.readySelector.trim())) {
      throw new Error('readySelector must be a non-empty selector.');
    }
    if (page.keyboard !== undefined && (!Array.isArray(page.keyboard) || page.keyboard.some(
      (step) => !step || typeof step.selector !== 'string' || !step.selector.trim()
        || !Number.isInteger(step.tabs) || step.tabs < 1 || step.tabs > 100,
    ))) {
      throw new Error('keyboard steps require a selector and tabs between 1 and 100.');
    }
  }
  if (suite !== 'accessibility') {
    for (const name of budgetNames) {
      if (!Number.isFinite(config.budgets?.[name]) || config.budgets[name] <= 0) {
        throw new Error(`budgets.${name} must be a positive number.`);
      }
    }
  }
  const performance = { samples: 3, observationMs: 2000, ...config.performance };
  if (suite !== 'accessibility' && (!Number.isInteger(performance.samples) || performance.samples < 3 || performance.samples > 9
      || performance.samples % 2 !== 1 || !Number.isInteger(performance.observationMs)
      || performance.observationMs < 100 || performance.observationMs > 30000)) {
    throw new Error('performance requires 3-9 odd samples and observationMs between 100 and 30000.');
  }
  const browsers = config.accessibility?.browsers || ['chromium'];
  if (suite !== 'performance' && (!Array.isArray(browsers) || !browsers.length
      || new Set(browsers).size !== browsers.length
      || browsers.some((browser) => !['chromium', 'firefox', 'webkit'].includes(browser)))) {
    throw new Error('accessibility.browsers must list unique supported browsers.');
  }
  if (typeof config.ignoreHTTPSErrors !== 'boolean') {
    throw new Error('ignoreHTTPSErrors must explicitly be true or false.');
  }
  return { ...config, baseURL, allowedOrigins, performance, accessibility: { browsers } };
}

function loadConfig(suite = process.env.QA_SUITE || 'all') {
  const file = path.resolve(process.env.QA_CONFIG || path.join(__dirname, 'qa.json'));
  if (!fs.existsSync(file)) {
    throw new Error('Browser QA is not configured. Copy qa.example.json to qa.json and approve its targets and budgets.');
  }
  return validateConfig(JSON.parse(fs.readFileSync(file, 'utf8')), process.env.BASE_URL, suite);
}

module.exports = { budgetNames, validateConfig, loadConfig };
