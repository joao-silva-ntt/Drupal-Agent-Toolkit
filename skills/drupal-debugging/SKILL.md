---
name: drupal-debugging
description: 'Debug Drupal runtime, cache, configuration, database, render, Twig, and service issues with focused inspection and project-configured tools.'
argument-hint: 'Describe the error, affected route/workflow, recent changes, and available logs.'
---

# Drupal Debugging

Before using commands, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` to verify Drupal/PHP versions, tool wrappers,
available environments, test commands, and target. Execution is not a security
sandbox; prefer read-only inspection and ask before state changes.

## Investigation sequence

1. Capture the exact error, request context, role/language, environment, and
   recent changes. Avoid reproducing with sensitive user data.
2. Inspect logs and related config/code; trace the smallest relevant service,
   route, entity, render array, cache metadata, or query.
3. Form a testable hypothesis and run the narrowest approved, read-only
   diagnostic/test. Distinguish application faults from missing tools,
   permissions, or unreachable services.
4. Do not clear caches, run updates, modify config/data, start services, or
   change debug settings without approval for the target.
5. Report evidence, likely cause, verification, limitations, and safe next
   step. Do not present guesses as confirmed causes.

Use secure channels for logs and redact tokens, personal data, and secrets.
