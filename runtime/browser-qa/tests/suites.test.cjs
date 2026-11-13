const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

test('real suite entry points emit passing desktop/mobile JSON reports', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'toolkit-browser-qa-'));
  const html = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Browser QA fixture</title></head><body><main><h1>Browser QA fixture</h1><p>Public fixture content.</p><button id="action">Read more</button></main></body></html>';
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
      baseURL, allowedOrigins: [baseURL], pages: [{ name: 'Fixture', path: '/', readySelector: 'main', keyboard: [{ selector: '#action', tabs: 1 }] }],
      ignoreHTTPSErrors: false,
      accessibility: { browsers: process.env.QA_TEST_CROSS_BROWSER ? ['chromium', 'firefox', 'webkit'] : ['chromium'] },
      performance: { samples: 3, observationMs: 200 },
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
    assert.equal(report.stats.expected, process.env.QA_TEST_CROSS_BROWSER ? 6 : 4);
    assert.equal(report.stats.unexpected, 0);
    assert.equal(report.stats.skipped, 0);
    const tests = report.suites.flatMap((suite) => suite.specs.flatMap((spec) => spec.tests));
    assert.deepEqual(tests.map((entry) => entry.projectName).sort(), [
      'accessibility-desktop', 'accessibility-mobile', 'performance-desktop', 'performance-mobile',
      ...(process.env.QA_TEST_CROSS_BROWSER ? ['accessibility-firefox', 'accessibility-webkit'] : []),
    ].sort());
    for (const entry of tests) {
      const expectedAttachment = entry.projectName.startsWith('accessibility')
        ? 'axe-results.json' : 'performance-metrics.json';
      assert.ok(entry.results[0].attachments.some((item) => item.name === expectedAttachment));
      if (entry.projectName.startsWith('performance')) {
        const attachment = entry.results[0].attachments.find((item) => item.name === expectedAttachment);
        const metrics = JSON.parse(attachment.path
          ? await fs.readFile(attachment.path, 'utf8')
          : Buffer.from(attachment.body, 'base64').toString('utf8'));
        assert.equal(metrics.samples.length, 3);
        assert.equal(metrics.aggregation, 'median');
      }
    }
    const accessibilityConfig = JSON.parse(await fs.readFile(configFile, 'utf8'));
    delete accessibilityConfig.budgets;
    await fs.writeFile(configFile, JSON.stringify(accessibilityConfig));
    for (let run = 0; run < 2; run++) {
      const wrapper = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['run.cjs', 'accessibility'], {
          cwd: path.resolve(__dirname, '..'),
          env: {
            ...process.env, BASE_URL: baseURL, QA_CONFIG: configFile,
            QA_REPORT_ROOT: run === 0 ? directory : '',
            PLAYWRIGHT_JSON_OUTPUT_NAME: run === 0 ? '' : path.join(directory, 'runner-command.json'),
          },
          timeout: 90000,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let output = '';
        child.stdout.on('data', (data) => { output += data; });
        child.stderr.on('data', (data) => { output += data; });
        child.once('error', reject);
        child.once('close', (code) => resolve({ code, output }));
      });
      assert.equal(wrapper.code, 0, wrapper.output);
    }
    const runs = (await fs.readdir(directory)).filter((name) => name.startsWith('reports-accessibility-'));
    assert.equal(runs.length, 2, 'Each command must preserve the previous report.');
    for (const run of runs) {
      const entries = await fs.readdir(path.join(directory, run));
      const report = entries.includes('results.json')
        ? path.join(directory, run, 'results.json') : path.join(directory, 'runner-command.json');
      const saved = JSON.parse(await fs.readFile(report, 'utf8'));
      assert.equal(saved.stats.expected, process.env.QA_TEST_CROSS_BROWSER ? 4 : 2);
      assert.equal(saved.stats.unexpected, 0);
      assert.equal((await fs.stat(path.join(directory, run, 'html/index.html'))).isFile(), true);
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
