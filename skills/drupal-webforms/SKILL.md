---
name: drupal-webforms
description: 'Create, configure, and maintain Drupal Webforms, elements, handlers, spam controls, upload behavior, access, and deployment.'
argument-hint: 'Describe the Webform purpose, elements, handlers, access, and target environment.'
---

# Drupal Webforms

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for Webform availability/version, permitted text
formats, spam/upload policy, recipe paths, and deployment commands. Do not
assume Webform or related modules are installed.

## Workflow

1. Confirm the use case, access, data sensitivity, retention, translations,
   submission handlers, and permitted recipients.
2. Use the existing Webform element schema and validate required/conditional
   behavior server-side. Provide accessible labels, help, errors, and
   confirmation messages.
3. Review spam and rate controls for public forms. Restrict upload types,
   size, storage, and access; never expose sensitive submissions as public
   files.
4. Use only text formats allowed by the actual configuration and editor role.
   Follow profile rules for recipes and exported configuration.
5. Test anonymous/editor workflows, permissions, validation, upload
   constraints, handlers, and translations as appropriate.
6. Obtain approval before installing modules, importing configuration,
   sending messages to external systems, or changing live submissions.
