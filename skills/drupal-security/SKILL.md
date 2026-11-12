---
name: drupal-security
description: "Harden Drupal projects and review security configuration, authentication, sessions, uploads, permissions, headers, and abuse controls."
argument-hint: "Describe the threat, affected Drupal surface, and target environment."
---

# Drupal Security

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for installed modules, security policy, environment
split behavior, config paths, and approved commands. Do not assume security
modules are installed or introduce dependencies without review.

## Workflow

1. Establish threat model, exposure, affected versions, current controls,
   environment, and required behavior.
2. Prefer Drupal core and maintained compatible contributed solutions before
   custom code. Verify current advisories/compatibility from authoritative
   sources where needed.
3. Review authentication/flood protections, authorization, session lifetime,
   password policy, request validation, uploads/storage, output escaping,
   security headers/CSP, and logs in the actual context.
4. Apply least privilege, secure defaults, environment-aware configuration,
   and reversible deployment steps. Avoid exposing secrets in config/logs.
5. Recommend focused tests and regression checks. Obtain approval before
   changing dependencies, active configuration, accounts, or production
   controls.

Do not claim security from a scan alone. Report residual risk and untested
controls explicitly.
