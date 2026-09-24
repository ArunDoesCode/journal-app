#!/usr/bin/python3
"""SessionStart hook: inject a short repo-state briefing as additional context."""
import json
import os
import subprocess
import sys


def run_git(root, args):
    try:
        proc = subprocess.run(
            ["git"] + args,
            cwd=root,
            timeout=5,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if proc.returncode != 0:
            return ""
        return proc.stdout.decode("utf-8", "replace").strip()
    except (subprocess.TimeoutExpired, OSError):
        return ""


def read_package_json(root):
    path = os.path.join(root, "package.json")
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def get_version(pkg, name):
    for key in ("dependencies", "devDependencies"):
        deps = pkg.get(key, {})
        if isinstance(deps, dict) and name in deps:
            return deps[name]
    return "not found"


def build_context(root):
    branch = run_git(root, ["rev-parse", "--abbrev-ref", "HEAD"]) or "unknown"

    porcelain = run_git(root, ["status", "--porcelain"])
    staged = 0
    untracked = 0
    if porcelain:
        for line in porcelain.splitlines():
            if not line:
                continue
            if line.startswith("??"):
                untracked += 1
            else:
                staged += 1
    total_changed = staged + untracked

    last_commit = run_git(root, ["log", "-1", "--pretty=%h %s"]) or "no commits found"

    pkg = read_package_json(root)
    next_version = get_version(pkg, "next")
    react_version = get_version(pkg, "react")
    ts_version = get_version(pkg, "typescript")

    lines = [
        "Repo state:",
        "- branch: {}".format(branch),
        "- changed entries: {} total ({} staged, {} untracked)".format(
            total_changed, staged, untracked
        ),
        "- last commit: {}".format(last_commit),
        "- versions: next={} react={} typescript={}".format(
            next_version, react_version, ts_version
        ),
        "- reminder: `npm run verify` runs automatically on Stop.",
    ]

    deps = pkg.get("dependencies", {})
    if isinstance(deps, dict) and "next-pwa" in deps:
        lines.append(
            "- warning: next-pwa is still in dependencies; it is webpack-only and inert under Turbopack."
        )

    if total_changed > 50:
        lines.append(
            "- warning: {} changed entries is a lot; consider committing a baseline.".format(
                total_changed
            )
        )

    return "\n".join(lines)


def main():
    raw = sys.stdin.read()
    data = json.loads(raw) if raw.strip() else {}

    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()

    context = build_context(root)

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": context,
                }
            }
        )
    )
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
