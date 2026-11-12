const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateConfig } = require('../config.cjs');

function config() {
  return {
    baseURL: 'http://localhost:8123',
    allowedOrigins: ['http://localhost:8123'],
    pages: [{ name: 'Home', path: '/' }],
    ignoreHTTPSErrors: false,
    budgets: { ttfbMs: 2500, loadMs: 15000, lcpMs: 5000, cls: 0.1, firstPartyTransferKb: 4096, firstPartyRequests: 200 },
  };
}

test('requires a configured, approved origin even when BASE_URL overrides the target', () => {
  assert.throws(() => validateConfig({ ...config(), allowedOrigins: [] }), /allowedOrigins/);
  assert.throws(() => validateConfig(config(), 'https://other.invalid'), /approved site/);
  assert.throws(() => validateConfig(config(), 'https://other.test'), /not in/);
  assert.throws(() => validateConfig({ ...config(), baseURL: 'http://user:pass@localhost:8123' }), /credentials/);
  assert.equal(validateConfig(config()).baseURL, 'http://localhost:8123');
});

test('rejects external page paths, empty page lists and duplicate names', () => {
  for (const path of ['//other.test', '/\\other.test', 'https://other.test']) {
    assert.throws(() => validateConfig({ ...config(), pages: [{ name: 'Home', path }] }), /same-origin/);
  }
  assert.throws(() => validateConfig({ ...config(), pages: [] }), /at least one/);
  assert.throws(() => validateConfig({ ...config(), pages: [config().pages[0], config().pages[0]] }), /unique/);
});

test('rejects missing and invalid budgets instead of silently using defaults', () => {
  for (const value of [undefined, 0, -1, '5000', Infinity]) {
    const data = config();
    data.budgets.lcpMs = value;
    assert.throws(() => validateConfig(data), /lcpMs/);
  }
});
