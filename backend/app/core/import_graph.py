"""
import_graph.py — Build a file import/dependency graph.
Measures file cohesion: are the uploaded files related to each other?
"""
import re
import os
from collections import defaultdict

def build_import_graph(files: list[dict]) -> dict:
    """
    Returns:
      - adjacency: {file_path: [imported_file_paths]}
      - cohesion_score: 0-100 (how connected the project is)
      - orphan_files: files with no imports from/to others
      - has_circular: bool
      - connected_ratio: fraction of files in main component
    """

    basename_map: dict[str, str] = {}
    for f in files:
        bn = os.path.splitext(os.path.basename(f["path"]))[0].lower()
        basename_map[bn] = f["path"]

    adjacency: dict[str, list[str]] = defaultdict(list)

    for f in files:
        content = f["content"]
        imports = _extract_imports(content, f["ext"])
        for imp in imports:

            resolved = _resolve(imp, basename_map, f["path"])
            if resolved and resolved != f["path"]:
                adjacency[f["path"]].append(resolved)

    all_paths = {f["path"] for f in files}

    connected_nodes = set(adjacency.keys())
    for targets in adjacency.values():
        connected_nodes.update(targets)
    connected_nodes &= all_paths

    orphans = [p for p in all_paths if p not in connected_nodes]
    connected_ratio = len(connected_nodes) / max(len(all_paths), 1)

    has_circular = _has_cycle(dict(adjacency))

    cohesion = int(connected_ratio * 80)
    if not has_circular:
        cohesion = min(cohesion + 20, 100)
    orphan_penalty = int((len(orphans) / max(len(all_paths), 1)) * 30)
    cohesion = max(0, cohesion - orphan_penalty)

    return {
        "cohesion_score": cohesion,
        "connected_files": len(connected_nodes),
        "total_files": len(all_paths),
        "orphan_files": orphans[:10],
        "orphan_count": len(orphans),
        "has_circular_imports": has_circular,
        "connected_ratio": round(connected_ratio, 3),
        "edge_count": sum(len(v) for v in adjacency.values()),
    }

def _extract_imports(content: str, ext: str) -> list[str]:
    imports = []
    if ext in {".py"}:

        imports += re.findall(r"from\s+([\w.]+)\s+import", content)
        imports += re.findall(r"^import\s+([\w.]+)", content, re.MULTILINE)
    elif ext in {".js", ".jsx", ".ts", ".tsx"}:

        imports += re.findall(r"""(?:import|from)\s+['"]([^'"]+)['"]""", content)
        imports += re.findall(r"""require\s*\(\s*['"]([^'"]+)['"]\s*\)""", content)
    elif ext in {".java"}:
        imports += re.findall(r"import\s+([\w.]+);", content)
    elif ext in {".go"}:
        imports += re.findall(r'"([\w./]+)"', content)
    return imports

def _resolve(imp: str, basename_map: dict[str, str], current_path: str) -> str | None:

    clean = imp.split(".")[-1].lower().replace("/", "").replace("\\", "")

    last = os.path.splitext(imp.split("/")[-1])[0].lower()
    return basename_map.get(clean) or basename_map.get(last)

def _has_cycle(graph: dict[str, list[str]]) -> bool:
    visited, rec_stack = set(), set()

    def dfs(node):
        visited.add(node)
        rec_stack.add(node)
        for nb in graph.get(node, []):
            if nb not in visited and dfs(nb):
                return True
            if nb in rec_stack:
                return True
        rec_stack.discard(node)
        return False

    return any(dfs(n) for n in graph if n not in visited)
