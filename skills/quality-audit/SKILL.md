---
name: quality-audit
description: 'Check QA readiness, set up missing accessibility/performance tests with approval, and run profile-configured audits for an explicit Drupal target.'
argument-hint: 'Specify the approved target URL, configured suite, and report directory'
---

# Drupal Quality Audit

Use the project's configured read-only checks to audit an explicit target and
produce a concise, evidence-based report.

## Required context

Before any run, load `docs/AGENT_PROJECT.md` and `docs/agent-project.json`.
They define the project paths, enabled suites, allowed targets, commands,
report location, and thresholds. If either file is missing, or the target,
suite, or report directory is not explicit and approved, do not guess; inspect
safely and ask for the missing information.

Installing the plugin does not copy test tools into the project. For a requested
accessibility or performance audit, perform the readiness and setup workflow
below instead of stopping at "tests are not configured" or asking the user to
copy files manually. SEO-only audits do not require browser QA setup.

## Browser QA readiness and setup

### First use of any toolkit agent in a project

Before the first task in a project, every toolkit agent must perform a brief,
read-only test-readiness check, even when the task is not an audit. Inspect the
project profiles and existing test manifests/configuration for accessibility
and performance coverage. Report each suite as configured, missing, disabled,
or not verified; file presence alone does not establish that tests can run.
Check available dependency/browser evidence without installing, launching
browsers, contacting the site, or running the suites. If the agent lacks
execution tools, mark runtime availability unverified rather than guessing.

Reuse a recent readiness record in `docs/AGENT_PROJECT.md` when its evidence
still matches. With explicit permission to update that file, record a compact
"Test readiness" section containing the checked date, suite paths and commands,
status and evidence, relevant manifest/lockfile/configuration hashes, and the
execution environment (for example Windows versus WSL). Do not store secrets,
user-specific absolute paths, or claims of passing tests that were not run.
Do not introduce a separate marker file or invent new JSON profile fields.
Without write approval, report the findings in chat; rechecking next session
is preferable to silently writing a marker.

Check the recorded file hashes and environment before reusing the result.
Reinspect affected evidence when tests, manifests, lockfiles, configuration,
runtime, installed dependencies or browsers change, or when freshness cannot
be established. A record from a teammate's machine does not verify this
machine's dependencies. Reuse an already completed check within the same
session unless relevant evidence changes; do not repeat it for every message.

If anything is missing or unverified, briefly explain and offer the approved
setup workflow below. Do not block unrelated work on optional browser QA,
repeatedly prompt after a refusal, or interpret first use as installation or
audit consent. Agents with editing and execution tools perform setup after
approval. Read-only or planning agents preserve their tool boundaries and
direct the user to Accessibility Expert or Performance QA for approved setup;
they must not use shell writes to bypass those boundaries.

### Approved setup and audit execution

1. Inspect without changing anything: project profiles, package manifests and
   lockfiles, existing tests/configuration, runner files, approved targets and
   report directories. Check Node/npm/Python versions, declared dependencies,
   and browser availability in the environment where the tests will run. Do
   not install packages or launch tests merely to inspect readiness.
2. Reuse an existing suitable suite and its established commands. Preserve its
   coverage, budgets, exclusions and package manager. Do not add a duplicate
   baseline, overwrite local changes, or enable an intentionally disabled
   suite without approval. If only dependencies or configuration are missing,
   propose repairing those instead of copying a second suite.
3. If setup is needed, present one focused approval request covering the exact
   files to add/change, dependency/browser downloads, approved site origin and
   pages, performance budgets when applicable, and report directory. Ask only
   for facts or permissions not already supplied. An audit request alone does
   not authorize source/configuration changes or installations. If approval is
   declined, leave the project unchanged and report the blocked checks.
4. After approval, do the setup yourself. Locate this installed plugin's
   `runtime/browser-qa/` relative to the loaded skill's plugin root (two levels
   above this skill directory); read its README and bundled files. Copy the
   package to the approved project location, normally `tools/browser-qa/`,
   including its dotfile and lockfile, but not dependencies, local `qa.json`,
   caches or reports. Do not modify the installed plugin cache. If bundled
   files are inaccessible, report that blocker; do not silently download an
   unreviewed replacement.
