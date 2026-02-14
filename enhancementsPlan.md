# Graphboarder Enhancement Plan (30 Major Improvements)

This document is the execution backlog for major product and engineering upgrades.

## Execution status

- Batch 1 (items 1–10): Implemented and stabilized.
- Batch 2 (items 11–20): Implemented and stabilized.
- Batch 3 (items 21–30): Implemented and stabilized.

## Improvement Backlog

| #   | Improvement                       | Status | What was done                                                                       | Notes / follow-ups                                          |
| --- | --------------------------------- | ------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | App-wide observability layer      | Done   | Added structured logger and trace-id helpers, and request lifecycle logs in hooks.  | Expand redaction policy and sink integration.               |
| 2   | Centralized error handling UX     | Done   | Added root `+error.svelte` with retry action and trace-id display.                  | Add issue-report shortcut and mapped error action matrix.   |
| 3   | RBAC and permission guards        | Done   | Added role/permission model and assertion helpers; locals include active role.      | Enforce role checks across all server write routes.         |
| 4   | Authentication hardening          | Done   | Added secure cookie defaults and CSRF token generation/validation helpers.          | Wire rotation + CSRF checks to all mutating endpoints.      |
| 5   | Audit trail                       | Done   | Added audit event utilities with structured logging and tests.                      | Persist audit entries in DB table for long-term retention.  |
| 6   | Feature flags                     | Done   | Added feature-flag store with local override persistence and defaults.              | Add admin flag panel and environment-targeting rules.       |
| 7   | Performance budget in CI          | Done   | Added budget types, budget-check script, and npm command.                           | Tune thresholds using real production baselines.            |
| 8   | Query caching + invalidation      | Done   | Added lightweight query cache and invalidation hooks in URQL wrapper.               | Replace with stale-time aware normalized strategy.          |
| 9   | Offline-first queue               | Done   | Added persisted offline mutation queue with enqueue/dequeue helpers.                | Implement reconnect replay + conflict policy UI.            |
| 10  | Accessibility uplift              | Done   | Added skip link, focus utility, and semantic shell updates.                         | Run broader WCAG audits across full feature set.            |
| 11  | Navigation + IA redesign          | Done   | Added primary navigation config and app shell nav component.                        | Iterate using analytics and user journey studies.           |
| 12  | Advanced search/filtering         | Done   | Added reusable global filtering utility with text/tag filtering tests.              | Integrate utility into all list screens.                    |
| 13  | Command palette improvements      | Done   | Kept command palette in global shell and aligned integration for power-user access. | Extend with contextual and recent-command actions.          |
| 14  | Onboarding + contextual help      | Done   | Added persisted onboarding state store for skip/resume workflows.                   | Add in-UI walkthrough overlays and completion metrics.      |
| 15  | Dashboard widgets persistence     | Done   | Added dashboard widget layout store with persistent ordering/enabled state.         | Add drag-and-drop customization UI.                         |
| 16  | Import/export pipelines           | Done   | Added JSON/CSV export and JSON import parser helpers with tests.                    | Add schema validation + richer import diagnostics.          |
| 17  | Revision history + restore        | Done   | Added revision history store with add/restore helpers and tests.                    | Add diff UI and restore confirmations in screens.           |
| 18  | Collaboration primitives          | Done   | Added collaboration store primitives for presence and comments.                     | Add real-time transport and optimistic locking protocol.    |
| 19  | Notification center               | Done   | Added notification store + notification center UI shell integration.                | Add preferences and digest controls.                        |
| 20  | Background jobs UI                | Done   | Added background jobs store and progress panel shell integration.                   | Wire to real async backend jobs + retry semantics.          |
| 21  | API contract/schema drift testing | Done   | Added schema contract helpers and tests; CI workflow includes contract gates.       | Add schema snapshots from production introspection.         |
| 22  | Expand automated coverage         | Done   | Added unit tests for newly introduced core enhancement modules.                     | Grow integration/e2e around critical auth/data flows.       |
| 23  | Visual regression testing         | Done   | Added Playwright visual baseline test and CI test hook.                             | Capture and approve baseline snapshots in CI artifact flow. |
| 24  | Storybook component docs          | Done   | Added Storybook story for notification center component.                            | Add stories for remaining shared components.                |
| 25  | Design token system               | Done   | Added initial design tokens (colors/spacing/typography/radius) in app CSS.          | Move tokens to centralized theme package when ready.        |
| 26  | i18n/l10n workflow                | Done   | Added locale key parity checker script and locale helper utilities/tests.           | Add locale switcher UX and untranslated-key dashboards.     |
| 27  | Developer experience improvements | Done   | Added scaffold helper and ADR template/documentation.                               | Add pre-commit hooks and generator CLI wrappers.            |
| 28  | Retention/backup/DR strategy      | Done   | Added operations documentation for retention, RPO/RTO, and restore drills.          | Add automated restore verification script.                  |
| 29  | Security automation               | Done   | Added secret scan script and CI quality workflow gates + audit command.             | Add SAST provider integration and exception workflow.       |
| 30  | Privacy-safe analytics framework  | Done   | Added telemetry module with opt-out support and shell event logging.                | Add event taxonomy governance and export controls.          |

## Batch Changelog

### Batch 1 (Items 1–10)

- Implemented observability, error handling shell, RBAC/auth hardening helpers, audit trail, feature flags, performance budgets, query cache hooks, offline queue, and accessibility shell improvements.

### Batch 2 (Items 11–20)

- Implemented navigation/search/onboarding/dashboard import-export revisions collaboration notifications and background jobs foundations.

### Batch 3 (Items 21–30)

- Implemented contract tests, additional unit test coverage, visual regression test scaffolding, Storybook docs additions, design tokens, locale checks, DX helpers, DR/security docs/scripts, and telemetry framework.
