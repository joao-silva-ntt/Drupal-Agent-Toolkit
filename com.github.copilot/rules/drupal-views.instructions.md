---
description: "Use when editing Drupal Views configuration; covers labels, exposed filters, display behavior, access, and contributed-module-first design."
applyTo: "**/views.view.*.yml"
---

# Drupal Views Configuration

- Apply the project-profile View label convention to newly created Views.
  Keep machine IDs valid and do not rename Views shipped by core or contrib.
- Prefer core Views configuration and maintained compatible extensions over
  custom handlers/plugins when they meet the requirement.
- Inspect displays, access, contextual/exposed filters, sort/pager behavior,
  cache settings, translations, and dependent consumers before editing.
- Review the complete YAML diff and ensure required module/config dependencies
  are present. Do not run imports or exports unless requested and the intended
  environment is clear.
