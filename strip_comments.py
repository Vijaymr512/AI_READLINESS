"""
strip_comments.py
Removes all inline comments from Python and JS/JSX/TS/TSX files.
- Python: uses tokenize module (safe — won't touch strings)
  Removes # comments, keeps docstrings (they can be import for FastAPI docs)
- JS/JSX/TS: regex-based, removes // and /* */ block comments
  Skips URLs inside strings (http://) to avoid breaking code
Run: python strip_comments.py
"""

import os
import re
import tokenize
import io
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "dist", "build", ".next", "target", ".mypy_cache",
    "brain", ".gemini",
}

PY_EXTS  = {".py"}
JS_EXTS  = {".js", ".jsx", ".ts", ".tsx", ".mjs"}

def strip_python_comments(source: str) -> str:
    """Remove # comments from Python source using tokenize."""
    result   = []
    last_row = 1
    last_col = 0

    try:
        tokens = list(tokenize.generate_tokens(io.StringIO(source).readline))
    except tokenize.TokenizeError:
        return source

    lines = source.splitlines(keepends=True)

    for tok_type, tok_str, tok_start, tok_end, _ in tokens:
        row, col = tok_start

        while last_row < row:
            result.append(lines[last_row - 1][last_col:])
            last_row += 1
            last_col  = 0
        if last_col < col:
            result.append(lines[row - 1][last_col:col])

        if tok_type == tokenize.COMMENT:

            pass
        else:
            result.append(tok_str)

        last_row = tok_end[0]
        last_col = tok_end[1]

    if last_row <= len(lines):
        result.append(lines[last_row - 1][last_col:])

    out = "".join(result)

    out = re.sub(r'[ \t]+\n', '\n', out)

    out = re.sub(r'\n{3,}', '\n\n', out)
    return out

def strip_js_comments(source: str) -> str:
    """Remove // and /* */ comments from JS/TS source."""

    result = []
    i = 0
    n = len(source)

    while i < n:

        if source[i] == "'":
            j = i + 1
            while j < n:
                if source[j] == '\\':
                    j += 2
                    continue
                if source[j] == "'":
                    j += 1
                    break
                j += 1
            result.append(source[i:j])
            i = j

        elif source[i] == '"':
            j = i + 1
            while j < n:
                if source[j] == '\\':
                    j += 2
                    continue
                if source[j] == '"':
                    j += 1
                    break
                j += 1
            result.append(source[i:j])
            i = j

        elif source[i] == '`':
            j = i + 1
            depth = 0
            while j < n:
                if source[j] == '\\':
                    j += 2
                    continue
                if source[j] == '`' and depth == 0:
                    j += 1
                    break
                j += 1
            result.append(source[i:j])
            i = j

        elif source[i:i+2] == '//':
            j = i
            while j < n and source[j] != '\n':
                j += 1
            i = j

        elif source[i:i+2] == '/*':
            j = source.find('*/', i + 2)
            if j == -1:
                i = n
            else:
                i = j + 2

            result.append(' ')

        else:
            result.append(source[i])
            i += 1

    out = ''.join(result)

    out = re.sub(r'[ \t]+\n', '\n', out)

    out = re.sub(r'\n{3,}', '\n\n', out)
    return out

def should_skip(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    return any(p in SKIP_DIRS for p in parts)

def process_directory(root: str):
    py_count  = 0
    js_count  = 0
    skip_count = 0

    for dirpath, dirnames, filenames in os.walk(root):

        dirnames[:] = [
            d for d in dirnames
            if d not in SKIP_DIRS and not d.startswith('.')
        ]

        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            ext   = os.path.splitext(fname)[1].lower()

            if should_skip(fpath):
                skip_count += 1
                continue

            if ext in PY_EXTS:
                try:
                    original = open(fpath, encoding='utf-8', errors='ignore').read()
                    stripped = strip_python_comments(original)
                    if stripped != original:
                        open(fpath, 'w', encoding='utf-8').write(stripped)
                        print(f"  ✓ PY  {os.path.relpath(fpath, root)}")
                    py_count += 1
                except Exception as e:
                    print(f"  ⚠ SKIP {fpath}: {e}")

            elif ext in JS_EXTS:
                try:
                    original = open(fpath, encoding='utf-8', errors='ignore').read()
                    stripped = strip_js_comments(original)
                    if stripped != original:
                        open(fpath, 'w', encoding='utf-8').write(stripped)
                        print(f"  ✓ JS  {os.path.relpath(fpath, root)}")
                    js_count += 1
                except Exception as e:
                    print(f"  ⚠ SKIP {fpath}: {e}")

    return py_count, js_count, skip_count

if __name__ == "__main__":
    print(f"\n🧹 Stripping comments from: {ROOT}\n")
    py, js, skipped = process_directory(ROOT)
    print(f"\n✅ Done — processed {py} Python files, {js} JS/JSX files ({skipped} skipped)\n")
