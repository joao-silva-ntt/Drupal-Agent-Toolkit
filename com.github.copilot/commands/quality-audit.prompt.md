---
description: "Run a profile-configured read-only SEO, accessibility, or performance QA audit against an explicitly approved target."
argument-hint: "Suite (seo/accessibility/performance/all), approved base URL, scope, and report directory"
---

Run the Drupal quality audit for the requested suite and explicit target.

1. Load `docs/AGENT_PROJECT.md`, `docs/agent-project.json`, and the installed
   Drupal Agent Toolkit quality-audit skill.
2. Confirm the target URL, suite, scope, and report directory are approved and
   configured in the project profile. Do not guess missing values or run
   unconfigured suites.
3. If `.github/scripts/qa.py` is absent, report the runner as unavailable.
   Otherwise, use only this vetted interface, with approved values replacing the
   placeholders:

   ```sh
   python3 .github/scripts/qa.py --profile docs/agent-project.json --base-url APPROVED_URL --suite APPROVED_SUITE --output-dir APPROVED_REPORT_DIR
   ```

   `APPROVED_SUITE` must be one configured choice: `seo`, `accessibility`,
   `performance`, or `all`.

4. Treat the run as read-only. Shell execution is not a security sandbox. Do
   not edit code, content, configuration, or databases; install dependencies;
   start or alter services; or upload private source/data.
5. Report target and scope, exact command, tool/version, failures, warnings,
   blocked checks, manual follow-up, and prioritized recommendations. A local
   report artifact is allowed only in the approved output directory. Clearly
   distinguish lab measurements from field data and automated checks from
   manual evaluation.

Recommend fixes only; do not implement them without explicit approval.
