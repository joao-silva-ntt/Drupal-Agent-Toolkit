---
description: "Dispatch to profile-defined Drupal Event content invariants when editing Event-specific entity, configuration, form, or importer files."
applyTo: "**/*event*.yml,**/*event*.css,**/*event*.js,**/*event*.module,**/*event*.php"
---

# Event Content Dispatch

Before applying Event-specific rules, check `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for a configured link to project Event requirements.
If present, read the linked document (for example
`docs/agent-project/event-content.md`) and apply only requirements confirmed
for this repository. If no project-specific rules are linked, follow general
Drupal guidance and inspect the existing behavior; do not inherit requirements
from another project.

Do not run imports, database updates, or other state-changing commands without
explicit approval for the intended environment.
