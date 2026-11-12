---
name: drupal-editorial-ux
description: "Improve Drupal back-office UX for editors: forms, entity displays, field groups, widgets, help text, admin styling, validation, permissions, and accessible workflows."
argument-hint: "Describe the entity form or editorial workflow, editor roles, and current behavior."
---

# Drupal Editorial and Back-Office UX

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for roles, admin theme, enabled modules, styling
ownership, entity invariants, manual locations, and verification commands.
Apply only rules configured for this project.

## Workflow

1. Identify the editor task, entity, create/edit flow, roles, required
   information, common errors, and translation/revision needs.
2. Inspect the existing entity form display, widgets, permissions, admin theme,
   and rendered workflow.
3. Prefer core configuration and suitable existing modules over custom code.
   Use Field Group only where meaningful grouping improves navigation.
4. Keep semantic structure in Drupal configuration and presentation in the
   configured admin styling layer. Preserve labels, required states, help,
   errors, focus visibility, keyboard behavior, and access controls.
5. Verify the real editor workflow, including validation, translations,
   narrow layouts, and keyboard use where available. Flag affected manuals.
6. Review the complete diff; obtain approval before importing configuration,
   running updates, clearing caches, or changing site state.
