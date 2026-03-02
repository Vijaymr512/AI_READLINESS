"""
dependency_checker.py — Detect risky or outdated dependencies.
"""
import re
import json

KNOWN_RISKY = {

    "pyyaml", "pillow", "requests", "urllib3", "cryptography", "paramiko",
    "django", "flask", "sqlalchemy", "celery", "numpy", "scipy",

    "lodash", "moment", "express", "axios", "react", "webpack",
    "log4js", "jsonwebtoken", "passport", "multer",
}

DEPRECATED = {"moment", "request", "bower", "grunt", "gulp"}

def check_dependencies(files: list[dict]) -> dict:
    all_deps: dict[str, str] = {}
    unpinned: list[str] = []
    deprecated: list[str] = []
    risky: list[str] = []

    for f in files:
        name = f["path"].split("/")[-1]
        if name == "requirements.txt":
            _parse_requirements(f["content"], all_deps, unpinned)
        elif name == "package.json":
            _parse_package_json(f["content"], all_deps, unpinned)

    for pkg in all_deps:
        pkg_lower = pkg.lower()
        if pkg_lower in DEPRECATED:
            deprecated.append(pkg)
        if pkg_lower in KNOWN_RISKY:
            risky.append(pkg)

    total = len(all_deps)
    unpinned_ratio = round(len(unpinned) / max(total, 1), 3)

    score = 80
    score -= len(deprecated) * 8
    score -= len(unpinned) * 3
    score = max(0, min(100, score))

    return {
        "dependency_score": score,
        "total_dependencies": total,
        "unpinned_count": len(unpinned),
        "unpinned": unpinned[:10],
        "deprecated": deprecated,
        "known_risky": risky[:10],
        "unpinned_ratio": unpinned_ratio,
    }

def _parse_requirements(content: str, deps: dict, unpinned: list):
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"([\w\-\.]+)\s*([><=!~^].+)?", line)
        if m:
            name = m.group(1).lower()
            version = (m.group(2) or "").strip()
            deps[name] = version
            if not version or version.startswith(">=") or version.startswith("~="):
                unpinned.append(name)

def _parse_package_json(content: str, deps: dict, unpinned: list):
    try:
        data = json.loads(content)
        for section in ("dependencies", "devDependencies"):
            for pkg, ver in data.get(section, {}).items():
                deps[pkg.lower()] = ver
                if ver.startswith("^") or ver.startswith("~") or ver == "*":
                    unpinned.append(pkg)
    except Exception:
        pass
