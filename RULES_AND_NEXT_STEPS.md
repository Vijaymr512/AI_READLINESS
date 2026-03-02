# ST1 Rules Upgrade and Next Steps

## Standards Checked
- OWASP API Security Top 10 (2023): https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP Top 10 (2025): https://owasp.org/Top10/2025/
- OWASP ASVS 4.0.3 taxonomy: https://cornucopia.owasp.org/taxonomy/asvs-4.0.3
- NIST AI RMF Core: https://airc.nist.gov/airmf-resources/airmf/5-sec-core/
- OpenSSF Scorecard: https://securityscorecards.dev/
- SLSA Build Levels: https://slsa.dev/spec/v1.1/levels
- OpenTelemetry Semantic Conventions: https://opentelemetry.io/docs/concepts/semantic-conventions/

## Rule Set Status
- Active rules in engine now: 106
- Current domains covered: 8
- Domain counts:
  - data_layer_readiness: 13
  - interoperability_integration_readiness: 13
  - security_protection_readiness: 16
  - ai_enabled_ux_foundation: 13
  - scalability_performance_cost_efficiency: 13
  - engineering_readiness_to_transform: 13
  - accessibility_inclusivity: 12
  - ai_compliance_readiness: 13
- Full target catalog remains: 120 rules (`RULESET_120_CATALOG.md`)

## Scoring Model v2 (Implemented)
- Base: weighted category coverage by domain
- Capability bonus: up to +10
- Risk penalty:
  - critical: -12
  - high: -6
  - medium: -3
  - low: -1
- Mandatory gate (12 mandatory controls):
  - if pass rate < 0.85, additional penalty applies
- Critical override:
  - cap score at 59 when foundational critical risk override is true
- 80+ gate target tracked in `score_details`:
  - score >= 80
  - mandatory pass rate >= 0.85
  - critical risks = 0
  - high risks <= 2

## Mandatory Controls (Current)
1. api_standards_design
2. oauth_oidc_support
3. rbac_access_control
4. api_security_controls
5. audit_logging_monitoring
6. sensitive_data_protection
7. pii_masking_tokenization
8. data_quality_monitoring
9. performance_sla_tracking
10. cicd_maturity
11. infra_automation_scalability
12. explainability_traceability_support

## What To Do Next (Order)
1. Add the remaining 14 rules from catalog to reach full 120 active.
2. Add rule-level metadata fields: `severity`, `weight`, `standard_refs` in YAML.
3. Add false-positive control: require 2-signal confirmation for sensitive critical rules.
4. Add per-rule test fixtures for regex/ast/config/doc executors.
5. Add calibration set:
   - one strong repo expected 80+
   - one moderate repo expected 50-74
   - one weak repo expected <50
6. Tune penalties only after calibration, not before.
7. Add report section: "Why Not 80+" using `score_details.gate_result`.
8. Add standard mapping table in report export (rule -> standard reference).

## UI Things To Do (Priority)
1. Add "Readiness Gate" panel in Report (score gate checkboxes).
2. Add "Critical Missing Controls" card on dashboard top.
3. Add trend chart for mandatory pass-rate across last 5 reports.
4. Add interactive filter chips by domain/severity/standard.
5. Add evidence viewer with file path + snippet + rule reference.
6. Add "What to fix first" ranked remediation list.
7. Add report compare mode (latest vs previous).
8. Add one-click export (PDF/PPT summary page).
