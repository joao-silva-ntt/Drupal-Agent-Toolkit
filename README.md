# Drupal Agent Toolkit

Reusable Copilot agents, skills, and scoped rules for Drupal development and
site maintenance. This plugin contains generic Drupal guidance only; project
paths, commands, policies, and site details belong in each Drupal repository.

## Install in VS Code

**[Install Drupal Agent Toolkit in VS Code](vscode://chat-plugin/install?source=joao-silva-ntt%2FDrupal-Agent-Toolkit&plugin=drupal-agent-toolkit)**

Alternatively, enable `chat.plugins.enabled`, open the Command Palette, run
**Chat: Install Plugin from Source**, and enter:

```text
https://github.com/joao-silva-ntt/Drupal-Agent-Toolkit
```

Review the publisher and plugin contents before confirming installation.
Installed agents and skills are available from the Copilot customization
pickers. Plugin skills use the `/drupal-agent-toolkit:<skill-name>` command
prefix.

## Project-specific setup

The plugin does not assume a particular Drupal version, theme, deployment,
toolchain, or QA target. For substantial work, provide the project-specific
facts and approved commands in:

- `docs/AGENT_PROJECT.md` - human-readable architecture, rules, approvals,
  and exclusions.
- `docs/agent-project.json` - project paths and optional, explicitly reviewed
  QA configuration.

Start from [`docs/agent-project.example.json`](docs/agent-project.example.json).
If a project profile is absent or incomplete, agents should inspect safely and
ask about material unknowns instead of borrowing assumptions from another
project.

## Optional QA runner

Installing the plugin does not copy files into the Drupal repository. To use
the bundled QA runner, copy the contents of `runtime/.github/scripts/` into
the project's `.github/scripts/`, then configure and review its profile
commands and approved targets. The example profile disables all QA suites.
The runner does not install dependencies, start services, or make a site
read-only; review any command before enabling it.

Run its isolated standard-library tests from the plugin checkout with:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s runtime/.github/scripts/tests -v
```

## Safety and scope

- Agents and skills provide guidance; they do not prove compliance or replace
  project review.
- QA agents are read-only by default and should report untested or blocked
  coverage explicitly.
- This plugin includes no hooks or MCP servers. The optional QA scripts run
  only when explicitly invoked.
- This is a community project and is not an official Drupal, GitHub, or
  Microsoft product.

See [`docs/AGENT_TOOLKIT.md`](docs/AGENT_TOOLKIT.md) for the toolkit's
structure and adoption notes.
