# Optional accessibility and performance tests

These are project-neutral, anonymous browser checks. Installing the Copilot
plugin does not install dependencies, launch a browser, or run these tests.

## Set up once per project

1. Download the toolkit repository and copy this entire `runtime/browser-qa`
   folder into your Drupal project's `tools/browser-qa` folder. Do not edit an
   installed plugin's cached copy.
2. Install a supported Node.js LTS release with npm. In VS Code, open
   **Terminal > New Terminal**, go to your project's root, then run:

   ```sh
   cd tools/browser-qa
   npm ci
   npx playwright install chromium
   ```

   These commands download packages and a browser. Review and approve them
   first. If Playwright reports missing operating-system libraries, have your
   environment owner install the listed prerequisites before continuing.
3. Copy `qa.example.json` to `qa.json` in this folder.
4. Edit `qa.json`:
   - Replace both `https://example.invalid` values with your explicitly
     approved site's origin (scheme, hostname and port, without a page path).
   - Set `pages` to the public pages you want to check. Each page needs a
     unique `name` and a relative `path` starting with `/`.
   - Review and set every performance budget. The example values are starter
     budgets, not universal standards.
   - Keep `ignoreHTTPSErrors` false unless you explicitly accept an untrusted
     certificate on an approved local test site.

Missing configuration, unapproved targets, invalid budgets and missing browsers
are errors, not successful tests. `qa.json` is local configuration: keep it out
of public repositories if it contains private site details.

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
