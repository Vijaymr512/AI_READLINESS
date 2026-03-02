"""
static_analyzer.py — 1000+ line comprehensive static analysis engine.

Scans every project file for 40+ rules across 8 categories:
  • Security & Auth             (rules R01–R10)
  • Data Protection             (rules R11–R18)
  • API Quality                 (rules R19–R26)
  • Infrastructure & DevOps     (rules R27–R33)
  • Code Quality                (rules R34–R40)
  • AI/ML Readiness             (rules R41–R46)
  • Performance                 (rules R47–R51)
  • Compliance                  (rules R52–R56)

Each rule returns:
  found     : bool   — whether the pattern was detected
  locations : list   — [{file, line, snippet, issue}]
  score_pts : int    — points contributed to static score
  severity  : str    — critical/high/medium/low
  category  : str    — category name
"""

import re
import math
from pathlib import Path
from typing import Any
from functools import lru_cache

_COMPILED: dict[str, re.Pattern] = {}

def _get_re(pattern: str) -> re.Pattern:
    if pattern not in _COMPILED:
        try:
            _COMPILED[pattern] = re.compile(pattern, re.IGNORECASE)
        except re.error:
            _COMPILED[pattern] = re.compile(re.escape(pattern), re.IGNORECASE)
    return _COMPILED[pattern]

_MAX_FILES   = 150
_MAX_CHARS   = 8_000
_MAX_HITS    = 20

_SRC_EXTS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb', '.php',
    '.cs', '.cpp', '.c', '.h', '.rs', '.swift', '.kt',
    '.yaml', '.yml', '.toml', '.cfg', '.ini', '.env',
    '.json', '.md', '.txt', '.sh', '.dockerfile',
}

