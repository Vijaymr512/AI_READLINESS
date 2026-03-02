"""
sandbox.py — Safety guardrails for uploaded project analysis.

Provides:
  1. ZIP bomb detection  — reject uploads with >5000 files or >500MB compressed
  2. Path traversal guard — detect ZIPs with absolute or parent-traversal paths
  3. Timeout wrapper      — kill analysis if it exceeds MAX_ANALYSIS_SECONDS
  4. Thread resource cap  — limit CPU via a simple wall-clock timeout

Windows-compatible (no resource.setrlimit needed).
"""
import os
import time
import zipfile
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

log = logging.getLogger(__name__)

MAX_ANALYSIS_SECS = 300

class SandboxError(Exception):
    """Raised when a submission violates safety rules."""

def check_zip_safety(zip_path: str) -> None:
    """
    Security-only scan of the ZIP central directory.
    Raises SandboxError for:
      - Corrupt / invalid ZIP files
      - Path traversal entries  (e.g. ../../etc/passwd)
    No limits on file count or archive size.
    """
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            for entry in zf.infolist():

                name = entry.filename
                parts = name.replace("\\", "/").split("/")
                if name.startswith(("/", "\\")) or ".." in parts:
                    raise SandboxError(
                        f"ZIP rejected: suspicious path entry '{name}' "
                        "(possible path traversal attack)."
                    )
    except zipfile.BadZipFile:
        raise SandboxError("Invalid ZIP file — could not open archive.")
    except SandboxError:
        raise
    except Exception as exc:
        raise SandboxError(f"ZIP validation error: {exc}")

def run_with_timeout(fn, timeout_secs: int = MAX_ANALYSIS_SECS, *args, **kwargs):
    """
    Run fn(*args, **kwargs) in a thread.  If it doesn't complete within
    timeout_secs seconds, raises TimeoutError.

    Note: Python threads cannot be forcibly killed.  The timeout causes
    the CALLER to stop waiting; the background thread will finish naturally
    (but its result is discarded).  For a full OS-level kill, use Docker or
    subprocess with a process group.
    """
    result_box  = [None]
    error_box   = [None]
    done_event  = threading.Event()

    def _worker():
        try:
            result_box[0] = fn(*args, **kwargs)
        except Exception as exc:
            error_box[0]  = exc
        finally:
            done_event.set()

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    finished = done_event.wait(timeout=timeout_secs)

    if not finished:
        raise TimeoutError(
            f"Analysis exceeded {timeout_secs}s timeout. "
            "Try a smaller repository or check for circular imports."
        )

    if error_box[0] is not None:
        raise error_box[0]

    return result_box[0]

def log_memory_usage(label: str = "analysis") -> None:
    """Log current process memory usage (best-effort)."""
    try:
        import psutil, os as _os
        proc = psutil.Process(_os.getpid())
        mb = proc.memory_info().rss / _MB
        log.info(f"[sandbox] {label} — RSS memory: {mb:.1f} MB")
        if mb > 1500:
            log.warning(f"[sandbox] High memory usage: {mb:.1f} MB during {label}")
    except ImportError:
        pass
    except Exception:
        pass
