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
   - Keep `ignoreHTTPSErrors` false unless you explicitly accept an untrusted
     certificate on an approved local test site.

Merge approved runner/profile settings using the examples below, then execute
the requested suites. Missing configuration, unapproved targets, invalid budgets
and missing browsers are errors, not successful tests. `qa.json` is local
configuration: keep it out of public repositories if it contains private details.

## Run the checks

From `tools/browser-qa`, run:

```sh
npm run test:accessibility
npm run test:performance
```

Both commands check each configured page in desktop and mobile Chromium.
They do not start your site. The approved target must already be running.
Results appear in the terminal and `playwright-report/`. Open the report with:

```sh
npx playwright show-report
```

These direct commands replace the previous browser report, so save it before
running another suite if you need both. The optional QA runner below keeps
separate accessibility and performance report directories.

Each accessibility test attaches `axe-results.json`, including violations and
checks needing manual review. Each performance test attaches
`performance-metrics.json`, including measured values, budgets, viewport name,
target and sampling scope. Playwright also records failed assertions. Reports
can contain page content and URLs; review them before sharing.

## What is measured

- **Accessibility:** axe's supported WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rules,
  plus non-empty page language and title checks.
- **Performance:** TTFB, load event timing, observed LCP, CLS using layout-shift
  session windows, first-party transfer KB and first-party request count.
  Layout shifts and LCP are observed through two seconds after page load.
  Missing LCP fails instead of passing as zero.

The browser uses a fresh anonymous context for each test, with service workers
blocked. It does not submit forms or log in. Existing site scripts still run:
navigation can populate caches, record analytics, and load third-party services.
Review your target's behavior and obtain approval before running. The origin
allowlist checks the selected target; it is **not a network sandbox**. A final
navigation outside that origin fails, but may already have contacted the
redirect destination.

No videos, embeds or resources are intentionally excluded. Transfer and request
budgets cover only the target's origin, not whole-page or third-party weight;
resource timing can be affected by browser caches. Mobile emulation does not
simulate a slow network or CPU. These are single-sample lab checks, not
production field Core Web Vitals, INP or Lighthouse scores. Use controlled,
repeated measurements for performance decisions.

Passing axe does not prove WCAG conformance. Manual keyboard, screen-reader,
focus, zoom/reflow, text-spacing, content and interaction checks remain
necessary. Project-specific component regression tests, IBM Equal Access,
Firefox and WebKit coverage are not included in this portable baseline.

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
      "argv": ["node", "node_modules/@playwright/test/cli.js", "test", "--project=accessibility-desktop", "--project=accessibility-mobile", "--reporter=json", "--output={output_dir}/test-results"],
      "report_format": "playwright-json"
    }],
    "limitations": ["Automated Chromium/axe baseline only; manual accessibility testing remains necessary."]
  },
  "performance": {
    "enabled": true,
    "commands": [{
      "cwd": "tools/browser-qa",
      "argv": ["node", "node_modules/@playwright/test/cli.js", "test", "--project=performance-desktop", "--project=performance-mobile", "--reporter=json", "--output={output_dir}/test-results"],
      "report_format": "playwright-json"
    }],
    "limitations": ["Single-sample desktop/mobile Chromium lab; first-party transfer scope; two-second post-load observation; no field INP."]
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
a Drupal site.
