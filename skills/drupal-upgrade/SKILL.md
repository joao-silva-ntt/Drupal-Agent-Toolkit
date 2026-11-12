---
name: drupal-upgrade
description: 'Assess or execute Drupal major-version upgrades, compatibility remediation, Composer planning, database update risks, and post-upgrade verification.'
argument-hint: 'State the actual current/target Drupal and PHP versions and whether this is assessment or implementation.'
---

# Drupal Major-Version Upgrade

Before work, load `docs/AGENT_PROJECT.md` and `docs/agent-project.json` to
establish actual current/target Drupal and PHP versions, Composer workflow,
deployment process, configuration paths, and tests. Do not assume every
project is upgrading from Drupal 10 to 11.

## Assessment

1. Inspect `composer.json`/lockfile, runtime, extensions, custom code,
   configuration, database/filesystem assumptions, and test coverage.
2. Verify supported upgrade paths, deprecations, and current contrib
   compatibility from authoritative sources.
3. Distinguish blocking incompatibilities from recommendations. Report
   dependency constraints, migration/data risks, required backups, and a
   staged test/rollout/rollback sequence.

## Implementation

1. Obtain explicit approval before changing dependencies, installing tools,
   importing configuration, running database updates, or changing site data.
2. Work incrementally on a clean or understood branch; preserve unrelated
   changes and review generated lock/config diffs.
3. Follow the project-configured command wrapper and sync path. Never run
   destructive commands, broad Composer updates, or production upgrades
   without explicit authorization.
4. Run the narrowest checks first, then relevant test suites and deployment
   rehearsal. Report exact commands, results, blockers, and untested paths.

Do not claim readiness based only on static scans.
