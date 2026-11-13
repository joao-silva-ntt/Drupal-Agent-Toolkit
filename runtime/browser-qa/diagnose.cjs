const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { validateConfig } = require('./config.cjs');

function diagnose(project) {
  const findings = [];
  const profileFile = path.join(project, 'docs/agent-project.json');
  let profile = {};
  if (fs.existsSync(profileFile)) {
    try {
      profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        profile = {};
        throw new Error('Expected a profile object.');
      }
    } catch (error) {
      findings.push({ status: 'blocked', component: 'profile', message: `Invalid project profile: ${error.message}` });
    }
  } else {
    findings.push({ status: 'missing', component: 'profile', message: 'Project QA profile is missing; approve creating it.' });
  }
  for (const suite of ['accessibility', 'performance']) {
    const settings = profile.qa?.[suite];
    if (settings !== undefined && (!settings || typeof settings !== 'object' || Array.isArray(settings))) {
      findings.push({ suite, status: 'blocked', message: 'Suite settings must be an object.' });
      continue;
    }
    if (settings?.enabled === false) {
      findings.push({ suite, status: 'disabled', message: 'Suite is explicitly disabled; approval is required to enable it.' });
      continue;
    }
    const commands = settings?.commands ?? [];
    if (!Array.isArray(commands)) {
      findings.push({ suite, status: 'blocked', message: 'Profile commands must be an array.' });
      continue;
    }
    if (commands.some((command) => !command || typeof command !== 'object'
        || (command.cwd !== undefined && typeof command.cwd !== 'string')
        || !Array.isArray(command.argv) || !command.argv.length
        || command.argv.some((argument) => typeof argument !== 'string'))) {
      findings.push({ suite, status: 'blocked', message: 'Each command needs an argv string array and a string working directory when specified.' });
      continue;
    }
    const directories = [...new Set(commands.map((command) => command.cwd || '.'))];
    if (!directories.length) directories.push('tools/browser-qa');
    for (const relative of directories) {
      const directory = path.resolve(project, relative);
      const outside = (candidate) => {
        const relativePath = path.relative(fs.realpathSync(project), candidate);
        return relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);
      };
      if (outside(directory) || path.isAbsolute(relative)
          || (fs.existsSync(directory) && outside(fs.realpathSync(directory)))) {
        findings.push({ suite, status: 'blocked', message: 'Configured test directory is outside the project.' });
        continue;
      }
      const result = { suite, directory: relative, status: 'not_verified', checks: [], nextAction: 'Review existing tests before adding tooling.' };
      findings.push(result);
      const manifestFile = path.join(directory, 'package.json');
      if (!fs.existsSync(manifestFile)) {
        result.status = 'missing';
        result.nextAction = 'No package found at the configured/default location; inspect project tests and request approval for missing setup.';
        continue;
      }
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        const bundled = manifest.name === 'drupal-agent-toolkit-browser-qa';
        if (!bundled) {
          result.checks.push({ component: 'existing_suite', status: 'not_verified', message: 'Existing custom package found. Reuse its configured tests; this diagnostic does not execute arbitrary commands.' });
          continue;
        }
        const configFile = path.join(directory, 'qa.json');
        if (!fs.existsSync(configFile)) throw new Error('qa.json is missing; approve target/page configuration.');
        const config = validateConfig(JSON.parse(fs.readFileSync(configFile, 'utf8')), undefined, suite);
        result.checks.push({ component: 'configuration', status: 'configured' });
        const requireFromProject = createRequire(manifestFile);
        const required = ['@playwright/test', ...(suite === 'accessibility' ? ['@axe-core/playwright'] : [])];
        for (const dependency of required) {
          let packageDirectory = path.dirname(requireFromProject.resolve(dependency));
          let installed;
          while (installed === undefined) {
            const packageFile = path.join(packageDirectory, 'package.json');
            if (fs.existsSync(packageFile)) {
              const metadata = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
              if (metadata.name === dependency) installed = metadata.version;
            }
            const parent = path.dirname(packageDirectory);
            if (installed === undefined && parent === packageDirectory) {
              throw new Error(`Cannot locate ${dependency} version metadata.`);
            }
            packageDirectory = parent;
          }
          if (installed !== manifest.devDependencies?.[dependency]) {
            throw new Error(`${dependency} does not match the declared pinned version; approve lockfile installation.`);
          }
          result.checks.push({ component: dependency, status: 'installed', version: installed });
        }
        const playwright = requireFromProject('@playwright/test');
        for (const name of suite === 'performance' ? ['chromium'] : config.accessibility.browsers) {
          const executable = playwright[name].executablePath();
          if (!fs.existsSync(executable)) throw new Error(`${name} browser executable is missing; approve its installation.`);
          result.checks.push({ component: name, status: 'installed' });
        }
        const registered = settings?.enabled === true && commands.length > 0;
        result.status = registered ? 'configured' : 'not_verified';
        result.nextAction = registered
          ? 'Obtain audit approval and run the configured tests; OS libraries, site reachability and actual execution are not verified.'
          : 'Package prerequisites exist, but the project profile does not enable and register this suite; obtain configuration approval.';
      } catch (error) {
        result.status = 'blocked';
        result.nextAction = error.code === 'MODULE_NOT_FOUND'
          ? 'Declared test dependencies are missing; approve lockfile installation.'
          : error.message;
      }
    }
  }
  return {
    environment: { platform: process.platform, node: process.version, wsl: Boolean(process.env.WSL_DISTRO_NAME) },
    status: findings.every((item) => item.status === 'configured') ? 'configured' : 'needs_attention',
    findings, limitations: 'Read-only file/package inspection; no test, browser, install, profile command or network request was executed.',
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--project' || !fs.existsSync(args[1]) || !fs.statSync(args[1]).isDirectory()) {
    console.error('Usage: node diagnose.cjs --project PATH_TO_PROJECT');
    process.exitCode = 2;
  } else {
    const result = diagnose(fs.realpathSync(args[1]));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'configured' ? 0 : 2;
  }
}

module.exports = { diagnose };
