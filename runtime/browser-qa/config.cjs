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

function validateConfig(config, baseOverride) {
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
  }
  for (const name of budgetNames) {
    if (!Number.isFinite(config.budgets?.[name]) || config.budgets[name] <= 0) {
      throw new Error(`budgets.${name} must be a positive number.`);
    }
  }
  if (typeof config.ignoreHTTPSErrors !== 'boolean') {
    throw new Error('ignoreHTTPSErrors must explicitly be true or false.');
  }
  return { ...config, baseURL, allowedOrigins };
}

function loadConfig() {
  const file = path.resolve(process.env.QA_CONFIG || path.join(__dirname, 'qa.json'));
  if (!fs.existsSync(file)) {
    throw new Error('Browser QA is not configured. Copy qa.example.json to qa.json and approve its targets and budgets.');
  }
  return validateConfig(JSON.parse(fs.readFileSync(file, 'utf8')), process.env.BASE_URL);
}

module.exports = { budgetNames, validateConfig, loadConfig };
