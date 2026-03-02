"""
file_reader.py — Extract files from ZIP upload or Git clone.

NO FILE COUNT LIMIT. NO FILE SIZE LIMIT.

For huge files (>500 KB / 1M+ lines): uses smart head+tail sampling.
  • First 80 000 chars  — captures all imports, class defs, config, auth
  • Last  5 000 chars   — captures exports, error handlers, final patterns
  • Reports real total_lines counted cheaply (newline count without full load)
"""
import os
import tempfile
import zipfile
import logging

log = logging.getLogger(__name__)

TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rb", ".php",
    ".cs", ".cpp", ".c", ".h", ".rs", ".swift", ".kt",
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".env", ".env.example",
    ".md", ".txt", ".rst", ".sh", ".bat", ".dockerfile",
    ".xml", ".html", ".css", ".scss", ".graphql", ".sql",
    ".gitignore", ".dockerignore", ".eslintrc", ".prettierrc",
}

SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    "dist", "build", ".next", ".cache", "coverage", ".tox",
    "eggs", ".eggs", "htmlcov", ".mypy_cache", ".pytest_cache",
    "target",
    ".gradle", "Pods",
}

HEAD_CHARS = 80_000
TAIL_CHARS  =  5_000

def read_files_from_zip(zip_path: str) -> tuple[list[dict], str]:
    """Extract ZIP and return (files, temp_dir). Caller must delete temp_dir."""
    tmp = tempfile.mkdtemp(prefix="app_reader_")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(tmp)
    files = _walk(tmp)
    log.info(f"ZIP: loaded {len(files)} files")
    return files, tmp

def read_files_from_dir(project_dir: str) -> list[dict]:
    files = _walk(project_dir)
    log.info(f"DIR: loaded {len(files)} files")
    return files

def _walk(root: str) -> list[dict]:
    results = []
    for dirpath, dirnames, filenames in os.walk(root):

        dirnames[:] = [
            d for d in dirnames
            if d not in SKIP_DIRS and not d.startswith('.')
        ]
        for fname in filenames:
            _, ext = os.path.splitext(fname)
            ext_lower = ext.lower()

            if ext_lower not in TEXT_EXTENSIONS and fname not in {
                "Dockerfile", "Makefile", ".env", ".env.example",
                ".eslintrc", ".prettierrc", "Pipfile", "Gemfile",
                "Cargo.toml", "go.mod", "go.sum",
            }:
                continue

            fpath = os.path.join(dirpath, fname)
            try:
                size = os.path.getsize(fpath)

                if size <= HEAD_CHARS + TAIL_CHARS:

                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    total_lines = content.count('\n') + 1
                else:

                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        head = f.read(HEAD_CHARS)

                    total_lines = _count_lines_fast(fpath)

                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        try:
                            f.seek(max(0, size - TAIL_CHARS))
                            tail = f.read()

                            nl = tail.find('\n')
                            tail = tail[nl + 1:] if nl >= 0 else tail
                        except Exception:
                            tail = ""

                    content = (
                        head
                        + f"\n\n# ... [{total_lines:,} total lines — middle section omitted for speed] ...\n\n"
                        + tail
                    )

                rel = os.path.relpath(fpath, root)
                results.append({
                    "path":        rel.replace("\\", "/"),
                    "content":     content,
                    "ext":         ext_lower,
                    "size_bytes":  size,
                    "total_lines": total_lines,
                    "is_sampled":  size > HEAD_CHARS + TAIL_CHARS,
                })
            except Exception as exc:
                log.debug(f"Skipped {fpath}: {exc}")

    return results

def _count_lines_fast(path: str) -> int:
    """Count newlines in a file using raw binary read — fast even for huge files."""
    count = 0
    try:
        with open(path, "rb") as f:
            while True:
                chunk = f.read(1 << 16)
                if not chunk:
                    break
                count += chunk.count(b'\n')
    except Exception:
        pass
    return count + 1
