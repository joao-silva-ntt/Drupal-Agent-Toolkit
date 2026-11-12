---
description: "Apply general Drupal development and safety guidance in Drupal workspaces."
applyTo: "**/*"
---

# Drupal Workspace Guidance

Before substantial work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` from the target workspace. Treat these as the
only source of repository-specific facts, paths, commands, and QA targets. If
either profile file is absent, inspect the repository safely and ask about any
material blocker; never assume conventions from another project.

- Use Drupal core configuration first, then maintained compatible contributed
  modules, and custom code only when those do not meet the need. Check current
  compatibility and security status before proposing dependencies.
- Follow Drupal coding standards, supported APIs, dependency injection, entity
  access, cache metadata, server-side validation, and escaping conventions.
- Preserve existing behavior and unrelated work. Prefer a focused change and
  run the narrowest relevant, already-configured checks.
- Think before changing: state material assumptions, name alternatives when a
  request is ambiguous, push back if a simpler approach exists, and stop to ask
  when something is unclear. Scale this down for trivial edits.
- Keep solutions simple: no speculative features, configurability, or
  abstractions for single-use code. Every changed line should trace to the
  request; match local style, remove only orphans your change created, and
  mention unrelated problems or dead code instead of fixing them.
- Define a verifiable success check (test, QA suite, or inspected result)
  before non-trivial work, and loop until it passes or a blocker is reported.
- Do not install dependencies, mutate content/configuration/databases, start
  services, deploy, or contact external systems unless explicitly approved for
  the target. Read-only inspection and vetted repository tests are permitted;
  shell execution is not a security sandbox.
- QA agents and audits are read-only by default. Report recommendations; make
  fixes only after explicit approval. A requested local report artifact is
  permitted when it does not change the site or source.
- For applicable changes, load the matching skill and scoped instruction. Ask
  before acting when an unresolved requirement materially affects the result.
- Do not claim automated checks establish full accessibility, security, or
  performance conformance; distinguish measured results from manual work.

Use only this always-on instruction file; do not add a competing `AGENTS.md`.
