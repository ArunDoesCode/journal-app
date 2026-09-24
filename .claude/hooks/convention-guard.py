#!/usr/bin/python3
"""PreToolUse hook: block convention violations before they land on disk."""
import json
import os
import re
import sys

CODE_EXTS = (".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs")

SKIP_DIRS = (".claude/", "node_modules/", ".next/")


def strip_comments(text):
    # Remove /* ... */ block comments (non-greedy, DOTALL) and // line comments.
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"//[^\n]*", "", text)
    return text


def rel_path(root, file_path):
    try:
        rel = os.path.relpath(file_path, root)
    except ValueError:
        rel = file_path
    return rel


def is_skippable(root, file_path):
    if not file_path:
        return True
    abs_path = file_path
    if not os.path.isabs(abs_path):
        abs_path = os.path.join(root, abs_path)
    abs_path = os.path.normpath(abs_path)
    root_norm = os.path.normpath(root)
    if os.path.commonpath([abs_path, root_norm]) != root_norm:
        return True
    rel = rel_path(root, abs_path)
    rel_posix = rel.replace(os.sep, "/")
    for skip in SKIP_DIRS:
        if rel_posix.startswith(skip):
            return True
    return False


def collect_introduced_texts(tool_name, tool_input):
    """Return list of introduced text blobs, never old_string."""
    texts = []
    if tool_name == "Write":
        content = tool_input.get("content")
        if content is not None:
            texts.append(content)
    elif tool_name == "Edit":
        new_string = tool_input.get("new_string")
        if new_string is not None:
            texts.append(new_string)
    elif tool_name == "MultiEdit":
        for edit in tool_input.get("edits", []) or []:
            new_string = edit.get("new_string")
            if new_string is not None:
                texts.append(new_string)
    elif tool_name == "NotebookEdit":
        new_source = tool_input.get("new_source")
        if new_source is not None:
            texts.append(new_source)
    return texts


ALLOW_RE = re.compile(r"claude-hooks:allow\(([^)]*)\)")


def get_allowlist(texts):
    allowed = set()
    for text in texts:
        for m in ALLOW_RE.finditer(text):
            for rule_id in m.group(1).split(","):
                rule_id = rule_id.strip()
                if rule_id:
                    allowed.add(rule_id)
    return allowed


USE_SERVER_RE = re.compile(r'^[ \t]*["\']use server["\'][ \t]*;?[ \t]*$', re.M)
AXIOS_RE = re.compile(r'(?:import\s+.*?from\s+|require\()\s*["\']axios["\']')
NUQS_RE = re.compile(r'(?:import\s+.*?from\s+|require\()\s*["\']nuqs(?:/[^"\']*)?["\']')
SEMANTIC_TOKENS_RE = re.compile(
    r"\b(?:bg|text|border)-gray-\d{2,3}\b"
    r"|\bbg-white\b(?!/)"
    r"|\btext-black\b"
    r"|\bbg-black\b(?!/)"
)
NEXT16_IMAGES_RE = re.compile(r"\bimages\.domains\b")
NEXT16_LINT_RE = re.compile(r'"lint"\s*:\s*"[^"]*\bnext lint\b')

SEMANTIC_TOKENS_ALLOWLIST = (
    "components/ui/alert-dialog.tsx",
    "components/ui/sheet.tsx",
)

# Warn-only regexes
NEXT_HEADERS_IMPORT_RE = re.compile(r'from\s+["\']next/headers["\']')
UNAWAITED_ASYNC_API_RE = re.compile(
    r"(?<!await\s)\b(cookies|headers|draftMode)\s*\("
)
REVALIDATE_TAG_RE = re.compile(r"\brevalidateTag\(\s*[^,)]+\)")


def find_blocking_violations(rel, ext, combined_text, stripped_text):
    violations = []

    if ext in CODE_EXTS:
        if USE_SERVER_RE.search(stripped_text):
            violations.append(
                (
                    "use-server",
                    "Bare 'use server' directive line found; this convention is disallowed.",
                )
            )
        if AXIOS_RE.search(stripped_text):
            violations.append(
                ("no-axios", "Import/require of 'axios' is disallowed.")
            )
        if NUQS_RE.search(stripped_text):
            violations.append(
                ("no-nuqs", "Import/require of 'nuqs' is disallowed.")
            )

        rel_posix = rel.replace(os.sep, "/")
        if rel_posix not in SEMANTIC_TOKENS_ALLOWLIST:
            if SEMANTIC_TOKENS_RE.search(stripped_text):
                violations.append(
                    (
                        "semantic-tokens",
                        "Raw gray/white/black Tailwind color utility found; use semantic tokens instead.",
                    )
                )

        if rel_posix.endswith("next.config.ts"):
            if NEXT16_IMAGES_RE.search(stripped_text):
                violations.append(
                    (
                        "next16-images",
                        "'images.domains' is deprecated/removed in Next 16; use images.remotePatterns.",
                    )
                )

        if rel_posix.endswith("package.json"):
            if NEXT16_LINT_RE.search(combined_text):
                violations.append(
                    (
                        "next16-lint",
                        "'next lint' is removed in Next 16; use eslint directly.",
                    )
                )

    return violations


