const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

test('real suite entry points emit passing desktop/mobile JSON reports', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'toolkit-browser-qa-'));
  const html = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Browser QA fixture</title></head><body><main><h1>Browser QA fixture</h1><p>Public fixture content.</p></main></body></html>';
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const baseURL = `http://127.0.0.1:${server.address().port}`;
    const configFile = path.join(directory, 'qa.json');
    const reportFile = path.join(directory, 'report.json');
    await fs.writeFile(configFile, JSON.stringify({
      baseURL, allowedOrigins: [baseURL], pages: [{ name: 'Fixture', path: '/' }],
      ignoreHTTPSErrors: false,
      budgets: { ttfbMs: 30000, loadMs: 30000, lcpMs: 30000, cls: 1, firstPartyTransferKb: 10000, firstPartyRequests: 100 },
    }));
    const cli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [
        cli, 'test', '--reporter=json', `--output=${path.join(directory, 'results')}`,
      ], {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env, BASE_URL: baseURL, QA_CONFIG: configFile, PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile },
        timeout: 90000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      child.stdout.on('data', (data) => { output += data; });
      child.stderr.on('data', (data) => { output += data; });
      child.once('error', reject);
      child.once('close', (code) => resolve({ code, output }));
    });
    assert.equal(result.code, 0, result.output);
    const report = JSON.parse(await fs.readFile(reportFile, 'utf8'));
    assert.equal(report.stats.expected, 4);
    assert.equal(report.stats.unexpected, 0);
    assert.equal(report.stats.skipped, 0);
    const tests = report.suites.flatMap((suite) => suite.specs.flatMap((spec) => spec.tests));
    assert.deepEqual(tests.map((entry) => entry.projectName).sort(), [
      'accessibility-desktop', 'accessibility-mobile', 'performance-desktop', 'performance-mobile',
    ]);
    for (const entry of tests) {
      const expectedAttachment = entry.projectName.startsWith('accessibility')
        ? 'axe-results.json' : 'performance-metrics.json';
      assert.ok(entry.results[0].attachments.some((item) => item.name === expectedAttachment));
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
