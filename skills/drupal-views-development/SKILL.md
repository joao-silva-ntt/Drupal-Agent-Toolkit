---
name: drupal-views-development
description: "Configure and extend Drupal Views: displays, exposed filters, plugins, handlers, Views data, entity queries, APIs, caching, and tests."
argument-hint: "Describe the View/display, source entities, filters, consumers, and expected behavior."
---

# Drupal Views Development

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for View label policy, contributed extensions,
configuration paths, consumers, and tests. Do not assume project naming rules
or installed modules.

## Workflow

1. Inspect View IDs/displays, base tables, relationships, access, filters,
   sort/pager, exposed form, translations, caches, and API consumers.
2. Prefer core Views configuration and maintained compatible contrib before
   custom plugins, hooks, or query logic. Verify compatibility before a
   dependency recommendation.
3. Keep plugin input/output contracts explicit. Use access-aware entity
   queries where needed and avoid duplicate entity loads.
4. Preserve cache tags/contexts and do not expose restricted rows through
   alternate displays or JSON endpoints.
5. Add focused tests for plugin logic, access, exposed behavior, and relevant
   integrations. Review config changes before any approved import.
