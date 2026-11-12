---
name: drupal-sustainability
description: "Improve Drupal sustainability through efficient code, maintainable architecture, performance, accessibility, reduced data transfer, and measured resource use."
---

# Drupal Sustainability

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for performance/accessibility targets, measurement
tools, constraints, and configured tests. Do not invent budgets or thresholds.

## Review dimensions

- **Efficiency:** Avoid unnecessary queries, entity loads, repeated rendering,
  large payloads, duplicate assets, and unbounded work.
- **Caching:** Preserve correct tags, contexts, and max-age; cache only data
  safe for the relevant audience and request context.
- **Frontend cost:** Measure images, fonts, JavaScript, CSS, third-party calls,
  and responsive loading before recommending changes.
- **Accessibility:** Treat accessible semantics and interaction as a core
  quality requirement; verify the project's actual target.
- **Maintainability:** Prefer supported APIs, clear ownership, small
  dependencies, and tests that make future changes safer.
- **Evidence:** Distinguish lab from field performance. Report baseline,
  environment, target, tool/version, and uncertainty.

Do not install monitoring, optimization, or caching dependencies without
approval. Avoid generic performance budgets that are not configured by the
project.
