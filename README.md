# Drupal Agent Toolkit

Reusable Copilot agents, skills, and scoped rules for Drupal development and
site maintenance. This plugin contains generic Drupal guidance only; project
paths, commands, policies, and site details belong in each Drupal repository.

## Install the toolkit in VS Code

> [!IMPORTANT]
> **Start here.** Install directly from the Command Palette, not from
> **Browse customizations** or **GitHub Feed**.
> First-time users: complete the [setup checklist](#setup-checklist) before installing.

1. Click **View** > **Command Palette**.
2. Type **Chat: Install Plugin from Source** and press **Enter**.
3. Paste this URL into the source box and press **Enter**:

   ```text
   https://github.com/joao-silva-ntt/Drupal-Agent-Toolkit
   ```

4. If asked where to install it, select **User** to make it available across
   your projects.
5. Review the repository and trust prompt. Confirm only if you trust the
   source, then wait for installation to finish.

## Setup checklist

<details>
<summary>First time installing a plugin? Open this checklist.</summary>

### Get ready

- Use an up-to-date VS Code with GitHub Copilot Chat, signed in to Copilot.
- Install [Git](https://github.com/git-guides/install-git#install-git) on the
  computer running VS Code. For Windows with WSL, install Git on Windows too;
  Git inside WSL alone is not enough for the Windows-side installer.
- After installing Git, close every VS Code window, including any Agents
  windows, and reopen VS Code.

### Enable plugins

1. In VS Code, click **View** > **Command Palette**.
2. Type **Preferences: Open Settings (UI)** and press **Enter**.
3. Click the **Search Settings** box at the top and type
   `chat.plugins.enabled`.
4. Check **Chat > Plugins: Enabled**.

Then follow [Install the toolkit in VS Code](#install-the-toolkit-in-vs-code) above.

</details>

## Start using it

1. Open your Drupal project and start a **new Copilot chat**.
2. Select **Copilot** as the agent harness if prompted.
3. Open the agent picker in the chat input and choose a specialist, such as
   **Backend Developer** or **Drupal Architect**.
4. Type `/drupal-agent-toolkit:` in the chat input to see the toolkit's skills.
5. Start with a read-only request, such as: "Explain this project's structure
   without changing any files."

Installation makes the toolkit available in Copilot; it does not copy files
into your project. Complete the project-specific setup below before asking
agents to make substantial changes.

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

**Accessibility and performance browser suites are included.** Follow the
[browser QA setup guide](runtime/browser-qa/README.md) to copy them into your
project, install their dependencies explicitly, and configure approved pages
and budgets. They do not run automatically when you install the plugin.

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