RULES = {

    "R01": {
        "name": "JWT / Token Auth",
        "category": "Security & Auth",
        "severity": "critical",
        "score_pts": 8,
        "description": "Project implements JWT or OAuth token-based authentication",
        "positive_patterns": [
            r"jwt\.", r"jsonwebtoken", r"python.jose", r"PyJWT",
            r"bearer", r"access_token", r"decode_token", r"verify_token",
            r"oauth2", r"JWTBearer", r"HTTPBearer", r"create_access_token",
        ],
        "negative_patterns": [],
        "advice": "Implement JWT auth with python-jose or PyJWT. Backend: decode/verify token on every protected route.",
    },
    "R02": {
        "name": "Password Hashing",
        "category": "Security & Auth",
        "severity": "critical",
        "score_pts": 6,
        "description": "Passwords are hashed with a strong algorithm (bcrypt, argon2, pbkdf2)",
        "positive_patterns": [
            r"bcrypt", r"argon2", r"pbkdf2", r"hashpw", r"checkpw",
            r"hash_password", r"verify_password", r"make_password",
        ],
        "negative_patterns": [r"md5", r"sha1\(", r"hashlib\.md5"],
        "advice": "Use bcrypt (passlib[bcrypt]) to hash passwords. Never store plaintext or MD5/SHA1 hashed passwords.",
    },
    "R03": {
        "name": "RBAC / Permission System",
        "category": "Security & Auth",
        "severity": "high",
        "score_pts": 5,
        "description": "Role-based access control (admin/user/viewer roles) is implemented",
        "positive_patterns": [
            r"role", r"permission", r"is_admin", r"has_permission",
            r"@require_role", r"RoleChecker", r"Depends.*role",
            r"scope", r"authorize",
        ],
        "negative_patterns": [],
        "advice": "Define user roles in schema. Add role-checking middleware/decorator on admin endpoints.",
    },
    "R04": {
        "name": "Session / Refresh Token",
        "category": "Security & Auth",
        "severity": "medium",
        "score_pts": 4,
        "description": "Refresh tokens or session management is implemented",
        "positive_patterns": [
            r"refresh_token", r"session", r"cookie", r"httponly",
            r"revoke", r"blacklist",
        ],
        "negative_patterns": [],
        "advice": "Implement refresh tokens with short-lived access tokens. Store refresh tokens securely in httpOnly cookies.",
    },
    "R05": {
        "name": "Rate Limiting",
        "category": "Security & Auth",
        "severity": "high",
        "score_pts": 5,
        "description": "API rate limiting is configured to prevent abuse",
        "positive_patterns": [
            r"slowapi", r"ratelimit", r"rate_limit", r"throttle",
            r"@limiter", r"express-rate-limit", r"express-slow-down",
            r"RateLimiter", r"RATE_LIMIT",
        ],
        "negative_patterns": [],
        "advice": "Install slowapi (FastAPI) or express-rate-limit (Node). Apply per-IP limits on auth endpoints (5/min).",
    },
    "R06": {
        "name": "CORS Configuration",
        "category": "Security & Auth",
        "severity": "high",
        "score_pts": 4,
        "description": "CORS is explicitly configured (not wildcard * in production)",
        "positive_patterns": [
            r"CORSMiddleware", r"cors\(", r"allow_origins",
            r"cors_origins", r"CORS_ORIGIN", r"@cross_origin",
        ],
        "negative_patterns": [r'allow_origins=\["\*"\]', r"origin.*\*"],
        "advice": "Add CORSMiddleware with specific origins. Never use allow_origins=['*'] in production.",
    },
    "R07": {
        "name": "SQL Injection Prevention",
        "category": "Security & Auth",
        "severity": "critical",
        "score_pts": 7,
        "description": "Parameterised queries or ORM used — no raw string SQL interpolation",
        "positive_patterns": [
            r"sqlalchemy", r"tortoise", r"prisma", r"mongoose",
            r"motor", r"pymongo", r"execute\(.*\?", r"execute\(.*%s",
        ],
        "negative_patterns": [
            r'f"SELECT.*{', r"f'SELECT.*{", r"%" + r".*SELECT",
            r'execute\(f"', r"execute\(f'",
        ],
        "advice": "Use SQLAlchemy ORM or parameterised queries. Never interpolate user input into SQL strings.",
    },
    "R08": {
        "name": "CSRF Protection",
        "category": "Security & Auth",
        "severity": "medium",
        "score_pts": 3,
        "description": "CSRF tokens or SameSite cookies protect state-changing endpoints",
        "positive_patterns": [
            r"csrf", r"CSRF", r"csrftoken", r"samesite", r"SameSite",
            r"csrf_exempt", r"X-CSRF-Token",
        ],
        "negative_patterns": [],
        "advice": "For cookie-based auth: use SameSite=Strict and CSRF tokens. For JWT in Authorization headers, CSRF is not needed.",
    },
    "R09": {
        "name": "Input Validation (Schema)",
        "category": "Security & Auth",
        "severity": "high",
        "score_pts": 6,
        "description": "All inputs are validated with Pydantic, Zod, Joi, or similar",
        "positive_patterns": [
            r"pydantic", r"BaseModel", r"Field\(", r"validator",
            r"zod", r"joi", r"yup", r"marshmallow", r"cerberus",
            r"@validator", r"model_validator",
        ],
        "negative_patterns": [],
        "advice": "Use Pydantic BaseModel for all request bodies. Add validators for email format, string lengths, and enum values.",
    },
    "R10": {
        "name": "HTTPS / TLS Enforcement",
        "category": "Security & Auth",
        "severity": "high",
        "score_pts": 4,
        "description": "HTTPS/TLS is enforced or configured for production",
        "positive_patterns": [
            r"ssl_context", r"HTTPSRedirectMiddleware", r"ssl=True",
            r"tls", r"https", r"certfile", r"keyfile",
            r"SECURE_SSL_REDIRECT",
        ],
        "negative_patterns": [],
        "advice": "In production: configure TLS certificates via nginx/caddy. In FastAPI, add HTTPSRedirectMiddleware.",
    },

    "R11": {
        "name": "No Hardcoded Secrets",
        "category": "Data Protection",
        "severity": "critical",
        "score_pts": 10,
        "description": "No API keys, passwords, or secrets hardcoded in source code",
        "positive_patterns": [],
        "negative_patterns": [
            r'(?:SECRET|PASSWORD|API_KEY|TOKEN|PWD)\s*=\s*["\'][^"\']{6,}["\']',
            r'(?:secret|password|api_key|token)\s*=\s*["\'][^"\']{8,}["\']',
            r'sk-[a-zA-Z0-9]{20,}',
            r'Bearer [a-zA-Z0-9\-_\.]{20,}',
            r'mongodb\+srv://[^:]+:[^@]+@',
            r'postgres://[^:]+:[^@]+@',
        ],
        "advice": "Move ALL secrets to environment variables. Use python-decouple or os.environ.get(). Add .env to .gitignore immediately.",
    },
    "R12": {
        "name": "PII Data Masking",
        "category": "Data Protection",
        "severity": "high",
        "score_pts": 5,
        "description": "Personal data (email, SSN, card numbers) is masked in logs and responses",
        "positive_patterns": [
            r"mask", r"redact", r"anonymize", r"censor",
            r"pii", r"PII", r"\*{3,}", r"xxx",
        ],
        "negative_patterns": [],
        "advice": "Never log raw PII. Mask email as u***@domain.com. Implement a log formatter that redacts sensitive fields.",
    },
    "R13": {
        "name": "Encryption at Rest",
        "category": "Data Protection",
        "severity": "medium",
        "score_pts": 4,
        "description": "Sensitive data is encrypted when stored",
        "positive_patterns": [
            r"cryptography", r"fernet", r"aes", r"AES",
            r"encrypt", r"decrypt", r"encrypted_field",
        ],
        "negative_patterns": [],
        "advice": "Use Fernet (cryptography library) for symmetric encryption of sensitive fields. Store encryption keys in vault.",
    },
    "R14": {
        "name": "Data Retention Policy",
        "category": "Data Protection",
        "severity": "low",
        "score_pts": 2,
        "description": "Data deletion / retention logic is in place",
        "positive_patterns": [
            r"delete_after", r"ttl", r"expires_at", r"retention",
            r"purge", r"cleanup", r"archive",
        ],
        "negative_patterns": [],
        "advice": "Add TTL indexes in MongoDB for session and log data. Implement a scheduled job to purge old records.",
    },
    "R15": {
        "name": "GDPR / Consent Management",
        "category": "Data Protection",
        "severity": "medium",
        "score_pts": 3,
        "description": "User consent or GDPR compliance mechanisms detected",
        "positive_patterns": [
            r"gdpr", r"GDPR", r"consent", r"privacy_policy",
            r"right_to_erasure", r"data_export",
        ],
        "negative_patterns": [],
        "advice": "Implement: right-to-erasure endpoint, data export endpoint, privacy policy link, consent tracking in user schema.",
    },
    "R16": {
        "name": "File Upload Validation",
        "category": "Data Protection",
        "severity": "high",
        "score_pts": 5,
        "description": "File uploads are validated for type, size, and content",
        "positive_patterns": [
            r"content_type", r"mimetype", r"magic", r"file_size",
            r"max_size", r"UploadFile", r"multipart",
            r"\.zip", r"\.pdf", r"allow.*ext",
        ],
        "negative_patterns": [],
        "advice": "Validate file extension, MIME type, and size limit on upload. Scan uploads with ClamAV for malware in production.",
    },
    "R17": {
        "name": "Output Sanitization (XSS)",
        "category": "Data Protection",
        "severity": "high",
        "score_pts": 5,
        "description": "Output is sanitized to prevent XSS (DOMPurify, bleach, etc.)",
        "positive_patterns": [
            r"bleach", r"sanitize", r"domPurify", r"DOMPurify",
            r"escape", r"htmlspecialchars", r"markupsafe",
        ],
        "negative_patterns": [
            r"dangerouslySetInnerHTML", r"innerHTML\s*=",
        ],
        "advice": "Use DOMPurify in React for dynamic HTML. Use bleach library on backend for user-provided text. Avoid dangerouslySetInnerHTML.",
    },
    "R18": {
        "name": "Secrets Scanning Config",
        "category": "Data Protection",
        "severity": "medium",
        "score_pts": 3,
        "description": "git-secrets, gitleaks, or similar secret-scanning is configured",
        "positive_patterns": [
            r"gitleaks", r"git-secrets", r"trufflehog", r"detect-secrets",
            r"\.gitleaks", r"\.pre-commit",
        ],
        "negative_patterns": [],
        "advice": "Add .gitleaks.toml and run gitleaks in CI pipeline. Install pre-commit hook to prevent secrets from being committed.",
    },

    "R19": {
        "name": "API Versioning",
        "category": "API Quality",
        "severity": "high",
        "score_pts": 5,
        "description": "API uses URL versioning (/v1/, /v2/) or header versioning",
        "positive_patterns": [
            r"/v\d+/", r"APIVersion", r"api-version",
            r"prefix.*v\d", r"/api/v",
        ],
        "negative_patterns": [],
        "advice": "Prefix all routes with /api/v1/. When breaking changes happen, add /api/v2/ without removing /api/v1/.",
    },
    "R20": {
        "name": "OpenAPI / Swagger Docs",
        "category": "API Quality",
        "severity": "medium",
        "score_pts": 4,
        "description": "API has OpenAPI/Swagger documentation",
        "positive_patterns": [
            r"swagger", r"openapi", r"FastAPI\(", r"title=", r"description=",
            r"@ApiProperty", r"@ApiOperation", r"apidoc",
        ],
        "negative_patterns": [],
        "advice": "FastAPI generates OpenAPI docs automatically. Add title, description, version to FastAPI() constructor.",
    },
    "R21": {
        "name": "Proper HTTP Status Codes",
        "category": "API Quality",
        "severity": "medium",
        "score_pts": 4,
        "description": "API uses correct HTTP status codes (400, 401, 403, 404, 422, 500)",
        "positive_patterns": [
            r"status_code=40[0-9]", r"status_code=50[0-9]",
            r"HTTPException", r"status\.HTTP_", r"400", r"401",
            r"403", r"404", r"422", r"500",
        ],
        "negative_patterns": [],
        "advice": "Use HTTPException with proper status codes. 401=unauthenticated, 403=forbidden, 422=validation error, 500=server error.",
    },
    "R22": {
        "name": "Request Pagination",
        "category": "API Quality",
        "severity": "medium",
        "score_pts": 3,
        "description": "List endpoints support pagination (limit/offset or cursor)",
        "positive_patterns": [
            r"limit", r"offset", r"skip", r"page", r"cursor",
            r"per_page", r"pageSize", r"next_cursor",
        ],
        "negative_patterns": [],
        "advice": "Add ?limit=20&offset=0 parameters to all list endpoints. Return total_count in response body for frontend paging.",
    },
    "R23": {
        "name": "Error Response Schema",
        "category": "API Quality",
        "severity": "medium",
        "score_pts": 3,
        "description": "Consistent error response format across all endpoints",
        "positive_patterns": [
            r"error_code", r"error_response", r"detail.*message",
            r"ErrorResponse", r"APIError",
        ],
        "negative_patterns": [],
        "advice": "Define a standard ErrorResponse(code, message, detail) schema. Use exception handlers in FastAPI to return consistent errors.",
    },
    "R24": {
        "name": "Async / Non-blocking Operations",
        "category": "API Quality",
        "severity": "medium",
        "score_pts": 4,
        "description": "API uses async/await for IO operations",
        "positive_patterns": [
            r"async def", r"await ", r"asyncio",
            r"aiohttp", r"httpx\.AsyncClient",
        ],
        "negative_patterns": [r"time\.sleep\(", r"requests\.get\("],
        "advice": "Convert all DB and HTTP calls to async. Use Motor for MongoDB, httpx.AsyncClient for HTTP calls.",
    },
    "R25": {
        "name": "Request Timeout / Retry",
        "category": "API Quality",
        "severity": "low",
        "score_pts": 2,
        "description": "HTTP clients have timeout and retry configuration",
        "positive_patterns": [
            r"timeout", r"retry", r"RETRY", r"backoff",
            r"httpx.*timeout", r"requests.*timeout",
        ],
        "negative_patterns": [],
        "advice": "Set timeout=30 on all httpx/requests calls. Add tenacity retry decorator on external API calls.",
    },
    "R26": {
        "name": "API Response Caching",
        "category": "API Quality",
        "severity": "low",
        "score_pts": 2,
        "description": "API uses caching (Redis, memcached, Cache-Control headers)",
        "positive_patterns": [
            r"redis", r"cache", r"memcached", r"Cache-Control",
            r"@cache", r"lru_cache", r"fastapi-cache",
        ],
        "negative_patterns": [],
        "advice": "Add Redis caching with fastapi-cache2. Cache expensive analysis results with TTL=3600s.",
    },

    "R27": {
        "name": "Docker / Containerization",
        "category": "Infrastructure",
        "severity": "high",
        "score_pts": 5,
        "description": "Project has Dockerfile or docker-compose.yml",
        "positive_patterns": [
            r"FROM\s+\w+", r"EXPOSE", r"docker-compose",
            r"container_name", r"image:", r"ports:",
        ],
        "negative_patterns": [],
        "advice": "Create a Dockerfile with multi-stage build. Add docker-compose.yml for local development with MongoDB service.",
    },
    "R28": {
        "name": "CI/CD Pipeline",
        "category": "Infrastructure",
        "severity": "high",
        "score_pts": 5,
        "description": "CI/CD pipeline is configured (GitHub Actions, GitLab CI, etc.)",
        "positive_patterns": [
            r"\.github/workflows", r"gitlab-ci", r"Jenkinsfile",
            r"\.circleci", r"pipeline:", r"on:\s*push",
            r"github\.com/actions",
        ],
        "negative_patterns": [],
        "advice": "Add .github/workflows/ci.yml with: lint, test, docker build, and deploy steps. Run on every push to main.",
    },
    "R29": {
        "name": "Environment-based Config",
        "category": "Infrastructure",
        "severity": "high",
        "score_pts": 5,
        "description": "Configuration is loaded from environment variables, not hardcoded",
        "positive_patterns": [
            r"os\.environ", r"os\.getenv", r"process\.env",
            r"dotenv", r"BaseSettings", r"pydantic.*Settings",
            r"config\.", r"\.env",
        ],
        "negative_patterns": [],
        "advice": "Use pydantic-settings BaseSettings. All config in .env file, loaded automatically.",
    },
    "R30": {
        "name": ".env.example Template",
        "category": "Infrastructure",
        "severity": "medium",
        "score_pts": 3,
        "description": ".env.example exists to document required environment variables",
        "positive_patterns": [
            r"\.env\.example", r"\.env\.sample", r"\.env\.template",
        ],
        "negative_patterns": [],
        "advice": "Create .env.example listing all required variables with placeholder values. Commit this file (not .env).",
    },
    "R31": {
        "name": "Database Migrations",
        "category": "Infrastructure",
        "severity": "medium",
        "score_pts": 3,
        "description": "Database schema migrations are managed (Alembic, Flyway, etc.)",
        "positive_patterns": [
            r"alembic", r"migrate", r"migration", r"flyway",
            r"liquibase", r"db\.create_all",
        ],
        "negative_patterns": [],
        "advice": "Initialize Alembic for SQL databases. For MongoDB, use a migrations library or write idempotent migration scripts.",
    },
    "R32": {
        "name": "Health Check Endpoint",
        "category": "Infrastructure",
        "severity": "high",
        "score_pts": 4,
        "description": "/health or /ping endpoint returns service status",
        "positive_patterns": [
            r"health", r"ping", r"/status", r"readiness",
            r"liveness", r"heartbeat",
        ],
        "negative_patterns": [],
        "advice": "Add GET /health returning {status: 'ok', db: 'connected', version: '1.0'}. Used by load balancers and monitoring.",
    },
    "R33": {
        "name": "Reverse Proxy / Load Balancer Config",
        "category": "Infrastructure",
        "severity": "low",
        "score_pts": 2,
        "description": "Nginx, Caddy, or similar reverse proxy configuration present",
        "positive_patterns": [
            r"nginx", r"caddy", r"traefik", r"proxy_pass",
            r"server_name", r"upstream",
        ],
        "negative_patterns": [],
        "advice": "Add nginx.conf with proxy_pass to uvicorn. Handle SSL termination, gzip, and static file serving at nginx level.",
    },

    "R34": {
        "name": "No eval() / exec()",
        "category": "Code Quality",
        "severity": "critical",
        "score_pts": 8,
        "description": "No eval() or exec() used in source code",
        "positive_patterns": [],
        "negative_patterns": [
            r"\beval\s*\(", r"\bexec\s*\(",
            r"new Function\(", r"execFile\(",
        ],
        "advice": "Remove all eval()/exec() calls. Use json.loads() for JSON parsing, importlib for dynamic imports, ast.literal_eval() for safe evaluation.",
    },
    "R35": {
        "name": "Proper Exception Handling",
        "category": "Code Quality",
        "severity": "high",
        "score_pts": 5,
        "description": "Specific exceptions are caught (not bare except:)",
        "positive_patterns": [
            r"except\s+\w+Error", r"except\s+\w+Exception",
            r"except\s+\(", r"except\s+ValueError",
            r"\.catch\(", r"catch\s*\(err",
        ],
        "negative_patterns": [
            r"except:", r"except\s+Exception\s*:", r"catch\s*\(\s*\)",
        ],
        "advice": "Replace bare 'except:' with specific exceptions: except (ValueError, KeyError) as e. Log the exception with context.",
    },
    "R36": {
        "name": "Dependency Pinning",
        "category": "Code Quality",
        "severity": "high",
        "score_pts": 5,
        "description": "All dependency versions are pinned (==) not floating (>=)",
        "positive_patterns": [
            r"==\d+\.\d+",
        ],
        "negative_patterns": [
            r">=\d+\.\d+", r">\d+\.\d+", r"\*",
        ],
        "advice": "Pin all dependencies to exact versions: fastapi==0.110.0. Run 'pip freeze > requirements.txt' to capture current versions.",
    },
    "R37": {
        "name": "Type Annotations",
        "category": "Code Quality",
        "severity": "medium",
        "score_pts": 3,
        "description": "Functions use type hints/annotations",
        "positive_patterns": [
            r"def\s+\w+\(.*:\s*\w+", r"->\s*\w+",
            r"Optional\[", r"List\[", r"Dict\[", r"Union\[",
            r"TypeScript", r"interface\s+\w+",
        ],
        "negative_patterns": [],
        "advice": "Add type hints to all function parameters and return types. Use mypy for static type checking.",
    },
    "R38": {
        "name": "Dead Code Free",
        "category": "Code Quality",
        "severity": "low",
        "score_pts": 2,
        "description": "Minimal commented-out code blocks",
        "positive_patterns": [],
        "negative_patterns": [
            r"#.*def\s+\w+", r"//.*function\s+\w+",
            r"\/\*.*\*+\/", r"# TODO.*delete",
        ],
        "advice": "Remove all commented-out code. Use version control (git) to track history instead of leaving dead code.",
    },
    "R39": {
        "name": "Linting / Formatting Config",
        "category": "Code Quality",
        "severity": "low",
        "score_pts": 2,
        "description": "Linting/formatting config exists (.flake8, .eslintrc, pyproject.toml)",
        "positive_patterns": [
            r"\.flake8", r"\.eslintrc", r"pyproject\.toml",
            r"\.prettierrc", r"black", r"ruff",
            r"\[tool\.black\]", r"eslint",
        ],
        "negative_patterns": [],
        "advice": "Add pyproject.toml with [tool.black] and [tool.ruff] sections. Set max line length to 100.",
    },
    "R40": {
        "name": "Pre-commit Hooks",
        "category": "Code Quality",
        "severity": "low",
        "score_pts": 2,
        "description": ".pre-commit-config.yaml ensures quality gates before commits",
        "positive_patterns": [
            r"pre-commit", r"pre_commit", r"husky",
            r"lint-staged",
        ],
        "negative_patterns": [],
        "advice": "Add .pre-commit-config.yaml with hooks: black, ruff, gitleaks. Run 'pre-commit install' after cloning.",
    },

    "R41": {
        "name": "Async Task Queue",
        "category": "AI/ML Readiness",
        "severity": "high",
        "score_pts": 6,
        "description": "Background task queue present for long-running AI operations",
        "positive_patterns": [
            r"celery", r"arq", r"rq\.", r"dramatiq",
            r"BackgroundTasks", r"background_tasks",
            r"asyncio\.create_task", r"concurrent\.futures",
        ],
        "negative_patterns": [],
        "advice": "AI model inference is slow. Use Celery+Redis or FastAPI BackgroundTasks to offload analysis to workers.",
    },
    "R42": {
        "name": "Feature Flag System",
        "category": "AI/ML Readiness",
        "severity": "medium",
        "score_pts": 4,
        "description": "Feature flags allow gradual AI rollout",
        "positive_patterns": [
            r"feature_flag", r"launchdarkly", r"flagsmith",
            r"unleash", r"feature.*toggle", r"ENABLE_AI",
        ],
        "negative_patterns": [],
        "advice": "Wrap AI features in feature flags: if settings.ENABLE_AI_ANALYSIS: ... Allows gradual rollout and instant kill switch.",
    },
    "R43": {
        "name": "Model Input/Output Logging",
        "category": "AI/ML Readiness",
        "severity": "high",
        "score_pts": 5,
        "description": "AI model inputs, outputs, and latency are logged",
        "positive_patterns": [
            r"model_input", r"model_output", r"inference.*log",
            r"langsmith", r"prompt.*log", r"response.*log",
            r"mlflow",
        ],
        "negative_patterns": [],
        "advice": "Log every AI call: {model, input_hash, output_preview, latency_ms, token_count, cost}. Never log raw PII from inputs.",
    },
    "R44": {
        "name": "Vector Store / Embeddings",
        "category": "AI/ML Readiness",
        "severity": "low",
        "score_pts": 3,
        "description": "Vector database or embedding store is configured",
        "positive_patterns": [
            r"pinecone", r"weaviate", r"chroma", r"qdrant",
            r"pgvector", r"embedding", r"vector_store",
            r"faiss",
        ],
        "negative_patterns": [],
        "advice": "For semantic search or RAG: integrate pgvector (PostgreSQL) or Chroma for local development.",
    },
    "R45": {
        "name": "AI Model Fallback",
        "category": "AI/ML Readiness",
        "severity": "medium",
        "score_pts": 4,
        "description": "Fallback logic when AI model fails or is unavailable",
        "positive_patterns": [
            r"fallback", r"default_response", r"model_fallback",
            r"retry.*model", r"backup.*model",
        ],
        "negative_patterns": [],
        "advice": "If AI call fails: return cached/default response. Never let AI errors break the main user flow.",
    },
    "R46": {
        "name": "Prompt Injection Prevention",
        "category": "AI/ML Readiness",
        "severity": "critical",
        "score_pts": 7,
        "description": "User input is sanitized before being used in AI prompts",
        "positive_patterns": [
            r"sanitize.*prompt", r"prompt.*sanitize",
            r"strip_prompt", r"clean_input",
        ],
        "negative_patterns": [
            r"user_input.*prompt", r"f\".*{.*user", r"f'.*{.*user",
        ],
        "advice": "Never insert raw user input into prompts. Sanitize, truncate, and encode user text before including in prompts.",
    },

    "R47": {
        "name": "Database Index Strategy",
        "category": "Performance",
        "severity": "high",
        "score_pts": 5,
        "description": "Database indexes are defined for query performance",
        "positive_patterns": [
            r"create_index", r"Index\(", r"index=True",
            r"@Index", r"createIndex", r"ensureIndex",
        ],
        "negative_patterns": [],
        "advice": "Add indexes on: user_id, created_at, email (unique). MongoDB: db.collection.createIndex({user_id: 1, created_at: -1})",
    },
    "R48": {
        "name": "Connection Pooling",
        "category": "Performance",
        "severity": "medium",
        "score_pts": 4,
        "description": "Database connections are pooled",
        "positive_patterns": [
            r"pool", r"max_connections", r"minPoolSize",
            r"connection_pool", r"maxPoolSize",
        ],
        "negative_patterns": [],
        "advice": "Configure Motor/MongoClient with maxPoolSize=50. This prevents connection exhaustion under load.",
    },
    "R49": {
        "name": "Gzip / Compression",
        "category": "Performance",
        "severity": "low",
        "score_pts": 2,
        "description": "Response compression (gzip/brotli) is configured",
        "positive_patterns": [
            r"GZipMiddleware", r"gzip", r"brotli", r"compression",
            r"Content-Encoding",
        ],
        "negative_patterns": [],
        "advice": "Add GZipMiddleware to FastAPI. This reduces API response sizes by 60-80% for JSON data.",
    },
    "R50": {
        "name": "Lazy Loading / Code Splitting",
        "category": "Performance",
        "severity": "medium",
        "score_pts": 3,
        "description": "Frontend uses lazy loading / code splitting",
        "positive_patterns": [
            r"React\.lazy", r"lazy\(\(\)", r"import\(", r"Suspense",
            r"dynamic\(", r"next/dynamic",
        ],
        "negative_patterns": [],
        "advice": "Wrap all page components in React.lazy(). Add <Suspense> boundaries. This reduces initial bundle size by 50%+.",
    },
    "R51": {
        "name": "CDN / Static Asset Config",
        "category": "Performance",
        "severity": "low",
        "score_pts": 2,
        "description": "Static assets served via CDN",
        "positive_patterns": [
            r"cdn", r"cloudfront", r"staticfiles",
            r"PUBLIC_URL", r"ASSET_URL", r"S3_BUCKET",
        ],
        "negative_patterns": [],
        "advice": "Serve static assets from CloudFront or similar CDN. Configure cache-control headers for images and JS bundles.",
    },

    "R52": {
        "name": "Structured Logging",
        "category": "Compliance",
        "severity": "high",
        "score_pts": 5,
        "description": "Structured (JSON) logging with levels and correlation IDs",
        "positive_patterns": [
            r"logging\.", r"logger\.", r"loguru", r"structlog",
            r"getLogger", r"LOG_LEVEL", r"log\.info",
            r"log\.error", r"log\.debug",
        ],
        "negative_patterns": [r"print\(", r"console\.log\("],
        "advice": "Replace all print() and console.log() with structured logger calls. Add request_id to every log entry.",
    },
    "R53": {
        "name": "Audit Trail",
        "category": "Compliance",
        "severity": "medium",
        "score_pts": 4,
        "description": "Audit logs track who did what and when",
        "positive_patterns": [
            r"audit", r"audit_log", r"event_log",
            r"activity_log", r"who.*when", r"created_by",
            r"modified_by",
        ],
        "negative_patterns": [],
        "advice": "Log every write operation: {user_id, action, resource, timestamp, ip_address}. Store in a separate audit collection.",
    },
    "R54": {
        "name": "Error Alerting",
        "category": "Compliance",
        "severity": "high",
        "score_pts": 5,
        "description": "Errors are reported to alerting system (Sentry, PagerDuty, etc.)",
        "positive_patterns": [
            r"sentry", r"Sentry", r"pagerduty", r"opsgenie",
            r"datadog", r"rollbar", r"bugsnag",
            r"capture_exception", r"init.*dsn",
        ],
        "negative_patterns": [],
        "advice": "Add Sentry SDK: sentry_sdk.init(dsn=..., traces_sample_rate=0.1). Instantly get stack traces for all exceptions.",
    },
    "R55": {
        "name": "Request ID Tracking",
        "category": "Compliance",
        "severity": "medium",
        "score_pts": 3,
        "description": "Request IDs trace each request through the full stack",
        "positive_patterns": [
            r"request_id", r"X-Request-ID", r"trace_id",
            r"correlation_id", r"uuid.*request",
        ],
        "negative_patterns": [],
        "advice": "Generate UUID request IDs in middleware. Pass through all log messages and downstream HTTP calls via X-Request-ID header.",
    },
    "R56": {
        "name": "Graceful Shutdown",
        "category": "Compliance",
        "severity": "medium",
        "score_pts": 3,
        "description": "Server handles SIGTERM gracefully (drain connections before exit)",
        "positive_patterns": [
            r"on_shutdown", r"@app\.on_event.*shutdown",
            r"SIGTERM", r"graceful", r"lifespan",
        ],
        "negative_patterns": [],
        "advice": "Add FastAPI lifespan handler to close DB connections on shutdown. This prevents data corruption during deploys.",
    },
}

