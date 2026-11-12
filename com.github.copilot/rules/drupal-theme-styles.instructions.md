---
description: "Use when editing styles in a custom Drupal theme; follow the project's configured source of truth and build process for generated styles."
applyTo: "**/themes/custom/**/*.{scss,sass,css}"
---

# Custom Theme Styles

- Before editing styles, check the project profile for the stylesheet source of
  truth, generated output paths, and build command. Do not assume compiled CSS
  is either editable or generated.
- Keep styles scoped to their component/layout and follow existing syntax and
  naming conventions.
- When a stylesheet is generated, edit its declared source and run the
  profile-defined build. Never hand-edit generated output.
- Verify the relevant rendered pages and responsive states; include generated
  outputs only when the project workflow requires them.
