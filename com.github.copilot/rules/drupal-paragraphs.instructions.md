---
description: "Use when editing Drupal Paragraph types, fields, references, or displays; covers field guidance, display mapping, editorial preview, and profile-specific rendering policies."
applyTo: "**/paragraphs.paragraphs_type.*.yml,**/field.field.paragraph.*.yml,**/field.field.node.*.yml,**/core.entity_form_display.node.*.yml,**/core.entity_view_display.paragraph.*.yml"
---

# Drupal Paragraph Configuration

- Inspect the Paragraph type, referenced fields, form/view displays, and
  renderer before changing configuration. Keep labels consistent with the
  actual authoring and component interface.
- Provide useful editor-facing field descriptions that explain the expected
  value, format, and relevant constraints.
- For paragraph-reference fields, inspect the current field widget and
  preview/rendering path. Apply only the Layout Paragraphs or SDC mapping
  requirements explicitly enabled in `docs/AGENT_PROJECT.md` or
  `docs/agent-project.json`; do not treat them as universal Drupal defaults.
- Preserve existing component mappings and field behavior unless the task
  explicitly changes them. Consider editor preview behavior separately from
  frontend asset loading.
- Follow project instructions for icon assets, recipes, translation, and config
  deployment. Review the complete diff; imports and database updates require
  approval for the target.
