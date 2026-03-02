"""
report_builder.py — Build the final structured report with rich descriptive analysis.
"""

LAYER_DESCRIPTIONS = {
    "static_rules": {
        "title": "Security & Static Rule Analysis",
        "icon": "🛡️",
        "description": "Evaluates 25 hand-crafted security rules across authentication, data protection, API safety, infrastructure, and code quality. Each rule maps to real-world standards (OWASP, NIST, SLSA) and is weighted by the severity of its absence.",
        "good": "Your project demonstrates solid security hygiene with proper authentication mechanisms, data protection patterns, and defensive coding practices in place.",
        "warning": "Several important security controls are missing or weak. AI integration would expose these gaps through new data flows and attack vectors.",
        "critical": "Critical security controls are absent. Integrating AI into this project would significantly expand the attack surface without adequate protection.",
    },
    "import_graph": {
        "title": "File Cohesion & Dependency Graph",
        "icon": "🔗",
        "description": "Analyses whether the uploaded files form a coherent, well-structured project. Builds an import/dependency graph, detects orphan files (unrelated code), circular dependencies, and measures how interconnected the codebase is.",
        "good": "The project files are well-connected and form a cohesive architecture. No orphan files or circular dependencies detected. This is a strong signal that the project is production-quality.",
        "warning": "Some files appear disconnected from the main codebase. This could indicate random file inclusions or an inconsistent project structure that would complicate AI integration.",
        "critical": "The uploaded files show very low cohesion — many appear unrelated to each other. This may not be a complete or properly structured project.",
    },
    "ast_metrics": {
        "title": "Code Quality & Complexity",
        "icon": "🔬",
        "description": "Performs static code quality analysis — measuring comment density, function complexity (branch depth), dead/unused imports, class structure, and overall maintainability. Clean, well-documented code integrates with AI far more reliably.",
        "good": "The code demonstrates good quality discipline: reasonable function complexity, adequate documentation, and clean import management. This is a positive signal for long-term AI maintainability.",
        "warning": "Some code quality issues detected: high function complexity, low comment density, or dead imports found. These create technical debt that makes AI integration harder to maintain.",
        "critical": "Significant code quality problems detected. Highly complex functions, minimal documentation, and messy structure will make AI integration extremely difficult to debug and maintain.",
    },
    "dependencies": {
        "title": "Dependency Risk Analysis",
        "icon": "📦",
        "description": "Scans all package manifests (requirements.txt, package.json) to identify unpinned versions, deprecated packages, and libraries with known security histories. AI systems that rely on vulnerable dependencies inherit all those risks.",
        "good": "Dependencies are well-managed with pinned versions and no deprecated packages detected. The dependency hygiene is production-ready.",
        "warning": "Several dependencies have unpinned versions or are deprecated. This creates reproducibility risks and potential security vulnerabilities in AI-augmented pipelines.",
        "critical": "Dependency management is poor — many packages are unpinned, deprecated, or known to have security histories. These must be addressed before AI integration.",
    },
    "test_coverage": {
        "title": "Test Coverage & Quality",
        "icon": "🧪",
        "description": "Measures the ratio of test files to source files and counts assertions. AI integration adds new code paths and edge cases — a project without tests will have no safety net for regressions introduced by AI features.",
        "good": "Good test coverage detected. The project has a healthy test-to-source ratio with meaningful assertions. AI features added to this project will have regression protection.",
        "warning": "Test coverage is below recommended levels. Adding AI capabilities without tests means you'll have no way to detect when AI outputs break existing functionality.",
        "critical": "Minimal or no tests detected. This is a high-risk signal — AI integration without tests leads to undetectable regressions and unpredictable behavior in production.",
    },
    "api_quality": {
        "title": "API Design & Standards",
        "icon": "⚡",
        "description": "Evaluates API design quality: URL versioning, OpenAPI/Swagger documentation, proper HTTP status codes, request validation, pagination support, and error response consistency. AI systems need stable, documented APIs to integrate reliably.",
        "good": "APIs follow good design standards with versioning, proper status codes, and validation. AI agents and services can integrate with this API layer predictably.",
        "warning": "API design has notable gaps: missing versioning, incomplete documentation, or inconsistent error handling. This makes AI integration brittle and harder to maintain.",
        "critical": "API standards are largely absent. Integrating AI services via this API would be unreliable due to poor versioning, no documentation, and inconsistent contracts.",
    },
    "tech_debt": {
        "title": "Technical Debt Assessment",
        "icon": "⚠️",
        "description": "Counts TODO, FIXME, HACK, and DEPRECATED markers in the codebase — indicators of acknowledged but unresolved issues. High technical debt means known problems will interact unpredictably with new AI features.",
        "good": "Technical debt is very low. The codebase shows disciplined maintenance with minimal unresolved issues. This is an excellent foundation for AI integration.",
        "warning": "Moderate technical debt detected. Known issues (TODOs/FIXMEs) exist that could interact negatively with AI features and create unexpected behaviors.",
        "critical": "High technical debt. The codebase has numerous acknowledged issues that must be resolved before adding AI capabilities, which will amplify existing problems.",
    },
    "env_maturity": {
        "title": "Environment & Configuration Maturity",
        "icon": "⚙️",
        "description": "Evaluates how well the project manages configuration: use of environment variables, presence of .env.example, absence of hardcoded localhost URLs, and production-safe configuration patterns. Poor config management is a major AI deployment risk.",
        "good": "Configuration management follows best practices — environment variables, .env templates, and no hardcoded configuration values detected. AI deployment will be smooth across environments.",
        "warning": "Configuration management has gaps: some hardcoded values or missing .env documentation. AI deployment across dev/staging/production may have unexpected configuration differences.",
        "critical": "Poor configuration management — hardcoded URLs, no .env templates, or debug modes enabled. AI features will have environment-specific failures in production.",
    },
    "observability": {
        "title": "Observability & Monitoring",
        "icon": "📡",
        "description": "Detects structured logging, health check endpoints, metrics collection (Prometheus, Datadog), error tracking (Sentry), and request ID tracking. AI systems require deep observability because they add non-deterministic behavior that must be monitored.",
        "good": "Strong observability stack detected with logging, health checks, and error tracking. AI model outputs, latency, and errors will be trackable and debuggable in production.",
        "warning": "Limited observability detected. When AI features misbehave (hallucinations, latency spikes, unexpected outputs), there will be limited visibility into root causes.",
        "critical": "No observability infrastructure detected. Running AI models without logging, metrics, or health checks is extremely risky — problems will be invisible until they cause outages.",
    },
}

