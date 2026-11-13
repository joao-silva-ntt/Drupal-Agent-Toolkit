const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const suite = process.argv[2];
if (!['accessibility', 'performance'].includes(suite)) {
  console.error('Usage: node run.cjs accessibility|performance [Playwright options]');
  process.exitCode = 2;
} else {
  const reportRoot = process.env.QA_REPORT_ROOT || (process.env.PLAYWRIGHT_JSON_OUTPUT_NAME
    ? path.dirname(path.resolve(process.env.PLAYWRIGHT_JSON_OUTPUT_NAME)) : __dirname);
  const directory = fs.mkdtempSync(path.join(reportRoot, `reports-${suite}-`));
  console.log(`QA reports: ${directory}`);
  const cli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
  const child = spawn(process.execPath, [
    cli, 'test', `--output=${path.join(directory, 'test-results')}`, ...process.argv.slice(3),
  ], {
    cwd: __dirname,
    env: {
      ...process.env,
      QA_SUITE: suite,
      PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(directory, 'html'),
      PLAYWRIGHT_JSON_OUTPUT_NAME: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || path.join(directory, 'results.json'),
    },
    stdio: 'inherit',
  });
  child.once('error', (error) => { console.error(error.message); process.exitCode = 2; });
  child.once('exit', (code, signal) => {
    if (signal) console.error(`Playwright terminated by ${signal}`);
    process.exitCode = code ?? 2;
  });
}
