---
description: "Use when editing Drupal SDC component metadata; covers props, slots, Styleguide examples, rendered markup, and project-specific component conventions."
applyTo: "**/components/**/*.component.yml"
---

# Drupal SDC Component Metadata

- Give props and slots meaningful titles/descriptions and valid schema types.
  Match Drupal field mapping labels when a component maps to an entity field.
- Use an appropriate Styleguide control for the data, such as a textarea for
  long text or a media control for media values, where supported.
- Keep defaults valid and representative without fabricating editorial data or
  informative image alt text. Preserve intentional empty states.
- Use slots for composed/repeated child components where the component system
  supports them. Ensure examples reflect actual Twig output and do not assume
  template code in text props will execute.
- Follow project-profile conventions for atomic grouping, naming, defaults,
  styling, accessibility, and admin preview compatibility.
- Verify schema and both preview/runtime contexts as appropriate.
