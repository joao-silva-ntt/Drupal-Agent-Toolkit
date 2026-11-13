#!/usr/bin/env python3
"""Validate distributable metadata, local Markdown links and portability."""

import json
from pathlib import Path
import re
import subprocess


ROOT = Path(__file__).resolve().parents[1]
TOOLS = {"read", "search", "edit", "execute", "web"}
PRIVATE = re.compile(r"/home/[a-zA-Z0-9_-]+/|/mnt/[a-z]/Users/|[A-Z]:\\Users\\|https?://[^\s/]+\.ddev\.site|ev[o]ra[_ -]?27", re.I)


def validate(root, files):
    errors = []
    manifest = json.loads((root / "plugin.json").read_text(encoding="utf-8"))
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", manifest.get("name", "")):
        errors.append("Invalid plugin name.")
    if not re.fullmatch(r"\d+\.\d+\.\d+", manifest.get("version", "")):
        errors.append("Invalid plugin version.")
    if manifest.get("$schema") != "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json":
        errors.append("Manifest must declare the Agent Plugins schema for this package layout.")
    agents = {file.as_posix() for file in files if file.as_posix().startswith("com.github.copilot/agents/") and file.name.endswith(".agent.md")}
    if not agents:
        errors.append("No plugin agents found.")
    names = {"agent": set(), "skill": set()}
    for relative in files:
        relative = relative.as_posix()
        file = root / relative
        if not file.is_file() or file.suffix not in {".md", ".json", ".cjs", ".py", ".yml"}:
            continue
        text = file.read_text(encoding="utf-8")
        if str(relative).startswith(("skills/", "com.github.copilot/", "runtime/", "docs/")) and PRIVATE.search(text):
            errors.append(f"{relative}: project-specific URL or filesystem path.")
        is_agent = relative in agents
        is_skill = str(relative).startswith("skills/") and file.name == "SKILL.md"
        if is_agent or is_skill:
            header = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
            if not header:
                errors.append(f"{relative}: missing frontmatter.")
                continue
            for key in ["name", "description"]:
                if not re.search(rf"^{key}:\s*\S+", header[1], re.M):
                    errors.append(f"{relative}: missing {key}.")
            name = re.search(r"^name:\s*(.+)", header[1], re.M)
            if name:
                kind = "agent" if is_agent else "skill"
                if name[1] in names[kind]:
                    errors.append(f"{relative}: duplicate {kind} name.")
                names[kind].add(name[1])
                if is_skill and name[1] != file.parent.name:
                    errors.append(f"{relative}: skill name must match its directory.")
            if is_agent:
                tools = re.search(r"^tools: \[(.*?)\]", header[1], re.M)
                if not tools or not set(item.strip() for item in tools[1].split(",")) <= TOOLS:
                    errors.append(f"{relative}: unsupported tool declarations.")
                if '"First use of any toolkit agent in a project"' not in text:
                    errors.append(f"{relative}: missing shared readiness reference.")
        if file.suffix == ".md":
            prose = re.sub(r"```.*?```", "", text, flags=re.S)
            for target in re.findall(r"\]\(([^)\s]+)\)", prose):
                if "://" in target or target.startswith(("#", "mailto:")):
                    continue
                destination = (file.parent / target.split("#")[0]).resolve()
                if not destination.is_relative_to(root.resolve()) or not destination.exists():
                    errors.append(f"{relative}: broken local link {target}.")
    return errors


if __name__ == "__main__":
    files = [Path(file) for file in subprocess.check_output(
        ["git", "ls-files"], cwd=ROOT, text=True).splitlines()]
    errors = validate(ROOT, files)
    for error in errors:
        print(error)
    print(f"Validated {len(files)} tracked files; {len(errors)} errors.")
    raise SystemExit(bool(errors))
