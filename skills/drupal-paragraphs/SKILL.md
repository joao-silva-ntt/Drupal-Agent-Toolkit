---
name: drupal-paragraphs
description: 'Create and configure Drupal Paragraph types, fields, references, forms, and displays. Consult project settings for the widget and rendering approach.'
argument-hint: 'Describe the Paragraph, fields, purpose, and expected editing/rendering behavior.'
---

# Drupal Paragraph Types

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for Paragraph modules, fields, form widgets,
preview/rendering mappings, config paths, recipes, and test commands.
Layout Paragraphs and SDC Display are optional approaches, not universal
requirements.

## Workflow

1. Inspect existing Paragraph bundles, fields, reference fields, form/view
   displays, theme components, permissions, and recipes.
2. Prefer core and installed contributed features; verify module compatibility
   before proposing new dependencies.
3. Use stable machine names, clear translated labels, useful editor help,
   valid field cardinality, and appropriate storage/display settings.
4. Configure content-type references according to the project's selected
   editing widget and renderer. Keep editor preview and frontend rendering
   behavior aligned where required; do not assume nested references follow
   identical rules.
5. Verify authoring, validation, translation, access, rendering, cache
   behavior, and any project-defined icons or recipe packaging.
6. Do not import configuration or mutate content without approval for the
   target environment.
