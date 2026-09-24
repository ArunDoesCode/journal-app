#!/usr/bin/python3
"""Stop hook: run the project's verify script as a quality gate."""
import json
import os
import shutil
import subprocess
import sys

MAX_BLOCKS = 2
TAIL_CAP = 6000


def state_path_for(root, session_id):
    return os.path.join(root, ".claude", ".cache", "verify-{}.json".format(session_id))


def load_state(path):
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except (OSError, ValueError):
        pass
    return {}


def save_state(path, state):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = path + ".tmp"
    with open(tmp_path, "w") as f:
        json.dump(state, f)
    os.replace(tmp_path, path)


def run_verify(root):
    npm = shutil.which("npm")
    if npm:
        try:
            proc = subprocess.run(
                [npm, "run", "--silent", "verify"],
                cwd=root,
                timeout=110,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            out = proc.stdout.decode("utf-8", "replace")
            err = proc.stderr.decode("utf-8", "replace")
            return proc.returncode, out + err
        except subprocess.TimeoutExpired as e:
            out = (e.stdout or b"").decode("utf-8", "replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
            err = (e.stderr or b"").decode("utf-8", "replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
            return 1, "verify timed out after 110s\n" + out + err
        except OSError as e:
            return 1, "failed to run npm: {}".format(e)

    # Fallback: npm not on PATH, degrade the gate rather than silently disabling it.
    fallback_cmd = (
        'node_modules/.bin/tsc --noEmit && node_modules/.bin/eslint .'
    )
    try:
        proc = subprocess.run(
            ["/bin/sh", "-lc", fallback_cmd],
            cwd=root,
            timeout=110,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        out = proc.stdout.decode("utf-8", "replace")
        err = proc.stderr.decode("utf-8", "replace")
        return proc.returncode, out + err
    except subprocess.TimeoutExpired as e:
        out = (e.stdout or b"").decode("utf-8", "replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
        err = (e.stderr or b"").decode("utf-8", "replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
        return 1, "verify (fallback) timed out after 110s\n" + out + err
    except OSError as e:
        return 1, "failed to run fallback verify command: {}".format(e)


def tail(text, cap):
    if len(text) <= cap:
        return text
    return text[-cap:]


def main():
    raw = sys.stdin.read()
    data = json.loads(raw) if raw.strip() else {}

    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    session_id = data.get("session_id", "unknown")
    stop_hook_active = bool(data.get("stop_hook_active", False))

    path = state_path_for(root, session_id)
    state = load_state(path)

    # Performance gate: a pure-research turn must cost 0s.
    if not state.get("dirty"):
        sys.exit(0)

    blocks = state.get("blocks", 0)
    if not isinstance(blocks, int):
        blocks = 0

    # Loop safety: the block counter is the load-bearing guard.
    if blocks >= MAX_BLOCKS:
        try:
            os.remove(path)
        except OSError:
            pass
        print(
            json.dumps(
                {
                    "systemMessage": (
                        "verify-gate: still failing after {} attempts; stopping anyway.".format(
                            blocks
                        )
                    )
                }
            )
        )
        sys.exit(0)

    returncode, output = run_verify(root)

    if returncode == 0:
        try:
            os.remove(path)
        except OSError:
            pass
        print(json.dumps({"systemMessage": "verify-gate: clean."}))
        sys.exit(0)

    blocks += 1
    state["blocks"] = blocks
    state["dirty"] = True
    save_state(path, state)

    files = state.get("files", [])
    if not isinstance(files, list):
        files = []

    reason_lines = [
        "verify-gate: npm run verify failed (attempt {} of {}).".format(
            blocks, MAX_BLOCKS
        ),
        "Files touched this session: {}".format(", ".join(files) if files else "(none recorded)"),
        "--- output tail ---",
        tail(output, TAIL_CAP),
    ]
    print(
        json.dumps(
            {
                "decision": "block",
                "reason": "\n".join(reason_lines),
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
