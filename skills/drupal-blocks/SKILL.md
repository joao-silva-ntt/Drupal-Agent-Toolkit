---
name: drupal-blocks
description: "Manage Drupal block placement configuration, menu blocks, theme regions, visibility conditions, weights, and recipe integration."
argument-hint: "Describe the block plugin, target region, visibility, and intended ordering."
---

# Drupal Block Configuration

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for theme regions, configuration paths, recipes, and
safe commands. Verify the actual plugin and theme; do not assume naming or
weight conventions.

## Workflow

1. Inspect the block plugin, current placement, active theme region, existing
   neighboring blocks, menu config, visibility, and cache behavior.
2. Preserve required config keys and declare dependencies on referenced
   modules, themes, menus, and configuration entities.
3. Use only settings supported by that plugin. Choose ordering based on the
   target region and rendered page, not a universal header/footer rule.
4. Follow project-specific IDs and recipe registration only when specified in
   the profile.
5. Review the full YAML diff and validate the region/plugin relationship.
   Configuration imports and cache rebuilds require explicit approval for
   the target environment.
