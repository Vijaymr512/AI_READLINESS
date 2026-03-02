# ST1 UI Roadmap (Saved Ideas)

## Selected by You

### 2) Cinematic Onboarding
- First-login guided flow with 3 to 5 steps.
- Animated checklist and quick setup CTA.
- Personalized welcome using user profile.

### 3) Live Assessment Timeline
- Real-time phase tracker: ingest -> scan -> rules -> score -> store.
- Animated progress rail and status badges.
- Retry or troubleshoot controls on failure.

### 4) 3D Readiness Globe
- Interactive 3D visualization of category readiness.
- Hover to reveal score, risks, and evidence density.
- Drilldown from globe node to category details.

### 5) Report Story Mode
- Slide-like guided walkthrough of one report.
- Narrative sequence: overview -> risks -> evidence -> actions.
- Keyboard navigation + presenter mode.

### 8) Evidence Drilldown Drawer
- Click risk/signal to open side drawer.
- Show matched files, snippets, rule IDs, recommendation.
- Quick action: create remediation task.

### 9) Personalization Themes
- Theme presets: iOS Glass, Executive, Cyber Ops, Minimal.
- Persist per user profile.
- Theme transitions with reduced-motion support.

### 10) Motion Quality Pass
- Unified easing/spring tokens across app.
- Layered depth and hover hierarchy.
- Reduced-motion accessibility mode.

## Additional Ideas (Still More)

### 11) Command Palette (Ctrl+K)
- Global actions + navigation + report search.
- Fast keyboard-first workflow.

### 12) AI Q&A Console
- Ask: "highest risk?", "why this score?", "top actions".
- Context-aware answers from report JSON.

### 13) Side-by-Side Compare Reports
- Compare two assessments with delta highlights.
- Score, risk, and category trend differences.

### 14) Team Activity Feed
- Recent uploads, report generations, deletions.
- Filter by user/date/action type.

### 15) Executive Snapshot Export
- One-click export: PDF summary with key charts.
- Compact mode for non-technical stakeholders.

### 16) Smart Notifications Center
- Completion alerts, risk threshold alerts, stale report alerts.
- In-app panel + optional email hooks later.

### 17) UI Performance Mode
- Turn off heavy effects for low-end devices.
- Static fallback for charts/animations.

### 18) Accessibility+ Readability Pack
- Contrast presets, font scaling, dyslexia-friendly mode.
- Keyboard focus maps and ARIA audit.

## Suggested Build Order
1. Live Assessment Timeline
2. Evidence Drilldown Drawer
3. Report Story Mode
4. Motion Quality Pass
5. Theme Presets
6. Command Palette
7. Cinematic Onboarding
8. 3D Readiness Globe

## Notes
- Items 3 and 4 can be prototyped now with current backend.
- Full real-time timeline is best with async job/status API.
- 3D globe should be optional with fallback for mobile.

}