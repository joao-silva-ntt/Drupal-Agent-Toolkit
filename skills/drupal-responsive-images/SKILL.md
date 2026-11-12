---
name: drupal-responsive-images
description: 'Configure Drupal image styles, responsive image mappings, media view displays, and Paragraph image rendering across declared breakpoints.'
argument-hint: 'Describe the media field, layouts, breakpoints, and required image behavior.'
---

# Drupal Responsive Images

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for theme paths/breakpoints, crop and conversion
policy, naming rules, formatter conventions, cache expectations, and safe
deployment commands. Do not assume WebP, crop strategy, or one formatter is
universal.

## Workflow

1. Inspect theme breakpoints and density multipliers, source image dimensions,
   media bundle/view modes, field formatter, and actual component sizes.
2. Create only the image styles needed at meaningful rendered sizes. Select
   crop/scale behavior based on design and content requirements; preserve
   focal points and informative image meaning.
3. Map each applicable breakpoint and density to an appropriate derivative.
   Avoid missing high-density variants and unnecessary duplicates.
4. Render media through the configured media view mode when responsive
   formatter behavior depends on it. Check cache metadata and derivative
   format support.
5. Verify markup (`srcset`, `sizes`, dimensions/alt text), visual crop, and
   responsive behavior in the target browsers.
6. Review derivative/cache impact and obtain approval before config imports or
   derivative flushing.