def build_report(
    result: dict,
    project_info: dict,
    rules: dict,
    graph: dict,
    ast: dict,
    deps: dict,
    tests: dict,
    api: dict,
    debt: dict,
    env: dict,
    obs: dict,
) -> dict:
    score = result["score"]
    status = result["status"]
    layer_scores = result["layer_scores"]

    executive_summary = _executive_summary(score, status, project_info, result)
    improvement_diagnostics = _improvement_diagnostics(layer_scores, result, graph, deps, tests)
    capabilities = _infer_capabilities(rules)
    layer_analysis = _build_layer_analysis(layer_scores, graph, ast, deps, tests, api, debt, env, obs)
    risk_register = _build_risk_register(result["risks"], rules)

    return {
        "score": score,
        "status": status,
        "summary": f"{status} AI readiness across {len(layer_scores)} analysis layers.",
        "executive_summary": executive_summary,
        "layer_scores": layer_scores,
        "category_scores": layer_scores,
        "risks": result["risks"],
        "risk_register": risk_register,
        "blockers": result["blockers"],
        "capabilities": capabilities,
        "improvement_diagnostics": improvement_diagnostics,
        "why_not_80": result["why_not_80"],
        "gate_checks": result["gate_checks"],
        "layer_analysis": layer_analysis,
        "project_profile": {
            "stack": project_info.get("stack", []),
            "primary_language": project_info.get("primary_language", "Unknown"),
            "total_files": project_info.get("total_files", 0),
            "has_docker": project_info.get("has_docker", False),
            "has_cicd": project_info.get("has_cicd", False),
            "language_diversity": project_info.get("language_diversity", 1),
            "file_extensions": project_info.get("file_extensions", []),
        },
        "score_details": {
            "layer_weights": result["layer_weights"],
            "cohesion_score": graph["cohesion_score"],
            "orphan_files": graph["orphan_count"],
            "orphan_list": graph.get("orphan_files", []),
            "has_circular_imports": graph["has_circular_imports"],
            "connected_files": graph["connected_files"],
            "edge_count": graph["edge_count"],
            "test_ratio": tests["test_ratio"],
            "test_files": tests["test_files"],
            "source_files": tests["source_files"],
            "assertion_count": tests["assertion_count"],
            "total_dependencies": deps["total_dependencies"],
            "unpinned_deps": deps["unpinned_count"],
            "deprecated_deps": deps["deprecated"],
            "risky_deps": deps["known_risky"],
            "debt_markers": debt["total_debt_markers"],
            "todos": debt["todos"],
            "fixmes": debt["fixmes"],
            "hacks": debt["hacks"],
            "comment_density": ast["comment_density"],
            "total_functions": ast["total_functions"],
            "total_classes": ast["total_classes"],
            "dead_imports": ast["dead_imports_count"],
            "high_complexity": ast["high_complexity_count"],
            "has_logging": obs["has_logging"],
            "has_health_check": obs["has_health_check"],
            "has_metrics": obs["has_metrics"],
            "has_error_tracking": obs["has_error_tracking"],
            "has_env_example": env["has_env_example"],
            "uses_env_vars": env["uses_env_vars"],
            "has_hardcoded_localhost": env["has_hardcoded_localhost"],
            "has_api_versioning": api["has_versioning"],
            "has_openapi_docs": api["has_openapi_docs"],
            "has_pagination": api["has_pagination"],
        },
        "graph_analysis": {
            "cohesion_score": graph["cohesion_score"],
            "connected_files": graph["connected_files"],
            "orphan_count": graph["orphan_count"],
            "has_circular_imports": graph["has_circular_imports"],
            "orphan_files": graph["orphan_files"],
            "edge_count": graph["edge_count"],
            "connected_ratio": graph["connected_ratio"],
        },
        "dependency_analysis": {
            "dependency_score": deps["dependency_score"],
            "total": deps["total_dependencies"],
            "unpinned": deps["unpinned"],
            "deprecated": deps["deprecated"],
            "risky": deps["known_risky"],
        },
    }

