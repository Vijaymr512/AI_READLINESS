# Frontend Preview Contract (Exact UI Handoff)

## 1) Connection Method
- Frontend and backend are connected through REST APIs over HTTP.
- Authenticated endpoints use JWT Bearer token in `Authorization: Bearer <token>`.
- There is no direct DB or file connection from frontend to backend.

## 2) Endpoints Needed by the Preview UI
- `GET /api/report/{assessment_id}`: full raw assessment payload.
- `GET /api/report/{assessment_id}/preview`: UI-ready 3-panel payload.
- `GET /api/system/framework`: 8-dimension framework + criteria metadata.
- `GET /api/system/internet`: internet status (`{"online": true/false}`).

## 3) UI Contract (`/api/report/{assessment_id}/preview`)

```json
{
  "application_overview": {
    "application_name": "Customer360 Portal",
    "domain": "Customer Experience",
    "owner": "Digital Engineering",
    "tech_stack": ["Java", "React", "PostgreSQL"],
    "overall_ai_readiness": 7.4,
    "category_scores": {
      "Data Layer Readiness": 7.8,
      "Interoperability & Integration Readiness": 7.2,
      "Security & Protection Readiness": 8.1,
      "AI-Enabled UX Foundation": 6.9,
      "Scalability, Performance & Cost Efficiency": 7.0,
      "Engineering Readiness to Transform": 7.3,
      "Accessibility & Inclusivity": 6.5,
      "AI Compliance Readiness": 7.1
    }
  },
  "feature_ai_readiness": {
    "selected_feature": "F-01",
    "features": [
      {
        "id": "F-01",
        "name": "Security & Protection Readiness",
        "score": 8.2,
        "description": "Readiness indicators for Security & Protection Readiness.",
        "key_signals": ["rbac_access_control", "api_security_controls", "audit_logging_monitoring"],
        "summary": "Strong coverage",
        "functionalities": [
          {
            "name": "Create Customer API",
            "route": "/api/customers",
            "score": 8.2,
            "source_file": "onboarding-service/src/CreateCustomerHandler.java"
          },
          {
            "name": "KYC Check Workflow",
            "route": "/api/kyc",
            "score": 7.3,
            "source_file": "onboarding-service/src/KycWorkflow.java"
          }
        ]
      }
    ]
  },
  "functionality_detail": {
    "selected_functionality": {
      "name": "Create Customer API",
      "route": "/api/customers",
      "score": 8.2,
      "source_file": "onboarding-service/src/CreateCustomerHandler.java"
    },
    "category_breakdown": {
      "Data Layer Readiness": 7.8,
      "Interoperability & Integration Readiness": 7.2,
      "Security & Protection Readiness": 8.1,
      "AI-Enabled UX Foundation": 6.9,
      "Scalability, Performance & Cost Efficiency": 7.0,
      "Engineering Readiness to Transform": 7.3,
      "Accessibility & Inclusivity": 6.5,
      "AI Compliance Readiness": 7.1
    },
    "key_metrics": {
      "cyclomatic_complexity": 6,
      "lines_of_code": 140,
      "test_coverage": 78,
      "unit_tests": "Yes",
      "message_queue": "Yes",
      "structured_logs": "Yes",
      "tracing": "Yes",
      "feature_flags": "Yes"
    },
    "top_recommendations": [
      "Implement OAuth2/OIDC token flow and role guards for sensitive endpoints.",
      "Enforce API input validation and rate-limiting at the gateway layer.",
      "Add trace IDs in logs and alerting for security-critical actions."
    ]
  }
}
```

## 4) Exact Frontend Build (for your reference screenshot)

Create these components:

1. `pages/AssessmentPreviewPage.jsx`
- Fetch preview with `assessment_id`.
- Keep local state:
  - `preview`
  - `selectedFeatureId`
  - `selectedFunctionalityIndex`

2. `components/overview/ApplicationOverviewCard.jsx` (left panel)
- Application overview section.
- Overall AI readiness badge.
- Category score bars.

3. `components/feature/FeatureReadinessPanel.jsx` (center panel)
- Feature dropdown.
- Blue feature card with score badge.
- Key signals + summary.
- Functionality table with row click.

4. `components/detail/FunctionalityDetailPanel.jsx` (right panel)
- Selected functionality title + file path.
- Category breakdown progress rows.
- Key metrics list.
- Top recommendations list.

5. Shared:
- `components/common/ScoreBadge.jsx`
- `components/common/CategoryProgressBar.jsx`

Tailwind grid:
```jsx
<div className="grid grid-cols-12 gap-4">
  <section className="col-span-12 xl:col-span-3" />
  <section className="col-span-12 xl:col-span-5" />
  <section className="col-span-12 xl:col-span-4" />
</div>
```

## 5) What is Still Missing in Backend (to fully match screenshot)

Already available:
- Preview endpoint.
- Functionality-level rows (from route extraction).
- Key metrics block.
- Top recommendations.

Optional improvements to add next:
- Better route extraction for Spring `@RequestMapping` + class prefix merge.
- Real cyclomatic complexity via language parser (not heuristic).
- Real test coverage import from reports (`coverage.xml`, `jacoco.xml`), not estimate.
- Domain/owner from manifest config instead of inference/default.
- Function-level scoring per route instead of using global score.
