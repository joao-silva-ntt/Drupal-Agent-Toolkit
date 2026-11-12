---
name: drupal-editor-manuals
description: "Create accurate Drupal editor manuals and training guides with accessible instructions, localized editions, screenshots, and exports."
---

# Drupal Editor Manuals

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json`. They define the manual location, supported languages,
format, screenshot procedure, commands, and approved environments. If absent,
inspect safely and ask rather than assuming a template or output format.

## Workflow

1. Confirm the tasks, audiences, roles, languages, and deliverable format.
2. Inventory the actual site configuration and permitted editor role: content
   types, fields, Paragraphs, menus, vocabularies, media, translations, and
   permissions. Document only verified features and labels.
3. Use the project template and write concise task steps with prerequisites,
   expected results, and recovery guidance.
4. Capture screenshots only on an approved local/staging target with an
   appropriately restricted account. Mask personal, private, or unpublished
   sensitive information; verify crops and labels.
5. Check semantic headings, image alternatives, link purpose, language, and
   screen-reader/print behavior. Export using the configured command and
   inspect the final artifacts.

## Safety

Do not alter content or configuration to prepare screenshots. Never use
production, privileged credentials, or external image uploads without approval.
Report workflows that could not be verified against the real back office.
