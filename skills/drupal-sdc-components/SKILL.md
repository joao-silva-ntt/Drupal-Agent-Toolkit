---
name: drupal-sdc-components
description: 'Create and maintain Drupal Single Directory Components with accessible metadata, props, slots, Twig output, and Styleguide examples.'
argument-hint: 'Describe the component, its consumers, props, slots, and rendering contexts.'
---

# Drupal SDC Components

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for Drupal version, active theme/component paths,
installed Styleguide or custom UI integrations, build commands, and preview
requirements. SDC is core-supported in modern Drupal but project integrations
and authoring conventions vary.

## Metadata workflow

1. Inspect the core SDC schema and neighboring components. Confirm supported
   metadata properties against the installed Drupal version and extensions.
2. Give the component a clear name, description, status, and grouping if the
   project's component system uses those properties.
3. Define props with valid types and useful descriptions; mark only truly
   required values as required. Use enums for constrained values where
   supported.
4. Define slots for composed/repeated child components when appropriate.
   Keep Styleguide examples representative of the actual Twig contract.
5. Avoid invented content and fabricated informative alt text. Preserve valid
   empty states, especially for decorative imagery and optional props.
6. Use native HTML semantics first. Add ARIA only when needed; preserve
   accessible names, keyboard operation, visible focus, and heading order.
7. Preserve Twig auto-escaping and Drupal render metadata. Do not output
   untrusted rendered strings with `|raw`.
8. Verify component metadata and each real rendering context. Load
   `drupal-sdc-styleguide-safe` when render-array and preview contexts differ.
9. Run the UI checklist in `drupal-theme-development` before reporting done.

Project-specific editor controls (for example custom UI metadata keys),
field-label maps, component folders, or atomic-design tiers must come from the
project profile or installed extension schema; do not assume them globally.
