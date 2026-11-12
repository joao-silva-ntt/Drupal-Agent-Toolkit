---
description: "Use when creating or editing Drupal Webform configuration; covers safe element definitions, spam and file handling, formats, and project-profile policy."
applyTo: "**/webform.webform.*.yml"
---

# Drupal Webform Configuration

- Use valid Webform element types, stable machine names, and clear,
  translatable labels/descriptions. Preserve submitted-data privacy and
  appropriate access/retention behavior.
- For public forms, review the configured spam/rate-limiting protections;
  follow mandatory project policy from the profile rather than assuming a
  specific module is installed.
- For uploads, confirm storage scheme and access restrictions are appropriate.
  Never assume a private filesystem path or expose sensitive submissions
  through public files.
- Use only text formats permitted for the target element and role. Check the
  schema and current configuration rather than hardcoding a format name.
- Follow the project profile for recipe registration and deployment.
  Configuration imports and cache rebuilds require approval for the target.
