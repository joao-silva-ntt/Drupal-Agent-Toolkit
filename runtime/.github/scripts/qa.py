#!/usr/bin/env python3
"""Run explicitly configured Drupal QA without shell expansion or site mutations."""

import argparse
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.parse

from seo_audit import audit, origin


ROOT = Path(__file__).resolve().parents[2]
SUITES = ("seo", "accessibility", "performance")


def load_profile(path, base):
    profile = json.loads(path.read_text())
    if profile.get("schema_version") != 1:
        raise ValueError("Unsupported or missing profile schema_version.")
    parsed = urllib.parse.urlsplit(base)
    if parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        raise ValueError("--base-url must be an origin, without a path/query/fragment.")
    allowed = profile["qa"].get("allowed_origins", [])
    if origin(base) not in [origin(url) for url in allowed]:
        raise ValueError("Target origin is not approved by the project profile.")
    return profile


def workspace_path(relative):
    if Path(relative).is_absolute():
        raise ValueError("Configured working directories must be repository-relative.")
    target = (ROOT / relative).resolve()
    if not target.is_relative_to(ROOT) or not target.is_dir():
        raise ValueError("Configured working directory is missing or outside this repository.")
    return target


def check_environment(settings, base):
    for relative in settings.get("env_files", []):
        path = (ROOT / relative).resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError("Environment-file path is outside the repository.")
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            match = re.match(r"^\s*(?:export\s+)?BASE_URL\s*=\s*(.*?)\s*$", line)
            if not match:
                continue
            value = match[1]
            if value.startswith(("'", '"')):
                quote = value[0]
                if quote not in value[1:]:
                    raise ValueError("Cannot safely interpret BASE_URL in a configured environment file.")
                value = value[1:value.index(quote, 1)]
            else:
                value = value.split("#", 1)[0].strip()
            if value and value.rstrip("/") != base.rstrip("/"):
                raise ValueError("A configured environment file overrides BASE_URL with a different target; no tests were run. Review it without exposing credentials.")


def command_result(command, base, directory, index, timeout):
    allowed = command.get("allowed_origins")
    if allowed is not None and origin(base) not in [origin(url) for url in allowed]:
        raise ValueError("This command is not approved for the selected target origin.")
    argv = command.get("argv")
    if not isinstance(argv, list) or not argv or not all(isinstance(item, str) and item for item in argv):
        raise ValueError("Every command requires a non-empty argv string array.")
    replacements = {"{base_url}": base, "{output_dir}": str(directory)}
    for old, new in replacements.items():
        argv = [value.replace(old, new) for value in argv]
    cwd = workspace_path(command.get("cwd", "."))
    env = os.environ.copy()
    env["BASE_URL"] = base
    env["CI"] = "1"
    env["PLAYWRIGHT_JSON_OUTPUT_NAME"] = str(directory / f"command-{index}.json")
    versions = {"python": sys.version.split()[0]}
    try:
        result = subprocess.run(argv, cwd=cwd, env=env, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired) as error:
        return {"status": "blocked", "command": argv, "cwd": str(cwd), "error": str(error), "versions": versions}
    log = directory / f"command-{index}.log"
    log.write_text(result.stdout)
    status = "passed" if result.returncode == 0 else "failed"
    if any(fragment in result.stdout.lower() for fragment in (
        "executable doesn't exist", "host system is missing dependencies",
        "cannot find module", "error while loading shared libraries", "command not found",
    )):
        status = "blocked"
    info = {"status": status, "command": argv, "cwd": str(cwd),
            "exit_code": result.returncode, "log": str(log), "versions": versions}
    if command.get("report_format") == "playwright-json":
        report = directory / f"command-{index}.json"
        try:
            data = json.loads(report.read_text() if report.exists() else result.stdout)
            info["stats"] = data["stats"]
            info["versions"]["playwright"] = data.get("config", {}).get("version", "not reported")
            info["report"] = str(report if report.exists() else log)
            if info["status"] != "blocked" and (data["stats"].get("unexpected") or data["stats"].get("flaky")):
                info["status"] = "failed"
            if not data["stats"].get("expected", 0):
                info["status"] = "blocked"
                info["error"] = "No tests passed; inspect missing tools, skips, discovery or setup failures."
        except (ValueError, KeyError, OSError) as error:
            info["status"] = "blocked"
            info["error"] = "No valid Playwright JSON report: " + str(error)
    elif command.get("report_format") == "findings-json":
        try:
            data = json.loads(result.stdout)
            if data.get("status") not in ("passed", "failed", "blocked") or not isinstance(data.get("findings"), list):
                raise ValueError("Expected status and findings array.")
            if info["status"] != "blocked":
                info["status"] = data["status"] if result.returncode == 0 else "failed"
            info["findings"] = data["findings"]
            info["counts"] = data.get("counts", {})
            info["versions"].update(data.get("versions", {}))
        except ValueError as error:
            info.update(status="blocked", error="Invalid findings report: " + str(error))
    return info


