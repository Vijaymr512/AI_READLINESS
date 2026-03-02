"""
classifier.py — Detect project stack/type from file patterns.
"""
import os

def classify_project(files: list[dict]) -> dict:
    paths = [f["path"] for f in files]
    exts = [f["ext"] for f in files]

    def has_file(*names):
        return any(os.path.basename(p) in names for p in paths)

    def has_ext(e):
        return e in exts

    def has_dir(d):
        return any(p.startswith(d + "/") or ("/" + d + "/") in p for p in paths)

    stack = []
    if has_file("package.json"):
        stack.append("Node.js")
    if has_ext(".jsx") or has_ext(".tsx"):
        stack.append("React")
    if has_ext(".vue"):
        stack.append("Vue")
    if has_file("requirements.txt", "setup.py", "pyproject.toml") or has_ext(".py"):
        stack.append("Python")
    if has_file("pom.xml", "build.gradle") or has_ext(".java"):
        stack.append("Java")
    if has_ext(".go"):
        stack.append("Go")
    if has_ext(".rs"):
        stack.append("Rust")
    if has_ext(".rb"):
        stack.append("Ruby")
    if has_file("Dockerfile", "docker-compose.yml", "docker-compose.yaml"):
        stack.append("Docker")
    if has_dir(".github/workflows") or has_dir(".gitlab-ci"):
        stack.append("CI/CD")

    lang_diversity = len([s for s in stack if s not in {"Docker", "CI/CD"}])

    return {
        "stack": stack,
        "primary_language": stack[0] if stack else "Unknown",
        "language_diversity": lang_diversity,
        "has_docker": "Docker" in stack,
        "has_cicd": "CI/CD" in stack,
        "total_files": len(files),
        "file_extensions": list(set(exts)),
    }
