"""
assessment_engine.py — Orchestrates the full 9-layer analysis pipeline.

PARALLELISM: layers 2-9 (graph, ast, deps, tests, api, debt, env, obs) all run
in parallel using ThreadPoolExecutor after the static analysis completes.
This reduces total analysis time from ~60 s sequential to ~20 s parallel.
"""
import logging
import os
import shutil
import tempfile
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed, wait, FIRST_EXCEPTION

from app.core.file_reader import read_files_from_zip, read_files_from_dir
from app.core.classifier import classify_project
from app.core.static_analyzer import run_static_analysis
from app.core.import_graph import build_import_graph
from app.core.ast_metrics import compute_ast_metrics
from app.core.dependency_checker import check_dependencies
from app.core.extra_checks import (
    check_test_coverage,
    check_api_quality,
    check_technical_debt,
    check_env_maturity,
    check_observability,
)
from app.core.score_engine import fuse_scores
from app.core.report_builder import build_report
from app.core.log_store import save_assessment_log

log = logging.getLogger(__name__)

def _emit(cb, stage: str, progress: int, message: str):
    if cb:
        try:
            cb(stage, progress, message)
        except Exception:
            pass

def run_assessment(
    zip_path: str | None,
    git_url: str | None,
    source_value: str,
    user_id: str = "",
    assessment_id: str = "",
    progress_cb=None,
) -> dict:
    tmp_dir = None
    try:

        _emit(progress_cb, "ingest", 8, "Extracting project files …")
        if zip_path:
            files, tmp_dir = read_files_from_zip(zip_path)
            source_type = "zip"
        elif git_url:
            tmp_dir = tempfile.mkdtemp(prefix="app_reader_git_")
            _emit(progress_cb, "ingest", 12, "Cloning Git repository (depth=1) …")
            subprocess.run(
                ["git", "clone", "--depth=1", git_url, tmp_dir],
                check=True, capture_output=True, timeout=60,
            )
            files = read_files_from_dir(tmp_dir)
            source_type = "git"
        else:
            raise ValueError("No source provided")

        file_count = len(files)
        _emit(progress_cb, "classify", 18, f"Loaded {file_count} files — classifying stack …")

        project_info = classify_project(files)

        _emit(progress_cb, "rules", 22, f"Starting 56-rule scan on {file_count} files …")
        static_result = run_static_analysis(files, progress_cb=progress_cb, base_pct=22, end_pct=42)
        _emit(progress_cb, "rules", 42, "Static analysis complete ✓")

        _emit(progress_cb, "graph", 44, "Running 8 analysis layers in parallel …")

        parallel_tasks = {
            "graph": lambda: build_import_graph(files),
            "ast":   lambda: compute_ast_metrics(files),
            "deps":  lambda: check_dependencies(files),
            "tests": lambda: check_test_coverage(files),
            "api":   lambda: check_api_quality(files),
            "debt":  lambda: check_technical_debt(files),
            "env":   lambda: check_env_maturity(files),
            "obs":   lambda: check_observability(files),
        }

        progress_map = {
            "graph": (48, "Import graph built"),
            "ast":   (52, "AST metrics computed"),
            "deps":  (56, "Dependency risk checked"),
            "tests": (60, "Test coverage measured"),
            "api":   (64, "API quality assessed"),
            "debt":  (68, "Technical debt counted"),
            "env":   (72, "Env maturity evaluated"),
            "obs":   (76, "Observability checked"),
        }

        results: dict = {}
        with ThreadPoolExecutor(max_workers=8) as pool:
            future_to_key = {pool.submit(fn): key for key, fn in parallel_tasks.items()}
            for future in as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    results[key] = future.result()
                    pct, msg = progress_map[key]
                    _emit(progress_cb, key, pct, msg)
                except Exception as exc:
                    log.warning(f"Layer '{key}' failed: {exc} — using defaults")

                    results[key] = _safe_default(key)

        graph = results["graph"]
        ast   = results["ast"]
        deps  = results["deps"]
        tests = results["tests"]
        api   = results["api"]
        debt  = results["debt"]
        env   = results["env"]
        obs   = results["obs"]

        _emit(progress_cb, "score", 88, "Fusing all 9 layer scores …")
        result = fuse_scores(
            static_result, graph, ast, deps, tests, api, debt, env, obs, project_info
        )

        _emit(progress_cb, "report", 94, "Generating detailed report …")
        report = build_report(
            result, project_info, static_result,
            graph, ast, deps, tests, api, debt, env, obs
        )

        _emit(progress_cb, "done", 100, "Assessment complete — report ready!")

        final_report = {
            **report,
            "source_type":  source_type,
            "source_value": source_value,
        }

        if assessment_id:
            try:
                save_assessment_log(
                    assessment_id=assessment_id,
                    user_id=user_id,
                    source_value=source_value,
                    source_type=source_type,
                    score=result.get("score", 0),
                    status=result.get("status", "Unknown"),
                    report=final_report,
                )
            except Exception as e:
                log.warning(f"Failed to save assessment log: {e}")

        return final_report

    finally:
        if tmp_dir and os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)

def _safe_default(key: str) -> dict:
    """Return a minimal valid result dict if a parallel layer crashes."""
    defaults = {
        "graph": {"cohesion_score": 50, "connected_files": 0, "total_files": 0,
                  "orphan_files": [], "orphan_count": 0, "has_circular_imports": False,
                  "connected_ratio": 0.5, "edge_count": 0},
        "ast":   {"ast_score": 50, "total_lines": 0, "total_functions": 0,
                  "total_classes": 0, "comment_density": 0, "high_complexity_count": 0,
                  "dead_imports_count": 0, "complexity_ratio": 0},
        "deps":  {"dependency_score": 70, "total_dependencies": 0, "unpinned_count": 0,
                  "unpinned": [], "deprecated": [], "known_risky": [], "unpinned_ratio": 0},
        "tests": {"test_score": 0, "test_files": 0, "source_files": 0,
                  "test_ratio": 0, "assertion_count": 0},
        "api":   {"api_score": 50, "has_versioning": False, "has_openapi_docs": False,
                  "has_http_status_codes": False, "has_pagination": False,
                  "has_request_validation": False, "has_error_response_format": False},
        "debt":  {"debt_score": 70, "todos": 0, "fixmes": 0, "hacks": 0,
                  "deprecated_markers": 0, "total_debt_markers": 0, "debt_ratio": 0},
        "env":   {"env_score": 50, "has_env_example": False, "uses_env_vars": False,
                  "has_hardcoded_localhost": False, "no_debug_in_prod": True},
        "obs":   {"observability_score": 40, "has_logging": False, "has_health_check": False,
                  "has_metrics": False, "has_error_tracking": False, "has_request_id_tracking": False},
    }
    return defaults.get(key, {})