5. Create or merge only the approved configuration: `qa.json`, minimal project
   profiles when absent, and the requested suite's QA commands. Copy missing
   runner files from `runtime/.github/scripts/` when needed, without replacing
   existing files or unrelated suites. Use the profile command examples in the
   browser QA README and project-confirmed facts. Do not invent site details.
   Keep other suites disabled unless separately approved. Document exact
   paths, commands, budgets and limitations in the project's profile.
6. In the approved runtime directory and execution environment, install missing
   declared dependencies using its lockfile (`npm ci` for the bundled package)
   and the approved Chromium browser (`npx playwright install chromium`).
   Reuse matching dependencies/browsers already available. Do not install
   operating-system libraries, change privileges, start services, or bypass
   certificate errors without separate approval. Explain any missing runtime,
   browser or library as blocked coverage.
7. Verify the actual configured command discovers the requested desktop/mobile
   tests, then run it against the approved target and inspect its report.
   Confirm nonzero executed tests, correct target, metric/budget attachments,
   failures and skips; do not treat discovery alone as a completed audit.
   Report missing prerequisites as blocked and site violations as failures,
   not setup failures or permission to fix the site.
8. Report what was configured, installed and run, exact results, report paths
   and remaining limitations. On subsequent requests, inspect and reuse this
   setup; do not reinstall or recopy it unnecessarily.

## Safety and scope

- Audits are read-only. The narrow exception is explicitly approved test-tool
  setup above; it is not permission to fix the site or change editorial data.
- Shell execution is not a security sandbox. Run only a vetted test command
  against a profile-approved target.
- Outside approved test setup, do not mutate source or dependencies. Do not
  change site content/configuration or databases, start services, perform
  production crawls, or upload private source/content without separate approval.
- During audit execution, write requested reports only in the approved report
  directory. Approved setup changes are limited to the agreed project files.
- Run only configured, approved suites. Missing or disabled suites trigger a
  readiness check and setup proposal, never an unapproved installation.

## CLI

The repository runner interface is:

```sh
python3 .github/scripts/qa.py \
  --profile docs/agent-project.json \
  --base-url APPROVED_URL \
  --suite APPROVED_SUITE \
  --output-dir APPROVED_REPORT_DIR
```

Replace placeholders only with exact values approved and configured by the
project profile. `APPROVED_SUITE` must be exactly one configured choice:
`seo`, `accessibility`, `performance`, or `all`. Do not use `all` unless every
included suite is configured and approved. The runner is a read-only test
tool, not a sandbox or proof of complete conformance.

## Procedure

1. Establish target, scope, suite, test/lab environment, report directory, and
   explicit permission for any network request.
2. For accessibility/performance, complete readiness and any approved setup
   above. Verify the suite is configured and the command is the expected
   runner invocation; review the target and output path for correctness.
3. Execute once, capture its exit status and output, then inspect generated
   reports without modifying site/source state.
4. Classify **failures**, **warnings**, **blocked checks**, and **manual
   follow-up** separately. Include specific URLs/components, evidence, tool
   versions, and metrics where available.
5. Summarize scope and target, command/tool versions, results, limitations, and
   prioritized recommendations. Do not claim a recommendation was implemented.
6. Tag each finding with its basis: **measured** (a test or tool result),
   **observed** (read directly from source or output), or **inferred**
   (reasoned, not verified). Never present inferred items as confirmed.

## Suite cautions

- **SEO:** Automated checks can cover only configured crawler and response
  signals; editorial quality, search engine interpretation, and external
  indexing require separate review.
- **Accessibility:** Automated scans find only a subset of barriers. Manual
  keyboard, assistive-technology, zoom/reflow, and content review may still be
  required.
- **Performance:** Label results as lab or field. Lab measurements are
  controlled samples, not field Core Web Vitals; field data is not a
  reproducible lab baseline.

See the combined `/drupal-agent-toolkit:quality-audit` command. Use the
project profile as the source of truth for enabled targets and measures.
