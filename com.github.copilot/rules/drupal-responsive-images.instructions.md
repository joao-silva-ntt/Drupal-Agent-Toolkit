---
description: "Use when configuring Drupal image styles, responsive image mappings, or media displays; covers breakpoints, format pipelines, cache metadata, and profile settings."
applyTo: "**/image.style.*.yml,**/responsive_image.styles.*.yml,**/core.entity_view_display.media.*.yml"
---

# Drupal Responsive Image Configuration

- Inspect the active theme's declared breakpoints, real device/layout needs,
  image source dimensions, image styles, and media display before editing.
- Ensure responsive mappings cover the breakpoints and density variants the
  theme actually declares. Avoid shipping unnecessary duplicate derivatives.
- Use an image formatter/view mode that applies the intended media display;
  verify the rendered derivative and responsive `srcset`/`sizes` behavior.
- Follow image conversion, crop, naming, and cache policies only when listed
  in the project profile. Do not assume WebP conversion or a naming convention
  is universal.
- Review generated derivative impact and the complete config diff. Importing
  configuration or flushing derivatives changes site state and requires
  approval for the target.