def _filter_files(files: list[dict]) -> list[dict]:
    """Return at most _MAX_FILES source-like files, skipping binaries/assets."""
    src = []
    for f in files:
        path = f.get("path", "")
        ext  = Path(path).suffix.lower()
        if ext in _SRC_EXTS or not ext:
            src.append(f)

    src.sort(key=lambda f: len(f.get("path", "")))
    return src[:_MAX_FILES]

def _search_compiled(line: str, patterns: list[str]) -> bool:
    for p in patterns:
        if _get_re(p).search(line):
            return True
    return False

def _collect_locations(
    files: list[dict[str, Any]],
    neg_patterns: list[str],
    pos_patterns: list[str],
    rule_id: str,
    rule_name: str,
) -> tuple[list[dict], list[dict]]:
    """
    Returns (positive_hits, negative_hits) — performance-capped.
    Each hit: {file, line, snippet, type}
    """
    pos_hits: list[dict] = []
    neg_hits: list[dict] = []

    filtered = _filter_files(files)

    for f in filtered:
        if len(pos_hits) >= _MAX_HITS and len(neg_hits) >= _MAX_HITS:
            break

        path    = f.get("path", "")
        content = f.get("content", "")[:_MAX_CHARS]
        lines   = content.splitlines()

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            if neg_patterns and len(neg_hits) < _MAX_HITS and _search_compiled(line, neg_patterns):
                neg_hits.append({
                    "file": path, "line": idx,
                    "snippet": stripped[:120],
                    "type": "violation",
                    "rule": rule_name,
                })
            if pos_patterns and len(pos_hits) < _MAX_HITS and _search_compiled(line, pos_patterns):
                pos_hits.append({
                    "file": path, "line": idx,
                    "snippet": stripped[:120],
                    "type": "evidence",
                    "rule": rule_name,
                })

    return pos_hits, neg_hits

