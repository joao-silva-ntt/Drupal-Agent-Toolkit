# Optional accessibility and performance tests

These are project-neutral, anonymous browser checks. Installing the Copilot
plugin does not install dependencies, launch a browser, or run these tests.

## Ask the agent to set it up

In your project's Copilot chat, select **Accessibility Expert** or
**Performance QA** and ask:

> Check whether my tests are ready. If anything is missing, ask for the
> approvals you need, set up the tests for me, and run them against my
> approved site.

The agent inspects the existing setup first and reuses suitable tests. If
setup is needed, it asks for the site URL/pages, report location, relevant
budgets, and permission to add test files and download dependencies/browser.
It then performs the approved work, verifies the tests actually run, and
reports the results. You do not need to copy files or configure tests yourself.
Subsequent requests reuse the setup. Site fixes are not part of test setup.

## Setup reference for agents

Follow the quality-audit skill's readiness and approval workflow before these
steps. Do not copy over existing tests or local configuration. Resolve the
paths below within the adopting project, not the plugin's cached folder.

1. Locate this plugin's bundled `runtime/browser-qa` folder and copy its
   package files into the approved project location, normally
   `tools/browser-qa`. Include `.gitignore` and the lockfile; exclude local
   `qa.json`, dependencies, caches and reports.
2. Verify a supported Node.js LTS release with npm is available. If absent,
   report the prerequisite and request installation approval; do not install
   a system runtime automatically. With dependency/browser approval, run
   the missing setup steps in the approved environment:

   ```sh
   cd tools/browser-qa
   npm ci
   npx playwright install chromium
   ```

   These commands download packages and a browser. If Playwright reports
   missing operating-system libraries, report the exact blocker and request
   separate approval before changing the environment.
3. Copy `qa.example.json` to `qa.json` in this folder.
4. Configure `qa.json` using the confirmed project facts:
   - Replace both `https://example.invalid` values with your explicitly
     approved site's origin (scheme, hostname and port, without a page path).
   - Set `pages` to the public pages you want to check. Each page needs a
     unique `name` and a relative `path` starting with `/`.
   - Propose and obtain approval for performance budgets when performance is
     requested. Example values are starter budgets, not universal standards.
     Accessibility-only runs may omit `budgets`.
   - Keep `ignoreHTTPSErrors` false unless you explicitly accept an untrusted
     certificate on an approved local test site.

Merge approved runner/profile settings using the examples below, then execute
the requested suites. Missing configuration, unapproved targets, invalid budgets
and missing browsers are errors, not successful tests. `qa.json` is local
configuration: keep it out of public repositories if it contains private details.

### Read-only setup diagnostic

The agent should run the bundled diagnostic before proposing changes:

```sh
node diagnose.cjs --project PATH_TO_PROJECT
```

It reads the project profile and checks configured test-package directories
(or `tools/browser-qa` when none are registered). For the bundled suite it
checks configuration, pinned dependency versions and browser executable files.
Custom test packages are reported for agent inspection, not overwritten.
JSON output includes the current Node/OS/WSL environment, findings and next
actions. Exit code 2 means missing, disabled, blocked or unverified setup.
It does not execute project commands, launch browsers, contact sites, write
files or install anything. OS libraries and actual test execution remain
unverified even when files are present.

### Page readiness and keyboard checks

For dynamic pages, add a confirmed visible `readySelector` to the page entry.
The suite waits for the load event, that selector (when configured), and fonts.
Add optional keyboard destinations to check navigation from the initial page
focus without clicking or submitting forms:

```json
{
  "name": "Homepage",
  "path": "/",
  "readySelector": "main",
  "keyboard": [
    { "tabs": 1, "selector": "a.skip-link" }
  ]
}
```

Each `tabs` count is the number of Tab presses since the previous step.
Use real project selectors, not this example verbatim. Destinations must
receive focus and be in the viewport. Focus screenshots require manual review
for visibility, clipping and obstruction; computed CSS alone cannot prove
usable focus. Pages without `keyboard` steps have no keyboard-flow coverage.
These checks help identify navigation barriers for keyboard-only users.

### Optional browser coverage

Set `accessibility.browsers` to `["chromium", "firefox", "webkit"]` for desktop
cross-browser axe, keyboard and layout checks. Chromium also includes a mobile
project; performance remains Chromium-only. After approval, install the chosen
browsers with `npx playwright install chromium firefox webkit`. Missing
executables or libraries are blocked coverage, not skipped successes.

## Run the checks

From `tools/browser-qa`, run:

```sh
npm run test:accessibility
npm run test:performance
```

