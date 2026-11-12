# Toolkit structure and adoption

The repository is an installable VS Code Agent Plugin for Drupal projects.
Its contents are separated by responsibility:

- `com.github.copilot/agents/` contains specialist Copilot agents.
- `com.github.copilot/rules/` contains reusable instructions for Drupal work.
- `com.github.copilot/commands/` contains the combined quality-audit command.
- `skills/` contains on-demand Drupal workflows and supporting references.
- `runtime/.github/scripts/` contains an optional profile-driven QA runner
  and its isolated tests. Plugin installation does not copy these files into
  a target project.
- `runtime/browser-qa/` contains optional Chromium/axe accessibility and
  performance suites with configurable targets and budgets.
- `docs/agent-project.example.json` is a safe starter profile. Replace its
  placeholders with the adopting project's actual facts before enabling QA.

## Adopting projects

1. Install the plugin in VS Code and review its agents, skills, and rules.
2. Create `docs/AGENT_PROJECT.md` and `docs/agent-project.json` in the
   adopting project. Use the example JSON as a template, not as a ready-to-run
   profile.
3. Configure only real project paths, supported versions, existing tools,
   explicitly approved origins, and reviewed commands. Leave unconfigured
   QA suites disabled.
4. For accessibility/performance QA, ask Accessibility Expert or Performance
   QA to check readiness. They reuse existing tests and, with scoped approval,
   copy missing tools, configure profiles and install dependencies/browser.
   You do not need to perform those file/configuration steps manually.
5. Test the plugin in a fresh Copilot session and verify its tool activity,
   output, and any command before relying on it.

Do not copy project facts, credentials, data, or configuration from another
repository. MCP servers and credentials remain machine/user integration
settings, not plugin defaults.

## QA limits

The optional runner uses standard-library Python for portable checks and can
invoke existing accessibility/performance suites configured by a project.
The agents can perform approved test setup before auditing; this does not
authorize site remediation or change the runner's read-only audit behavior.
Configuration does not prove that commands are read-only. The runner avoids
installing dependencies or starting services, and reports blocked or
incomplete coverage rather than treating it as success.

Automated accessibility checks do not prove WCAG conformance. Local lab
performance results are not field Core Web Vitals. SEO crawls cannot prove
editorial correctness, external indexing, or every stored translation.

See the root [README](../README.md) for installation and use.
