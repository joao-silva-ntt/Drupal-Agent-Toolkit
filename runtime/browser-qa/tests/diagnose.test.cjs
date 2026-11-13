const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { diagnose } = require('../diagnose.cjs');

test('diagnostic reports missing, disabled and custom suites without executing profile commands', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-diagnose-'));
  try {
    assert.equal(diagnose(root).status, 'needs_attention');
    fs.mkdirSync(path.join(root, 'docs'));
    fs.mkdirSync(path.join(root, 'custom'));
    fs.writeFileSync(path.join(root, 'custom/package.json'), JSON.stringify({ name: 'custom-tests' }));
    fs.writeFileSync(path.join(root, 'docs/agent-project.json'), JSON.stringify({
      qa: {
        accessibility: { enabled: false },
        performance: { enabled: true, commands: [{ cwd: 'custom', argv: ['never-execute-this'] }] },
      },
    }));
    const before = fs.readdirSync(root);
    const result = diagnose(root);
    assert.equal(result.findings[0].status, 'disabled');
    assert.equal(result.findings[1].status, 'not_verified');
    assert.deepEqual(fs.readdirSync(root), before);
    fs.writeFileSync(path.join(root, 'docs/agent-project.json'), '{');
    assert.equal(diagnose(root).findings[0].status, 'blocked');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diagnostic accepts a root-level package and distinguishes dependencies from registration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-diagnose-'));
  try {
    fs.mkdirSync(path.join(root, 'docs'));
    const manifest = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8');
    fs.writeFileSync(path.join(root, 'package.json'), manifest);
    const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../qa.example.json'), 'utf8'));
    config.baseURL = 'http://fixture.test';
    config.allowedOrigins = [config.baseURL];
    fs.writeFileSync(path.join(root, 'qa.json'), JSON.stringify(config));
    const profile = { qa: Object.fromEntries(['accessibility', 'performance'].map((suite) => [
      suite, { enabled: true, commands: [{ cwd: '.', argv: ['node', 'run.cjs', suite] }] },
    ])) };
    const profileFile = path.join(root, 'docs/agent-project.json');
    fs.writeFileSync(profileFile, JSON.stringify(profile));
    let result = diagnose(root);
    assert.equal(result.findings[0].status, 'blocked');
    assert.match(result.findings[0].nextAction, /dependencies are missing/);
    fs.symlinkSync(path.resolve(__dirname, '../node_modules'), path.join(root, 'node_modules'), 'junction');
    result = diagnose(root);
    assert.equal(result.status, 'configured', JSON.stringify(result));
    assert.equal(result.findings[0].directory, '.');
    profile.qa.accessibility.enabled = undefined;
    fs.writeFileSync(profileFile, JSON.stringify(profile));
    assert.equal(diagnose(root).findings[0].status, 'not_verified');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('diagnostic reports malformed command settings and paths outside the project', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-diagnose-'));
  try {
    fs.mkdirSync(path.join(root, 'docs'));
    const file = path.join(root, 'docs/agent-project.json');
    for (const commands of ['invalid', [null], [{ cwd: 42, argv: ['node'] }], [{ cwd: '..', argv: ['node'] }]]) {
      fs.writeFileSync(file, JSON.stringify({ qa: { accessibility: { commands } } }));
      assert.equal(diagnose(root).findings[0].status, 'blocked');
    }
    fs.writeFileSync(file, 'null');
    assert.equal(diagnose(root).findings[0].status, 'blocked');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
