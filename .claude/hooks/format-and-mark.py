#!/usr/bin/python3
"""PostToolUse hook: mark session dirty for the verify gate, then format the file."""
import hashlib
import json
import os
import subprocess
import sys

SKIP_DIRS = (".claude/", "node_modules/", ".next/")

DIRTY_EXTS = (".ts", ".tsx", ".mts")
FORMAT_EXTS = (".ts", ".tsx", ".mts", ".mjs", ".json", ".css", ".md")

MAX_FILES = 200


def rel_path(root, file_path):
    try:
        return os.path.relpath(file_path, root)
    except ValueError:
        return file_path


def is_skippable(root, file_path):
    if not file_path:
        return True
    abs_path = file_path if os.path.isabs(file_path) else os.path.join(root, file_path)
    abs_path = os.path.normpath(abs_path)
    root_norm = os.path.normpath(root)
    if os.path.commonpath([abs_path, root_norm]) != root_norm:
        return True
    rel = rel_path(root, abs_path).replace(os.sep, "/")
    for skip in SKIP_DIRS:
        if rel.startswith(skip):
            return True
    return False


def sha256_of(path):
    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except OSError:
        return None


def mark_dirty(root, session_id, rel):
    cache_dir = os.path.join(root, ".claude", ".cache")
    os.makedirs(cache_dir, exist_ok=True)
    state_path = os.path.join(cache_dir, "verify-{}.json".format(session_id))

    state = {"dirty": True, "files": []}
    if os.path.exists(state_path):
        try:
            with open(state_path, "r") as f:
                existing = json.load(f)
            if isinstance(existing, dict):
                state.update(existing)
                state["dirty"] = True
        except (OSError, ValueError):
            pass

    files = state.get("files", [])
    if not isinstance(files, list):
        files = []
    if rel not in files:
        files.append(rel)
    files = sorted(set(files))[:MAX_FILES]
    state["files"] = files

    tmp_path = state_path + ".tmp"
    with open(tmp_path, "w") as f:
        json.dump(state, f)
    os.replace(tmp_path, state_path)


def run_prettier(root, abs_path):
    prettier_bin = os.path.join(root, "node_modules", ".bin", "prettier")
    if not os.path.exists(prettier_bin):
        return

    before_hash = sha256_of(abs_path)
    if before_hash is None:
        return

    try:
        stat_before = os.stat(abs_path)
    except OSError:
        return

    try:
        subprocess.run(
            [prettier_bin, "--write", "--ignore-unknown", abs_path],
            cwd=root,
            timeout=25,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except (subprocess.TimeoutExpired, OSError):
        return

    after_hash = sha256_of(abs_path)
    if after_hash is None:
        return

    if after_hash == before_hash:
        # Prettier may have bumped mtime with no content change; restore it
        # so the Edit tool's staleness check doesn't trip on a no-op format.
        try:
            os.utime(abs_path, (stat_before.st_atime, stat_before.st_mtime))
        except OSError:
            pass
        return

    rel = rel_path(root, abs_path)
    context = (
        "prettier reformatted {}; on-disk content now differs from what you wrote. "
        "Re-read this file before your next Edit to it, or old_string may not match.".format(
            rel
        )
    )
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": context,
                }
            }
        )
    )


def main():
    raw = sys.stdin.read()
    data = json.loads(raw) if raw.strip() else {}

    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {}) or {}
    session_id = data.get("session_id", "unknown")
    file_path = tool_input.get("file_path")

    if tool_name not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)

    if not file_path or is_skippable(root, file_path):
        sys.exit(0)

    abs_path = file_path if os.path.isabs(file_path) else os.path.join(root, file_path)
    abs_path = os.path.normpath(abs_path)

    if not os.path.exists(abs_path):
        sys.exit(0)

    ext = os.path.splitext(abs_path)[1]
    rel = rel_path(root, abs_path).replace(os.sep, "/")

    if ext in DIRTY_EXTS:
        mark_dirty(root, session_id, rel)

    if ext in FORMAT_EXTS:
        run_prettier(root, abs_path)

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