By default both commands check each page in desktop and mobile Chromium.
They do not start your site. The approved target must already be running.
Each command prints a unique `reports-accessibility-*` or
`reports-performance-*` directory containing JSON results, HTML and attachments.
Open that run's report with:

```sh
npx playwright show-report PATH_TO_RUN_DIRECTORY/html
```

Runs do not overwrite earlier reports. `QA_REPORT_ROOT` may point to an existing
approved report directory outside the project. The optional QA runner below
also keeps separate suite output directories and its own JSON summary; the
launcher places reports alongside its requested JSON output, not in source.

Each accessibility test attaches `axe-results.json`, including violations and
checks needing manual review. Each performance test attaches
`performance-metrics.json`, including measured values, budgets, viewport name,
target and sampling scope. Playwright also records failed assertions. Reports
can contain page content and URLs; review them before sharing.

## What is measured

- **Accessibility:** axe's supported WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rules,
  plus non-empty page language/title, 320px horizontal overflow checks and
  optional project-defined keyboard destinations with focus screenshots.
  Overflow is a review signal; exceptions for two-dimensional content require
  manual judgement, not an automatic declaration of WCAG failure.
- **Performance:** TTFB, load event timing, observed LCP, CLS using layout-shift
  session windows, first-party transfer KB and first-party request count.
  Each page uses three fresh browser contexts by default; budgets are applied
  to per-metric medians, with every raw sample preserved. `performance.samples`
  accepts odd counts from 3 to 9. `performance.observationMs` sets the
  post-readiness window (default 2000ms, range 100-30000ms).
  Missing LCP in any sample fails instead of passing as zero. The observation
  window is a lab sampling limit, not a full page-lifetime LCP/CLS measurement.

The browser uses a fresh anonymous context for each test, with service workers
blocked. It does not submit forms or log in. Existing site scripts still run:
navigation can populate caches, record analytics, and load third-party services.
Review your target's behavior and obtain approval before running. The origin
allowlist checks the selected target; it is **not a network sandbox**. A final
navigation outside that origin fails, but may already have contacted the
redirect destination.

No videos, embeds or resources are intentionally excluded. Budgets cover
first-party traffic. Reports additionally include total request counts and
observable total transfer, plus counts of cross-origin resources with opaque
zero transfer size. Opaque bytes cannot be reconstructed, so observable transfer
is not full-page weight. Browser caches may also affect timing/transfer values.
Mobile emulation does not simulate a slow network or CPU. These are lab checks, not
production field Core Web Vitals, INP or Lighthouse scores. Use controlled,
repeated measurements for performance decisions.

Passing axe does not prove WCAG conformance. Manual keyboard, screen-reader,
focus, zoom/reflow, text-spacing, content and interaction checks remain
necessary. Project-specific component regression tests and IBM Equal Access
are not included. Firefox/WebKit coverage is opt-in.

## Connect to the optional QA runner

After copying the toolkit's `runtime/.github/scripts/` into your project's
`.github/scripts/`, add these settings under `qa` in your project's
`docs/agent-project.json`. Merge them with existing settings; do not overwrite
other suites or approved targets.

```json
{
  "allowed_origins": ["https://example.invalid"],
  "accessibility": {
    "enabled": true,
    "commands": [{
      "cwd": "tools/browser-qa",
      "argv": ["node", "run.cjs", "accessibility", "--output={output_dir}/test-results"],
      "report_format": "playwright-json"
    }],
    "limitations": ["Automated Chromium/axe baseline only; manual accessibility testing remains necessary."]
  },
  "performance": {
    "enabled": true,
    "commands": [{
      "cwd": "tools/browser-qa",
      "argv": ["node", "run.cjs", "performance", "--output={output_dir}/test-results"],
      "report_format": "playwright-json"
    }],
    "limitations": ["Repeated desktop/mobile Chromium lab; median budgets; first-party budget scope; configured observation window; no field INP."]
  }
}
```

Replace the example origin in both the project profile and `qa.json` before
running. The runner sets `BASE_URL`; browser QA rejects it unless it appears in
`qa.json`'s `allowedOrigins`. The runner's report directory must be outside the
project repository.

## Toolkit maintainer checks

After the explicit dependency/browser setup above, run `npm test` here.
It validates configuration, exercises audit helpers against intercepted browser
fixtures (including deliberately failing cases), and runs all four real suite
entry points against a temporary loopback HTTP fixture. The fixture server is
closed and its temporary reports removed when the check ends. It does not audit
a Drupal site. Set `QA_TEST_CROSS_BROWSER=1` to exercise optional Firefox/WebKit
fixtures after their browsers are installed. GitHub Actions performs clean
lockfile installation, packaging checks and these tests on Linux and Windows.