def _build_layer_analysis(layer_scores, graph, ast, deps, tests, api, debt, env, obs) -> dict:
    """Build rich per-layer descriptive analysis."""
    reference_data = {
        "static_rules": {},
        "import_graph": {"orphan_count": graph["orphan_count"], "has_circular": graph["has_circular_imports"], "connected_ratio": graph["connected_ratio"]},
        "ast_metrics": {"complexity": ast["high_complexity_count"], "dead_imports": ast["dead_imports_count"], "comment_density": round(ast["comment_density"] * 100, 1)},
        "dependencies": {"unpinned": deps["unpinned_count"], "deprecated": len(deps["deprecated"]), "total": deps["total_dependencies"]},
        "test_coverage": {"ratio": round(tests["test_ratio"] * 100, 1), "test_files": tests["test_files"], "assertions": tests["assertion_count"]},
        "api_quality": {"versioning": api["has_versioning"], "openapi": api["has_openapi_docs"], "pagination": api["has_pagination"]},
        "tech_debt": {"todos": debt["todos"], "fixmes": debt["fixmes"], "hacks": debt["hacks"], "total": debt["total_debt_markers"]},
        "env_maturity": {"env_example": env["has_env_example"], "uses_vars": env["uses_env_vars"], "hardcoded_local": env["has_hardcoded_localhost"]},
        "observability": {"logging": obs["has_logging"], "health_check": obs["has_health_check"], "metrics": obs["has_metrics"], "error_tracking": obs["has_error_tracking"]},
    }

    analysis = {}
    for layer, score in layer_scores.items():
        info = LAYER_DESCRIPTIONS.get(layer, {})
        verdict = "good" if score >= 70 else "warning" if score >= 40 else "critical"
        analysis[layer] = {
            "title": info.get("title", layer),
            "icon": info.get("icon", "📊"),
            "score": score,
            "verdict": verdict,
            "description": info.get("description", ""),
            "analysis_text": info.get(verdict, ""),
            "data": reference_data.get(layer, {}),
        }
    return analysis