def find_warn_violations(rel, ext, stripped_text, is_new_file):
    warnings = []
    if ext in CODE_EXTS:
        if NEXT_HEADERS_IMPORT_RE.search(stripped_text) and UNAWAITED_ASYNC_API_RE.search(
            stripped_text
        ):
            warnings.append(
                "next16-async-api: cookies()/headers()/draftMode() may be used unawaited alongside a next/headers import. Verify these are awaited."
            )
        if REVALIDATE_TAG_RE.search(stripped_text):
            warnings.append(
                "next16-revalidate: revalidateTag(x) called with a single argument. Verify this matches the expected signature."
            )

    rel_posix = rel.replace(os.sep, "/")
    if is_new_file and re.match(r"^types/[^/]+\.ts$", rel_posix) and rel_posix != "types/index.ts":
        warnings.append(
            "types-barrel: new file under types/ created. Remember to re-export from types/index.ts."
        )

    return warnings


def find_placement_violation(root, rel, file_path):
    """Only for Write to a path that does not already exist."""
    if os.path.exists(file_path):
        return None

    rel_posix = rel.replace(os.sep, "/")
    basename = os.path.basename(rel_posix)

    if rel_posix == "middleware.ts":
        return (
            "placement-middleware",
            "root middleware.ts is disallowed; rename to proxy.ts.",
        )

    if re.search(r"View\.tsx$", basename):
        if not re.match(r"^components/views/[a-z0-9-]+/[A-Z]\w*View\.tsx$", rel_posix):
            return (
                "placement-view",
                "*View.tsx files must match components/views/<kebab-dir>/<PascalCase>View.tsx.",
            )

    m = re.match(r"^use[A-Z]\w*\.tsx?$", basename)
    if m:
        if not rel_posix.startswith("lib/hooks/"):
            return (
                "placement-hook",
                "use<Name>.ts(x) hooks must live under lib/hooks/.",
            )

    if re.search(r"Store\.ts$", basename):
        if not re.match(r"^lib/store/[a-z][A-Za-z0-9]*Store\.ts$", rel_posix):
            return (
                "placement-store",
                "*Store.ts files must match lib/store/<camelCase>Store.ts.",
            )

    if rel_posix.startswith("lib/api/"):
        if not re.match(r"^lib/api/[a-z0-9-]+/[a-z0-9-]+\.ts$", rel_posix):
            return (
                "placement-api",
                "Files under lib/api/ must match lib/api/<kebab-dir>/<kebab-file>.ts.",
            )

    if rel_posix.endswith(".tsx"):
        if not (rel_posix.startswith("app/") or rel_posix.startswith("components/")):
            return (
                "placement-tsx",
                ".tsx files must live under app/ or components/.",
            )

    return None


def main():
    raw = sys.stdin.read()
    data = json.loads(raw) if raw.strip() else {}

    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path")

    if tool_name not in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        sys.exit(0)

    if not file_path or is_skippable(root, file_path):
        sys.exit(0)

    abs_path = file_path if os.path.isabs(file_path) else os.path.join(root, file_path)
    abs_path = os.path.normpath(abs_path)
    rel = rel_path(root, abs_path)
    ext = os.path.splitext(abs_path)[1]

    texts = collect_introduced_texts(tool_name, tool_input)
    if not texts:
        sys.exit(0)

    combined_text = "\n".join(texts)
    stripped_text = strip_comments(combined_text)
    allowlist = get_allowlist(texts)

    violations = find_blocking_violations(rel, ext, combined_text, stripped_text)
    violations = [v for v in violations if v[0] not in allowlist]

    if tool_name == "Write":
        placement = find_placement_violation(root, rel, abs_path)
        if placement and placement[0] not in allowlist:
            violations.append(placement)

    if violations:
        lines = [
            "Blocked by convention-guard: {}".format(rel),
        ]
        for rule_id, explanation in violations:
            lines.append("[{}] {}".format(rule_id, explanation))
        lines.append(
            "To override a specific rule, include claude-hooks:allow(<rule-id>) "
            "(comma-separated for multiple) in the introduced text."
        )
        print(json.dumps({"decision": "block", "reason": "\n".join(lines)}))
        sys.exit(0)

    is_new_file = tool_name == "Write" and not os.path.exists(abs_path)
    warnings = find_warn_violations(rel, ext, stripped_text, is_new_file)
    warnings = [
        w for w in warnings if not any(w.startswith(rid + ":") for rid in allowlist)
    ]
    if warnings:
        msg = "convention-guard warnings for {}:\n{}".format(rel, "\n".join(warnings))
        print(json.dumps({"systemMessage": msg}))
        sys.exit(0)

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Fail open: never block on a hook bug.
        pass
    sys.exit(0)
