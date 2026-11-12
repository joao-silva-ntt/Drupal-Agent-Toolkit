---
name: drupal-testing
description: "Create, run, and debug Drupal unit, Kernel, Functional, JavaScript, and browser/accessibility tests using the repository's configured tooling."
argument-hint: "Describe behavior, test layer, target, and configured command."
---

# Drupal Testing

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for PHP/Drupal versions, configured test suites,
commands, browser requirements, services, and approved targets. Do not assume
a base URL, install dependencies, or start services without approval.

## Choose the narrowest test

- **Unit:** isolated logic and service collaborators.
- **Kernel:** Drupal container, schema, entities, and service integration.
- **Functional:** routes, forms, permissions, and complete request workflows.
- **Functional JavaScript/browser:** interactions requiring a real browser.
- **Accessibility:** automated scans plus documented manual checks.

Use the repository's established test base classes, groups, fixtures, and
commands. Test normal behavior, access boundaries, validation failures,
translation/cache cases, and edge cases that matter to the feature.

Before execution, confirm the command and target are read-only and approved.
Execution is not a security sandbox. Distinguish application failures from
missing browsers/libraries, credentials, or unreachable services. Report exact
commands, counts, failures/skips, versions, and limitations; do not claim
untested coverage.