def _build_risk_register(risks: list, rules: dict) -> list:
    """Enhanced risk register with full descriptions."""
    RISK_DESCRIPTIONS = {
        "R11": "Hardcoded credentials or secrets found in source code. This is a critical security vulnerability — any attacker with code access gains immediate access to production systems.",
        "R18": "eval() or exec() usage detected. These functions execute arbitrary code and are frequently exploited in injection attacks. They should never appear in production code.",
        "R17": "Bare except: clauses found — catching all exceptions including system exits and keyboard interrupts. This masks critical errors and makes debugging nearly impossible.",
    }
    enhanced = []
    for r in risks:
        rule_id = r.get("rule_id", "")
        enhanced.append({
            **r,
            "description": RISK_DESCRIPTIONS.get(rule_id, f"Security concern in {r.get('category', 'system')}: {r.get('name', '')} was not detected or detected with issues."),
            "impact": _risk_impact(r.get("severity", "low")),
            "remediation": _risk_remediation(r.get("name", ""), r.get("category", "")),
        })
    return enhanced

def _risk_impact(severity: str) -> str:
    return {
        "critical": "Immediate exploitation risk. Can lead to data breach, system compromise, or complete application takeover.",
        "high": "Significant security or reliability risk. Likely to cause serious problems in production with AI integration.",
        "medium": "Moderate risk that degrades security posture. Should be resolved before scaling AI capabilities.",
        "low": "Minor improvement opportunity. Low immediate risk but contributes to technical debt over time.",
    }.get(severity, "Unknown impact level.")

def _risk_remediation(name: str, category: str) -> str:
    remediations = {
        "Hardcoded Secrets": "Move all secrets to environment variables. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or .env files excluded from git).",
        "JWT / Token Auth": "Implement JWT authentication using python-jose, PyJWT, or jsonwebtoken. All API endpoints must verify the Bearer token.",
        "RBAC / Permissions": "Define user roles and permission scopes. Use decorators/middleware to enforce access control on every sensitive endpoint.",
        "No eval/exec": "Remove all eval() and exec() calls. Replace with explicit function calls or AST parsing if code evaluation is genuinely needed.",
        "Proper Error Handling": "Wrap all external calls in try/except with specific exception types. Never use bare except: — always specify what you're catching.",
    }
    return remediations.get(name, f"Review {category} category controls and implement missing security patterns following OWASP guidelines.")

def _executive_summary(score: int, status: str, project_info: dict, result: dict) -> str:
    stack = ", ".join(project_info.get("stack", ["Unknown"]))
    total_files = project_info.get("total_files", 0)
    blockers = result.get("blockers", [])
    layer_scores = result.get("layer_scores", {})

    weakest = min(layer_scores, key=layer_scores.get) if layer_scores else "unknown"
    strongest = max(layer_scores, key=layer_scores.get) if layer_scores else "unknown"

    blocker_text = ""
    if blockers:
        blocker_text = f" Hard blockers were detected: {'; '.join(blockers[:2])}. These must be resolved before any AI integration."

    if score >= 75:
        outlook = f"This {stack} project ({total_files} files) is well-positioned for AI integration. The architecture shows maturity across most readiness dimensions. The strongest area is {strongest.replace('_', ' ')}, reflecting good engineering discipline."
    elif score >= 50:
        outlook = f"This {stack} project ({total_files} files) is partially ready for AI integration. While some capabilities are in place, significant gaps remain — particularly in {weakest.replace('_', ' ')}. A targeted improvement plan over 2–4 weeks could elevate this to AI-ready status."
    elif score >= 30:
        outlook = f"This {stack} project ({total_files} files) requires substantial improvement before AI integration is advisable. The primary weakness is {weakest.replace('_', ' ')}, but multiple layers need attention. Estimate 1–2 months of focused remediation work."
    else:
        outlook = f"This {stack} project ({total_files} files) is not ready for AI integration in its current state. Foundational engineering practices need to be established across security, testing, observability, and code quality before AI features can be added responsibly."

    return f"{outlook}{blocker_text} Analysis covered 9 independent layers scored and weighted to produce the final readiness score of {score}/100 ({status})."

