---
description: "Use when creating or editing Drupal block placement configuration; covers dependency declarations, plugin settings, theme regions, visibility, and safe verification."
applyTo: "**/block.block.*.yml"
---

# Drupal Block Placement Configuration

- Inspect the block plugin schema, active theme regions, visibility conditions,
  and neighboring configuration before changing a placement.
- Preserve required configuration keys and declare dependencies on referenced
  menus, modules, themes, and configuration entities.
- Use the block plugin's supported settings; do not copy settings from a
  different plugin type.
- Choose weights based on the actual region and the configured project design.
  Do not assume one universal header/footer ordering.
- Check the project profile before registering placements in recipes or
  assigning project-specific block IDs.
- Review the complete YAML diff. Importing configuration or rebuilding caches
  changes site state and requires approval for the exact target environment.