def _score_rule(rule: dict, pos_hits: list, neg_hits: list) -> tuple[bool, int]:
    """
    Determine if rule is satisfied and how many points it contributes.
    Rules with no positive_patterns are "absence" rules (no-eval, no-secrets).
    """
    has_pos = len(rule.get("positive_patterns", [])) > 0
    has_neg = len(rule.get("negative_patterns", [])) > 0

    if has_pos and has_neg:

        found = len(pos_hits) > 0 and len(neg_hits) == 0
    elif has_pos:
        found = len(pos_hits) > 0
    elif has_neg:

        found = len(neg_hits) == 0
    else:
        found = False

    pts = rule["score_pts"] if found else 0
    return found, pts

def _check_file_specific(files: list[dict]) -> dict:
    """Extra structural checks not covered by line patterns."""
    results = {}

    filenames = [f.get("path","").lower() for f in files]
    results["has_env_example"] = any(".env.example" in p or ".env.sample" in p for p in filenames)
    results["has_dockerfile"]  = any("dockerfile" in p.lower() for p in filenames)
    results["has_cicd"]        = any(
        ".github/workflows" in p or "gitlab-ci" in p or "jenkinsfile" in p.lower()
        for p in filenames
    )
    results["has_eslint"]      = any(".eslintrc" in p or "eslint.config" in p for p in filenames)
    results["has_prettier"]    = any(".prettierrc" in p for p in filenames)
    results["has_pyproject"]   = any("pyproject.toml" in p for p in filenames)
    results["has_precommit"]   = any(".pre-commit" in p for p in filenames)
    results["has_tests"]       = any(
        "test_" in p or "_test." in p or "/tests/" in p or "/test/" in p or "spec." in p
        for p in filenames
    )

    return results