def _improvement_diagnostics(layer_scores: dict, result: dict, graph, deps, tests) -> list:
    diags = []
    for name, score in sorted(layer_scores.items(), key=lambda x: x[1]):
        if score < 70:
            info = LAYER_DESCRIPTIONS.get(name, {})
            diags.append({
                "layer": info.get("title", name.replace("_", " ").title()),
                "icon": info.get("icon", "📊"),
                "score": score,
                "tip": _layer_tip(name, score, graph, deps, tests),
                "priority": "critical" if score < 30 else "high" if score < 50 else "medium",
                "effort": _effort(name, score),
            })
    return diags[:8]

def _layer_tip(name, score, graph, deps, tests) -> str:
    tips = {
        "static_rules": "Priority: implement JWT auth + RBAC, remove any hardcoded secrets, add rate limiting and CORS configuration. These 4 changes alone can raise this score by 30+ points.",
        "import_graph": f"Detected {graph.get('orphan_count', 0)} unrelated files. Remove irrelevant files and ensure your project has a clear entry point (main.py, index.js) that imports key modules. Also resolve any circular imports if present.",
        "ast_metrics": "Refactor functions longer than 50 lines. Add docstrings to all public functions and classes. Remove unused imports. Target: comment density >10%, complexity per function <8 branches.",
        "dependencies": f"{deps.get('unpinned_count', 0)} unpinned packages found. Pin ALL dependency versions (use ==X.Y.Z not >=X.Y). Remove deprecated packages. Run 'pip-audit' or 'npm audit' for vulnerability scanning.",
        "test_coverage": f"Current test ratio: {round(tests.get('test_ratio',0)*100)}%. Target: >15% of files should be test files. Add pytest/jest tests for all API endpoints, business logic functions, and data transformations.",
        "api_quality": "Add URL versioning (/api/v1/), integrate FastAPI/Swagger OpenAPI docs, use proper HTTP status codes (400, 401, 403, 404, 422, 500), add pagination to all list endpoints.",
        "tech_debt": "Resolve TODO/FIXME markers before AI integration. Each marker represents a known problem that will interact unpredictably with AI features. Prioritize FIXMEs and HACKs first.",
        "env_maturity": "Create .env.example with all required variables documented. Move all config to os.environ/process.env. Remove localhost hardcoding — use env vars for all service URLs.",
        "observability": "Add Python 'logging' module or 'loguru' with structured log levels. Create /health endpoint returning {status: 'ok'}. Integrate Sentry for error tracking. Add request ID middleware.",
    }
    return tips.get(name, f"Improve {name.replace('_',' ')} from {score}/100 by addressing the identified gaps in this layer.")

def _effort(name: str, score: int) -> str:
    high_effort = {"import_graph", "test_coverage", "ast_metrics"}
    low_effort = {"tech_debt", "env_maturity"}
    if name in low_effort:
        return "Low (hours)"
    if name in high_effort:
        return "High (days)"
    return "Medium (1–2 days)"

def _infer_capabilities(rules: dict) -> dict:
    mapping = {
        "Authentication (JWT/OAuth)": ["R01", "R02"],
        "Role-Based Access Control": ["R03"],
        "Session Management": ["R04"],
        "API Rate Limiting": ["R05"],
        "PII / Data Masking": ["R06"],
        "Password Hashing (bcrypt)": ["R07"],
        "Encryption (AES/TLS)": ["R08"],
        "Input Validation (Pydantic/Zod)": ["R09"],
        "SQL Injection Prevention": ["R10"],
        "Environment Variable Config": ["R12"],
        "Containerization (Docker)": ["R13"],
        "CI/CD Pipeline": ["R14"],
        "CORS Configuration": ["R15"],
        "Error Handling": ["R16"],
        "Structured Logging": ["R19"],
        "Health Check Endpoint": ["R20"],
        "API Versioning": ["R21"],
        "OpenAPI / Swagger Docs": ["R22"],
        "Async / Non-blocking": ["R24"],
        "Pagination Support": ["R25"],
    }
    capabilities = {}
    for cap, rule_ids in mapping.items():
        if any(rules.get(rid, {}).get("found", False) for rid in rule_ids):
            capabilities[cap] = True
    return capabilities
