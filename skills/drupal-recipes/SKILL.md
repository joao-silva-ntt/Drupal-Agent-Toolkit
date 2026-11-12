---
name: drupal-recipes
description: 'Create, compose, apply, and troubleshoot Drupal recipes, including install lists, config imports/actions, inputs, and repeatable setup.'
argument-hint: 'Describe the recipe behavior, dependencies, configuration, and target.'
---

# Drupal Recipes

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for recipe directories, installed Drupal/Drush
versions, config conventions, and deployment workflow. Paths and commands
below are conceptual; verify the repository layout before use.

## Design and authoring

- Keep recipes focused, composable, and repeatable. Declare only required
  modules/themes and use core/contrib configuration before custom code.
- Use `config.import` for extension-provided config and `config.actions` for
  deliberate updates to existing objects. Understand strictness and
  idempotence before applying.
- Define inputs for values that must vary by site/environment; do not embed
  secrets.
- Keep project-owned config in the profile-defined location and follow its
  recipe registration rules.
- Inspect the recipe's resulting config and dependency graph before applying.

## Applying and troubleshooting

Recipe application mutates site state. Obtain explicit approval for the exact
target, review backups/rollback requirements, and use the project's approved
command. Do not apply a recipe to production or assume installation is
idempotent. Verify resulting extensions and config after approval.

For failures, inspect the recipe schema, module dependencies, existing config,
and action ordering; avoid broad config imports or destructive workarounds.