CAT_WEIGHTS = {
    "Security & Auth":   0.28,
    "Data Protection":   0.16,
    "API Quality":       0.14,
    "Infrastructure":    0.14,
    "Code Quality":      0.10,
    "AI/ML Readiness":   0.08,
    "Performance":       0.06,
    "Compliance":        0.04,
}

def _compute_category_scores(rule_results: dict) -> dict:
    """Aggregate per-rule results into category scores."""
    cat_totals:  dict[str, int] = {}
    cat_maxes:   dict[str, int] = {}
    for rule_id, res in rule_results.items():
        cat  = res["category"]
        pts  = res["score_pts"]
        maxp = RULES[rule_id]["score_pts"]
        cat_totals[cat] = cat_totals.get(cat, 0) + pts
        cat_maxes[cat]  = cat_maxes.get(cat, 0) + maxp

    scores = {}
    for cat in cat_totals:
        mx = cat_maxes.get(cat, 1)
        raw = (cat_totals[cat] / mx) * 100 if mx else 0
        scores[cat] = round(min(100, max(0, raw)))
    return scores

HARD_BLOCKERS: list[tuple[str, str]] = [
    ("R11", "🔴 BLOCKER: Hardcoded secrets found — exposing credentials in source code"),
    ("R34", "🔴 BLOCKER: eval()/exec() detected — arbitrary code execution vulnerability"),
    ("R01", "🟠 BLOCKER: No authentication detected — all data is unprotected"),
    ("R46", "🔴 BLOCKER: Raw user input used in AI prompts — prompt injection risk"),
]

