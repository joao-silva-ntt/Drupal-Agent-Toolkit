---
description: "Use when changing Drupal entity form displays or admin form styling; covers editor-centered field organization, accessible forms, and project-profile dispatch."
applyTo: "**/core.entity_form_display.*.yml,**/*admin*.css,**/*admin*.js"
---

# Drupal Editorial UX

- Load the relevant editorial UX skill and inspect the existing form, editor
  roles, validation, translation behavior, admin theme, and project profile.
- Treat authoring forms as user-facing workflows. Prefer core configuration
  and suitable widgets; group related fields only when it improves navigation.
- Keep form structure in Drupal configuration and presentation in admin-side
  styling. Follow the project profile for enabled modules, styling ownership,
  form invariants, and verification commands.
- Preserve labels, descriptions, required indicators, validation errors,
  keyboard operation, visible focus, access restrictions, and translated
  workflows. Do not rely on color or CSS visual order to establish meaning.
- Verify the actual workflow with an appropriately permitted editor role,
  including errors, keyboard access, and narrow layouts where available.
- Do not import/export configuration, run database updates, or mutate site
  state without explicit approval for the target.
