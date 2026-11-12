---
name: drupal-sdc-styleguide-safe
description: 'Make Drupal SDC components safe across Styleguide, frontend rendering, and editorial previews; use for render arrays, prop mappings, slots, and asset-context defects.'
argument-hint: 'Describe the component and the failing rendering context.'
---

# Drupal SDC Dual-Context Safety

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` to verify whether SDC/Styleguide/SDC Display are
installed, what preview contexts exist, and how components/assets are wired.
Do not assume these modules are present.

## Review procedure

1. Trace component metadata, field mappings, callers, and actual values in
   Styleguide, frontend, and editor preview.
2. Keep prop names/types aligned with mappings. Where a prop accepts multiple
   forms, distinguish Drupal render arrays/markup from plain scalar values
   safely; use the least complex contract that meets real callers.
3. Use Twig auto-escaping. Do not use `|raw` for untrusted/editor-authored
   values. Avoid testing render-array truthiness in a way that hides valid
   content; preserve access/cache metadata through rendering.
4. Make fallbacks valid in every supported context. Do not invent editorial
   copy or informative alt text solely for a preview.
5. Check generated libraries/assets are loaded in each context and controls
   remain keyboard accessible. Avoid nested forms and inert controls that look
   interactive.
6. Validate with representative Drupal-produced values plus Styleguide
   examples and report any context not tested.
