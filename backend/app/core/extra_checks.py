"""
extra_checks.py — Test coverage, API quality, technical debt, env maturity, observability.
All 5 supplementary analysis layers — PERFORMANCE OPTIMISED.

Key fix: instead of joining ALL file content into one giant string (slow on large repos),
use per-file early-exit scanning with a character cap.
"""
import re
import os

_MAX_FILES = 120
_MAX_CHARS = 6_000
_SRC_EXTS  = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb',
               '.yaml', '.yml', '.toml', '.cfg', '.env', '.json', '.md', '.sh'}

def _src_files(files: list[dict], max_f: int = _MAX_FILES) -> list[dict]:
    """Return capped list of source-like files."""
    out = [f for f in files if os.path.splitext(f.get('path',''))[1].lower() in _SRC_EXTS]
    return out[:max_f]

def _search_any(files: list[dict], pattern: str, flags=re.IGNORECASE) -> bool:
    """Return True as soon as the pattern is found in any file (early exit)."""
    rx = re.compile(pattern, flags)
    for f in files:
        if rx.search(f.get('content', '')[:_MAX_CHARS]):
            return True
    return False

def _count_all(files: list[dict], pattern: str, flags=re.IGNORECASE) -> int:
    """Count total matches across all files with content cap."""
    rx = re.compile(pattern, flags)
    total = 0
    for f in files:
        total += len(rx.findall(f.get('content', '')[:_MAX_CHARS]))
    return total

def check_test_coverage(files: list[dict]) -> dict:
    src = [f for f in files if os.path.splitext(f.get('path',''))[1].lower()
           in {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go'}]
    src = src[:200]
    test_files = [
        f for f in src
        if re.search(r'test_|_test\.|\btest\b|\bspec\b', f.get('path',''), re.IGNORECASE)
    ]
    total = len(src)
    tests = len(test_files)
    ratio = round(tests / max(total, 1), 3)

    assertion_count = 0
    rx = re.compile(r'\bassert\b|expect\(|assertTrue|assertEqual')
    for f in test_files[:30]:
        assertion_count += len(rx.findall(f.get('content', '')[:_MAX_CHARS]))

    score = min(int(ratio * 150), 100)
    if assertion_count < 5 and tests > 0:
        score = max(0, score - 20)

    return {
        "test_score": score,
        "test_files":    tests,
        "source_files":  total,
        "test_ratio":    ratio,
        "assertion_count": assertion_count,
    }

def check_api_quality(files: list[dict]) -> dict:
    src = _src_files(files)

    has_versioning    = _search_any(src, r'/api/v\d|prefix.*v\d|version.*\d')
    has_openapi       = _search_any(src, r'openapi|swagger|FastAPI\(|springdoc')
    has_http_codes    = _search_any(src, r'status_code|HTTPException|statusCode|http\.Status', 0)
    has_pagination    = _search_any(src, r'paginate|limit.*offset|page.*size|\bcursor\b')
    has_validation    = _search_any(src, r'pydantic|zod|joi|BaseModel|@Valid|@RequestBody')
    has_error_resp    = _search_any(src, r'error.*message|detail.*error|errorCode')

    signals = [has_versioning, has_openapi, has_http_codes,
               has_pagination, has_validation, has_error_resp]
    score = int((sum(signals) / len(signals)) * 100)

    return {
        "api_score": score,
        "has_versioning":             has_versioning,
        "has_openapi_docs":           has_openapi,
        "has_http_status_codes":      has_http_codes,
        "has_pagination":             has_pagination,
        "has_request_validation":     has_validation,
        "has_error_response_format":  has_error_resp,
    }

def check_technical_debt(files: list[dict]) -> dict:
    src = _src_files(files)

    todos      = _count_all(src, r'\bTODO\b')
    fixmes     = _count_all(src, r'\bFIXME\b')
    hacks      = _count_all(src, r'\bHACK\b|\bKLUDGE\b|\bWARNING\b')
    deprecated = _count_all(src, r'\bDEPRECATED\b|\bOBSOLETE\b')

    total_lines = sum(
        len(f.get('content', '')[:_MAX_CHARS].splitlines()) for f in src
    )

    total_markers = todos + fixmes + hacks + deprecated
    debt_ratio = round(total_markers / max(total_lines, 1), 4)

    if total_markers == 0:   score = 100
    elif debt_ratio < 0.005: score = 80
    elif debt_ratio < 0.01:  score = 60
    elif debt_ratio < 0.02:  score = 40
    else:                    score = 20

    return {
        "debt_score":         score,
        "todos":              todos,
        "fixmes":             fixmes,
        "hacks":              hacks,
        "deprecated_markers": deprecated,
        "total_debt_markers": total_markers,
        "debt_ratio":         debt_ratio,
    }

def check_env_maturity(files: list[dict]) -> dict:
    src = _src_files(files)
    paths = [f.get('path','') for f in files]

    has_env_example   = any('.env.example' in p or '.env.sample' in p for p in paths)
    has_dotenv_usage  = _search_any(src, r'dotenv|load_dotenv|process\.env\.')
    has_os_environ    = _search_any(src, r'os\.environ|os\.getenv|environ\.get', 0)

    sample = src[:30]
    has_hardcoded_lh  = _search_any(sample, r'["\']http://localhost:\d{4}["\']|["\']127\.0\.0\.1:\d{4}["\']', 0)
    no_debug_prod     = not _search_any(sample, r'DEBUG\s*=\s*True|debug\s*=\s*true|app\.debug\s*=\s*True', 0)

    signals = [has_env_example, has_dotenv_usage or has_os_environ,
               not has_hardcoded_lh, no_debug_prod]
    score = int((sum(signals) / len(signals)) * 100)

    return {
        "env_score":               score,
        "has_env_example":         has_env_example,
        "uses_env_vars":           has_dotenv_usage or has_os_environ,
        "has_hardcoded_localhost": has_hardcoded_lh,
        "no_debug_in_prod":        no_debug_prod,
    }

def check_observability(files: list[dict]) -> dict:
    src = _src_files(files)

    has_logging       = _search_any(src, r'logger\.|logging\.|winston|loguru|log\.info|log\.error|console\.log')
    has_health_check  = _search_any(src, r'/health|/ping|/status|healthcheck')
    has_metrics       = _search_any(src, r'prometheus|metrics|statsd|datadog|opentelemetry|traces')
    has_error_track   = _search_any(src, r'sentry|bugsnag|rollbar|error.*track')
    has_request_id    = _search_any(src, r'request.?id|correlation.?id|trace.?id|x-request-id')

    signals = [has_logging, has_health_check, has_metrics,
               has_error_track, has_request_id]
    score = int((sum(signals) / len(signals)) * 100)

    return {
        "observability_score":       score,
        "has_logging":               has_logging,
        "has_health_check":          has_health_check,
        "has_metrics":               has_metrics,
        "has_error_tracking":        has_error_track,
        "has_request_id_tracking":   has_request_id,
    }
