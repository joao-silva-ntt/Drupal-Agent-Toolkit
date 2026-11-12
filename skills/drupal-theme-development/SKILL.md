---
name: drupal-theme-development
description: "Create and maintain Drupal themes using Twig, libraries, preprocess functions, Drupal behaviors, styles, responsive layouts, and accessible components."
argument-hint: "Describe the theme path, behavior/design, and supported browsers or viewports."
---

# Drupal Theme Development

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for the active theme, source of truth for styles,
asset build, component system, design references, accessibility target, and
browser tests. Do not assume a theme stack or generated assets.

## Workflow

1. Inspect the render context, template suggestions, field render arrays,
   libraries, behaviors, theme inheritance, component metadata, and tests.
2. Reuse the existing design system and component composition. Confirm current
   project design references rather than inventing mappings.
3. Preserve Twig auto-escaping and Drupal render contracts. Use native
   semantics and controls; use Drupal behaviors and `once()` for attachable
   JavaScript, with cleanup where needed.
4. Edit the configured source files and run the profile-defined build.
5. Check responsive reflow, keyboard/focus, reduced motion, accessible names,
   and relevant browser tests. Do not claim an automated scan proves WCAG
   conformance.
6. Report affected browser/viewports and any blocked manual checks.

## UI checklist (before reporting done)

- Visible keyboard focus on every interactive element.
- `prefers-reduced-motion` respected for animation and transitions.
- Text and UI contrast meet the WCAG AA minimum.
- Text, chips, and badges reflow without clipping or broken labels.
- Checked at roughly 375, 768, 1024, and 1440 px, or the profile's breakpoints.
- Icons are SVG or icon components, not emoji; clickable elements look and
  behave as such.
- No decorative styling beyond the design source named in the project profile.

Report any item not checked rather than assuming it passes.