def _check_blockers(rule_results: dict) -> list[str]:
    blockers = []
    for rule_id, msg in HARD_BLOCKERS:
        res = rule_results.get(rule_id, {})

        if rule_id in ("R11", "R34", "R46"):
            if not res.get("found", True):
                blockers.append(msg)

        elif rule_id == "R01":
            if not res.get("found", False):
                blockers.append(msg)
    return blockers

def _build_risks(rule_results: dict) -> list[dict]:
    risks = []
    for rule_id, res in rule_results.items():
        rule = RULES[rule_id]
        if res["found"]:
            continue
        severity = rule["severity"]

        if severity not in ("critical", "high", "medium"):
            continue
        risk = {
            "rule_id":   rule_id,
            "name":      rule["name"],
            "category":  rule["category"],
            "severity":  severity,
            "locations": res.get("negative_locations", [])[:5],
            "description": rule["description"],
            "advice":    rule["advice"],
        }
        risks.append(risk)

    sev_order = {"critical": 0, "high": 1, "medium": 2}
    risks.sort(key=lambda r: sev_order.get(r["severity"], 3))
    return risks[:20]

def _build_evidence_map(rule_results: dict) -> dict:
    """Return: {rule_id: {locations: [...], count: int}}"""
    ev = {}
    for rule_id, res in rule_results.items():
        locs = res.get("positive_locations", [])[:3]
        neg  = res.get("negative_locations", [])[:3]
        ev[rule_id] = {
            "evidence_locations": locs,
            "violation_locations": neg,
            "evidence_count": len(res.get("positive_locations", [])),
            "violation_count": len(res.get("negative_locations", [])),
        }
    return ev

