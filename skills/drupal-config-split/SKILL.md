---
name: drupal-config-split
description: 'Manage Drupal Config Split across environments: split activation, partial/complete lists, directories, export/import, and troubleshooting.'
argument-hint: 'Describe the environment split, current activation, and configuration that differs.'
---

# Drupal Config Split

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` to determine installed versions, environment names,
activation mechanism, directories, deployment process, and approved target.
Never assume a variable, split name, folder, or recipe from another project.

## Workflow

1. Inspect Config Split settings and effective environment overrides in
   read-only mode. Identify whether configuration is partial or complete and
   how active splits are selected.
2. Keep secrets out of exported configuration. Include only settings that
   genuinely differ by environment and document required deployment order.
3. Review the export/import diff and use the exact project-defined command.
   Config import/export changes repository or site state and needs explicit
   approval for the intended target.
4. Verify the selected environment/split and report drift or any potentially
   destructive change before applying it.

Do not use a split to conceal required configuration dependencies or to store
credentials. Never guess production activation settings.
