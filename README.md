# Drupal Agent Toolkit

Reusable Copilot agents, skills, and scoped rules for Drupal development and
site maintenance. This plugin contains generic Drupal guidance only; project
paths, commands, policies, and site details belong in each Drupal repository.

## Install in VS Code

### Before you start

- Use a current version of VS Code with GitHub Copilot Chat available, and
  sign in to Copilot.
- Install Git, which VS Code needs to download plugins from remote repositories:
  1. In VS Code, open **Terminal** > **New Terminal**.
  2. Type `git --version` and press Enter. If Git is available, a version
     number appears.
  3. If the command is not found, install Git for your operating system:
     - [Windows](https://git-scm.com/download/win)
     - [macOS](https://git-scm.com/download/mac)
     - [Linux](https://git-scm.com/download/linux)
  4. Close all VS Code windows and reopen VS Code, then run `git --version`
     again. Restarting lets VS Code detect the updated PATH.
- Enable agent plugins:
  1. Open VS Code **Settings** using one of these methods:
     - Click the **Manage** gear in the lower-left corner, then click
       **Settings**.
     - Press `Ctrl` + `,` together on Windows/Linux, or `Cmd` + `,` together
       on macOS.
     - Open the Command Palette (`Ctrl` + `Shift` + `P` on Windows/Linux or
       `Cmd` + `Shift` + `P` on macOS), type **Preferences: Open Settings (UI)**,
       and press Enter.
  2. In the Settings page, click the **Search Settings** box at the top and
     type `chat.plugins.enabled`.
  3. Turn on **Chat › Plugins: Enabled**.

  If that setting is not listed, set it directly:
  1. Open the Command Palette with `Ctrl` + `Shift` + `P` on Windows/Linux or
     `Cmd` + `Shift` + `P` on macOS.
  2. Run **Preferences: Open User Settings (JSON)**.
  3. Add the setting inside the outer `{}`. If there are already settings,
     add a comma after the preceding entry as needed; do not replace the other
     settings:

     ```json
     {
       "chat.plugins.enabled": true
     }
     ```

  If VS Code reports the setting as unknown, update VS Code and the GitHub
  Copilot Chat extension, restart VS Code, and check again.
- Select the **Copilot** agent harness if VS Code asks which harness to use.

### One-click install

[Install Drupal Agent Toolkit in VS Code](https://vscode.dev/redirect?url=vscode%3A%2F%2Fchat-plugin%2Finstall%3Fsource%3Djoao-silva-ntt%252FDrupal-Agent-Toolkit%2526plugin%253Ddrupal-agent-toolkit)

VS Code should open the plugin installation flow. Review the repository and
publisher, then confirm only if you trust the source. The link uses special
encoding to avoid a VS Code redirect issue that can cause the plugin name to be
read twice. If it still fails, use one of the source-install options below.

### If you use WSL, Remote SSH, or a dev container

Some VS Code versions have a remote-window limitation that can prevent the
marketplace install flow from managing plugins. If you see an error saying the
selected Copilot Agent Host session does not support plugin installation:

1. Open VS Code **Settings** and search for
   `chat.customizations.marketplace.enabled`.
2. Turn off **Chat › Customizations: Marketplace: Enabled**. Keep
   `chat.plugins.enabled` turned on.
3. Open the Command Palette (`Ctrl` + `Shift` + `P` on Windows/Linux or
   `Cmd` + `Shift` + `P` on macOS) and run **Chat: Open Customizations**.
4. Select **Plugins** in the left-hand menu, then select the add (`+`) button
   beside **User** or **Workspace**.
5. Enter the repository URL below and confirm the install.

If the install reports `spawn git ENOENT`, check Git in the remote environment:

1. In the WSL/remote VS Code window, open **Terminal** > **New Terminal** and
   run `git --version`. Git installed on Windows alone might not be available
   inside WSL.
2. If Git is missing in Ubuntu or Debian WSL, run `sudo apt update`, then
   `sudo apt install git`. For other Linux distributions, follow the
   [Git installation guide](https://git-scm.com/download/linux).
3. Save your work, run **WSL: Kill VS Code Server** from the Command Palette,
   then reopen the WSL window and retry.

The **GitHub Feed** is a separate curated-discovery source and is not needed to
install this repository. Add the repository URL directly using the Plugins
steps above.

This uses the Plugins install flow instead of the Marketplace preview. See the
[VS Code remote-window issue](https://github.com/microsoft/vscode/issues/342690)
for current status.

### Option 1: Install from the Command Palette

1. Open the Command Palette (`Ctrl` + `Shift` + `P` on Windows/Linux or
   `Cmd` + `Shift` + `P` on macOS).
2. Type **Chat: Install Plugin from Source** and press Enter.
3. When VS Code asks for a source, enter this public repository URL:

   ```text
   https://github.com/joao-silva-ntt/Drupal-Agent-Toolkit
   ```

4. Choose **User** to use the plugin across your VS Code workspaces, or
   **Workspace** to install it for the current project, if prompted.
5. Review the source/trust prompt. Confirm only if you trust the repository,
   then continue until installation completes.
6. To confirm it installed, open the **Chat** view, click its gear icon, choose
   **Agent Customizations**, then **Plugins**. Find Drupal Agent Toolkit under
   **Installed**.

### Option 2: Install from the Customizations editor

1. Open the Command Palette and run **Chat: Open Customizations**.
2. Select **Plugins** in the left-hand menu.
3. Select the add (`+`) button beside **User** or **Workspace**.
4. Enter the HTTPS repository URL above.
5. Review the source/trust prompt and continue until installation completes.
   The plugin should then appear under **Installed** on the Plugins page.

### Check that it is available

1. Start a **new Copilot chat** in the project where you want to use the
   toolkit.
2. Open the agent picker and select a Drupal specialist, such as **Backend
   Developer** or **Drupal Architect**.
3. Type `/` in the chat input to find skills. Plugin skills use the
   `/drupal-agent-toolkit:<skill-name>` prefix; for example,
   `/drupal-agent-toolkit:drupal-module-development`.
4. Ask a small, read-only question first and review the response and tool
   activity before using it for project changes.

If the plugin or its agents do not appear, confirm plugins are enabled, check
that it is installed for the intended scope and harness, then start a fresh
chat or reload VS Code. Workspace-specific agents and skills may have the same
name as plugin items; check the source shown in the Customizations editor.

The plugin install makes the agents, skills, and rules available; it does not
copy files into the Drupal repository. See [Project-specific setup](#project-specific-setup)
before substantial work. Review plugin contents and publisher before
installation. Plugins can include executable hooks or MCP servers; this
plugin currently includes neither.

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
