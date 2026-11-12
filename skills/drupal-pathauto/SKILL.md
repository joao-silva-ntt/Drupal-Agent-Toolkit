---
name: drupal-pathauto
description: 'Configure and troubleshoot Drupal Pathauto patterns, URL aliases, and regeneration workflows.'
argument-hint: 'Describe the bundle, desired alias pattern, existing behavior, and target environment.'
---

# Drupal Pathauto

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for Pathauto availability/version, configuration
directory, recipe strategy, Drush wrapper, and approved target. Examples must
be adapted to the actual project; alias regeneration changes site data.

## Pattern workflow

1. Inspect Pathauto settings, Token availability, existing patterns, entity
   bundles, language behavior, and route/alias consumers.
2. Use stable lowercase machine names and supported entity tokens. Ensure
   selection criteria and context mappings match the plugin's expected schema.
3. Check that the target entity type is enabled in Pathauto settings.
4. Add config to the repository's configured sync/recipe workflow; preserve
   unrelated configuration.
5. Verify pattern selection on a representative entity before enabling bulk
   regeneration. Review existing aliases, redirects, multilingual variants,
   collisions, and canonical-link effects.
6. Obtain explicit approval before imports, bulk updates, or regenerating
   aliases on any target.

Prefer read-only config inspection and dry-run options where supported. Never
assume a module, recipe, sync path, or command wrapper is installed.