import time as _time

_RULE_BANK: dict[str, dict] = {}

def _build_rule_bank():
    for rule_id, rule in RULES.items():
        pos_compiled = []
        for p in rule.get("positive_patterns", []):
            try:
                pos_compiled.append(re.compile(p, re.IGNORECASE))
            except re.error:
                pass
        neg_compiled = []
        for p in rule.get("negative_patterns", []):
            try:
                neg_compiled.append(re.compile(p, re.IGNORECASE))
            except re.error:
                pass
        _RULE_BANK[rule_id] = {
            "pos": pos_compiled,
            "neg": neg_compiled,
            "name": rule["name"],
        }

_build_rule_bank()

_MAX_HITS_PER_RULE = 20
_EMIT_EVERY        = 10

def _fmt_eta(secs: float) -> str:
    if secs < 2:   return "< 1s"
    if secs < 60:  return f"{int(secs)}s"
    return f"{int(secs // 60)}m {int(secs % 60)}s"

def run_static_analysis(
    files: list[dict[str, Any]],
    progress_cb=None,
    base_pct: int = 22,
    end_pct: int  = 42,
) -> dict[str, Any]:
    """
    Single-pass static analysis: reads each file ONCE and checks all 56 rules
    simultaneously — O(N_files × N_lines × 56) instead of O(56 × N_files × N_lines).

    With per-file progress events and dynamic ETA sent to progress_cb.
    """
    total_files = len(files)

    pos_hits: dict[str, list] = {rid: [] for rid in RULES}
    neg_hits: dict[str, list] = {rid: [] for rid in RULES}

    start_time = _time.monotonic()
    times: list[float] = []

    for file_idx, f in enumerate(files):
        t0 = _time.monotonic()
        path    = f.get("path", "?")
        content = f.get("content", "")

        for line in content.splitlines():
            stripped = line.strip()
            if not stripped:
                continue

            for rule_id, compiled in _RULE_BANK.items():

                if compiled["pos"] and len(pos_hits[rule_id]) < _MAX_HITS_PER_RULE:
                    for rx in compiled["pos"]:
                        if rx.search(line):
                            pos_hits[rule_id].append({
                                "file": path, "snippet": stripped[:120], "type": "evidence",
                            })
                            break

                if compiled["neg"] and len(neg_hits[rule_id]) < _MAX_HITS_PER_RULE:
                    for rx in compiled["neg"]:
                        if rx.search(line):
                            neg_hits[rule_id].append({
                                "file": path, "snippet": stripped[:120], "type": "violation",
                            })
                            break

        elapsed_file = _time.monotonic() - t0
        times.append(elapsed_file)
        if len(times) > 20:
            times.pop(0)

        if progress_cb and (file_idx % _EMIT_EVERY == 0 or file_idx == total_files - 1):
            done_frac    = (file_idx + 1) / max(total_files, 1)
            pct          = base_pct + int(done_frac * (end_pct - base_pct))
            avg_per_file = sum(times) / len(times)
            remaining    = (total_files - file_idx - 1) * avg_per_file
            msg = (
                f"Scanned {file_idx + 1}/{total_files} files"
                + (f" — ETA {_fmt_eta(remaining)}" if remaining > 0 else " — finalising …")
            )
            try:
                progress_cb("rules", pct, msg)
            except Exception:
                pass

    rule_results: dict[str, Any] = {}
    for rule_id, rule in RULES.items():
        ph = pos_hits[rule_id]
        nh = neg_hits[rule_id]
        found, pts = _score_rule(rule, ph, nh)
        rule_results[rule_id] = {
            "name":               rule["name"],
            "category":           rule["category"],
            "severity":           rule["severity"],
            "found":              found,
            "score_pts":          pts,
            "max_pts":            rule["score_pts"],
            "positive_locations": ph[:8],
            "negative_locations": nh[:8],
            "advice":             rule["advice"],
            "description":        rule["description"],
        }

    file_checks = _check_file_specific(files)

    _apply_file_checks(rule_results, file_checks)

    total_pts = sum(r["score_pts"] for r in rule_results.values())
    max_pts   = sum(r["max_pts"]   for r in rule_results.values())
    raw_score = (total_pts / max_pts * 100) if max_pts else 0
    static_score = round(min(100, max(0, raw_score)))

    category_scores = _compute_category_scores(rule_results)

    blockers  = _check_blockers(rule_results)
    risks     = _build_risks(rule_results)
    evidence  = _build_evidence_map(rule_results)

    passed  = sum(1 for r in rule_results.values() if r["found"])
    failed  = len(rule_results) - passed
    crits   = sum(1 for r in rule_results.values() if r["severity"]=="critical" and not r["found"])

    return {
        "static_score":       static_score,
        "rules_passed":       passed,
        "rules_failed":       failed,
        "critical_failures":  crits,
        "total_rules":        len(rule_results),
        "rule_results":       rule_results,
        "category_scores":    category_scores,
        "blockers":           blockers,
        "risks":              risks,
        "evidence_map":       evidence,
        "file_checks":        file_checks,
        "score_breakdown": {
            "total_pts": total_pts,
            "max_pts":   max_pts,
            "pct":       round(raw_score, 2),
        },
    }

def _apply_file_checks(rule_results: dict, file_checks: dict) -> None:
    """Override/supplement certain rule results with structural file-based findings."""

    if file_checks.get("has_dockerfile") and "R27" in rule_results:
        r = rule_results["R27"]
        if not r["found"]:
            r["found"] = True
            r["score_pts"] = r["max_pts"]

    if file_checks.get("has_cicd") and "R28" in rule_results:
        r = rule_results["R28"]
        if not r["found"]:
            r["found"] = True
            r["score_pts"] = r["max_pts"]

    if file_checks.get("has_env_example") and "R30" in rule_results:
        r = rule_results["R30"]
        r["found"] = True
        r["score_pts"] = r["max_pts"]

    if (file_checks.get("has_eslint") or file_checks.get("has_pyproject")) and "R39" in rule_results:
        r = rule_results["R39"]
        if not r["found"]:
            r["found"] = True
            r["score_pts"] = r["max_pts"]

    if file_checks.get("has_precommit") and "R40" in rule_results:
        r = rule_results["R40"]
        r["found"] = True
        r["score_pts"] = r["max_pts"]
