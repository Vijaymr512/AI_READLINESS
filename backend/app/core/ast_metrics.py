"""
ast_metrics.py — Code quality metrics via regex heuristics.
PERFORMANCE OPTIMISED: file cap + content cap + simple word-set check for dead imports.
"""
import re
import os

_MAX_PY_FILES = 80
_MAX_JS_FILES = 80
_MAX_CHARS    = 6_000

_BRANCH_RE  = re.compile(r'\b(if|elif|for|while|except|case)\b')
_FUNC_PY_RE = re.compile(r'^def\s+\w+', re.MULTILINE)
_CLASS_PY_RE= re.compile(r'^class\s+\w+', re.MULTILINE)
_FUNC_JS_RE = re.compile(r'\bfunction\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{')
_IMPORT_RE  = re.compile(r'^import\s+(\w+)', re.MULTILINE)
_FROM_RE    = re.compile(r'from\s+\S+\s+import\s+(\w+)', re.MULTILINE)
_COMMENT_RE = re.compile(r'^\s*(#|//|\*)', re.MULTILINE)

def compute_ast_metrics(files: list[dict]) -> dict:
    total_lines     = 0
    total_functions = 0
    total_classes   = 0
    high_complexity = 0
    comment_lines   = 0
    dead_imports    = 0

    all_src = [f for f in files
               if os.path.splitext(f.get('path',''))[1].lower()
               in {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go'}]
    py_files = [f for f in all_src if f.get('ext') == '.py'][:_MAX_PY_FILES]
    js_files = [f for f in all_src
                if f.get('ext') in {'.js', '.jsx', '.ts', '.tsx'}][:_MAX_JS_FILES]

    for f in all_src[:_MAX_PY_FILES + _MAX_JS_FILES]:
        content = f.get('content', '')[:_MAX_CHARS]
        total_lines   += content.count('\n') + 1
        comment_lines += len(_COMMENT_RE.findall(content))

    for f in py_files:
        content = f.get('content', '')[:_MAX_CHARS]
        funcs   = _FUNC_PY_RE.findall(content)
        classes = _CLASS_PY_RE.findall(content)
        total_functions += len(funcs)
        total_classes   += len(classes)

        branches = len(_BRANCH_RE.findall(content))
        if funcs and (branches / len(funcs)) > 8:
            high_complexity += 1

        words = set(re.split(r'\W+', content))
        names = _IMPORT_RE.findall(content) + _FROM_RE.findall(content)
        for name in names:
            if name and name not in words - {name}:
                dead_imports += 1

    for f in js_files:
        content = f.get('content', '')[:_MAX_CHARS]
        total_functions += len(_FUNC_JS_RE.findall(content))

    comment_density  = round(comment_lines / max(total_lines, 1), 3)
    complexity_ratio = round(high_complexity / max(total_functions, 1), 3)

    score = 60
    if comment_density  > 0.1:                             score += 10
    if dead_imports     < 5:                               score += 10
    if complexity_ratio < 0.3:                             score += 10
    if total_classes    > 0:                               score +=  5
    if high_complexity  > total_functions * 0.5:           score -= 15

    return {
        "ast_score":              min(max(score, 0), 100),
        "total_lines":            total_lines,
        "total_functions":        total_functions,
        "total_classes":          total_classes,
        "comment_density":        comment_density,
        "high_complexity_count":  high_complexity,
        "dead_imports_count":     dead_imports,
        "complexity_ratio":       complexity_ratio,
    }
