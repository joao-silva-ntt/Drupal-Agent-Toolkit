---
name: drupal-configuration-management
description: "Manage Drupal configuration synchronization, schema, environment overrides, deployment, and configuration troubleshooting."
argument-hint: "Describe the config object, sync state, target environment, and requested operation."
---

# Drupal Configuration Management

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for the sync directory, environment strategy,
commands, and deployment target. Do not assume a repository path or Drush
wrapper.

## Safe workflow

1. Inspect current/sync configuration and version-control status before edits.
   Identify active/sync drift, dependencies, Config Split, and recipe behavior.
2. Make the smallest config/schema change. Preserve unrelated differences and
   keep secrets out of exported config.
3. Review the complete diff and validate schema/UUID/dependency references.
4. Do not run imports, exports, database updates, or cache rebuilds unless
   explicitly requested or approved for the exact target. Never run these
   operations against production without clear authorization.
5. Report changed config, exact checks, target, and remaining deployment work.

Prefer reversible, reviewable changes. Use update hooks only for required data
or schema transitions, not routine configuration edits.
