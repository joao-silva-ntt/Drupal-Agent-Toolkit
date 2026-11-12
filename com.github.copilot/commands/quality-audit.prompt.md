---
description: "Check QA readiness, perform approved browser-test setup when missing, and run a read-only audit against an approved target."
argument-hint: "Suite (seo/accessibility/performance/all), approved base URL, scope, and report directory"
---

Run the Drupal quality audit for the requested suite and explicit target.

1. Load `docs/AGENT_PROJECT.md`, `docs/agent-project.json`, and the installed
   Drupal Agent Toolkit quality-audit skill.
2. Confirm the target URL, suite, scope, and report directory are approved and
   configured in the project profile. Do not guess missing values or run
   unconfigured suites.
3. For accessibility/performance, follow the skill's readiness and setup
   workflow: reuse suitable tests, request approval for missing setup, and
   perform approved configuration and installations yourself. Do not stop at
   a missing runner or ask the user to copy files manually. For SEO-only
   requests, report an absent runner as blocked. Once configured, use this
   interface with approved values replacing the placeholders:

   ```sh
   python3 .github/scripts/qa.py --profile docs/agent-project.json --base-url APPROVED_URL --suite APPROVED_SUITE --output-dir APPROVED_REPORT_DIR
   ```

   `APPROVED_SUITE` must be one configured choice: `seo`, `accessibility`,
   `performance`, or `all`.

4. Keep audit execution read-only. The sole setup exception is the approved
   browser test-tool setup above, not site remediation. Shell execution is not
   a security sandbox. Do not change site content/configuration or databases,
   start/alter services, or upload private source/data without separate approval.
5. Report target and scope, exact command, tool/version, failures, warnings,
   blocked checks, manual follow-up, and prioritized recommendations. A local
   report artifact is allowed only in the approved output directory. Clearly
   distinguish lab measurements from field data and automated checks from
   manual evaluation.

Recommend fixes only; do not implement them without explicit approval.
