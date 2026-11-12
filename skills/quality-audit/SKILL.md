---
name: quality-audit
description: 'Run and interpret profile-configured SEO, accessibility, and performance QA for an explicit Drupal target. Use for read-only audits, evidence-based reports, and regression checks.'
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

Installing this plugin does not copy its optional runner into the project.
If `.github/scripts/qa.py` is absent, report the runner as unavailable. To
enable it, a maintainer must copy `runtime/.github/scripts/` from the plugin
repository into the project's `.github/scripts/`, then review the commands
and targets configured in the project profile.

## Safety and scope

- QA is read-only. Report recommendations; do not make fixes without explicit
  approval.
- Shell execution is not a security sandbox. Run only a vetted test command
  against a profile-approved target.
- Never mutate source, site content/configuration, databases, dependencies, or
  services. Do not install tools, start servers, perform production crawls, or
  upload private source/content to external services without approval.
- Creating a requested local report artifact is allowed; do not write outside
  the approved report directory.
- Run only suites configured for this project. A disabled or missing suite is
  not an invitation to install tools.

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
2. Verify the suite is configured and the command is the expected runner
   invocation; review the target and output path for correctness.
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