def run(profile, base, suites, output):
    results = {}
    for suite in suites:
        settings = profile["qa"].get(suite, {})
        directory = output / suite
        directory.mkdir(parents=True, exist_ok=True)
        if settings.get("enabled") is not True:
            results[suite] = {"status": "blocked", "error": "Suite not configured and enabled."}
            continue
        try:
            check_environment(settings, base)
            result = audit(base, settings) if suite == "seo" else {"status": "passed"}
            result["commands"] = [
                command_result(command, base, directory, index, profile["qa"].get("timeout_seconds", 900))
                for index, command in enumerate(settings.get("commands", []), 1)
            ]
            if suite != "seo" and not result["commands"]:
                result.update(status="blocked", error="No commands configured for this suite.")
            states = [result["status"]] + [item["status"] for item in result["commands"]]
            result["status"] = "blocked" if "blocked" in states else ("failed" if "failed" in states else "passed")
            result["limitations"] = result.get("limitations", []) + settings.get("limitations", [])
            results[suite] = result
        except (ValueError, OSError, KeyError, TypeError) as error:
            results[suite] = {"status": "blocked", "error": str(error)}
        (directory / "result.json").write_text(json.dumps(results[suite], indent=2))
    statuses = [item["status"] for item in results.values()]
    status = "blocked" if "blocked" in statuses else ("failed" if "failed" in statuses else "passed")
    summary = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": status, "target": base, "python_version": sys.version.split()[0],
        "suites": results, "exclusions": profile["qa"].get("exclusions", []),
        "performance_environment": {key: value for key, value in os.environ.items() if key.startswith("PERF_MAX_")},
        "safety": "Vetted commands only; execution is not a security sandbox. No fixes performed by this runner.",
    }
    (output / "summary.json").write_text(json.dumps(summary, indent=2))
    lines = [f"QA status: {status}", f"Target: {base}", ""]
    for name, result in results.items():
        lines.append(f"{name}: {result['status']}")
        if "pages_checked" in result:
            lines.append(f"  {result['pages_checked']} pages; {result['failures']} failures; {result['warnings']} warnings")
        if result.get("error"):
            lines.append("  " + result["error"])
        for command in result.get("commands", []):
            lines.append("  Command: " + json.dumps(command["command"]))
            if command.get("stats"):
                lines.append("  Stats: " + json.dumps(command["stats"]))
            if command.get("counts"):
                lines.append("  Editorial counts: " + json.dumps(command["counts"]))
        for limitation in result.get("limitations", []):
            lines.append("  Limitation: " + limitation)
    lines.extend(["", "Exclusions:"] + ["- " + item for item in summary["exclusions"]])
    (output / "summary.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    print("Reports:", output)
    return 2 if status == "blocked" else (1 if status == "failed" else 0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--suite", required=True, choices=(*SUITES, "all"))
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    try:
        base = args.base_url.rstrip("/")
        profile = load_profile(args.profile.resolve(), base)
        output = args.output_dir.resolve()
        if output.is_relative_to(ROOT):
            raise ValueError("Choose a report directory outside the repository to avoid source/configuration changes.")
        if output.exists() and any(output.iterdir()):
            raise ValueError("Report directory must be empty; prior evidence will not be overwritten.")
        output.mkdir(parents=True, exist_ok=True)
        suites = SUITES if args.suite == "all" else (args.suite,)
        return run(profile, base, suites, output)
    except (OSError, ValueError, KeyError, TypeError) as error:
        print("QA blocked:", error, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
