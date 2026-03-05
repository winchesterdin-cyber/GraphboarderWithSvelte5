# Comprehensive Feature Enhancement Plan (Search & Discovery Reliability Program)

## Objective

Deliver a fully implemented, thoroughly tested expansion of the existing search/discovery feature set with stronger filtering, predictable sorting/pagination, richer diagnostics, and compatibility-preserving APIs.

## Scope

- `src/lib/search/globalSearch.ts`
- `src/lib/search/globalSearch.test.ts`
- `guides/updates_log.md`

## Major Improvements (22)

1. Introduce a new advanced `searchEntities` API that returns both results and metadata.
2. Preserve the legacy `filterEntities` API as a compatibility wrapper.
3. Add support for exclusion tags (`excludeTags`).
4. Add configurable text matching modes (`contains`, `exact`, `prefix`, `token-all`).
5. Add case-sensitivity controls.
6. Add diacritic normalization controls (e.g., Málaga ⇔ malaga).
7. Add tokenized query processing.
8. Add `requireAllTokens` behavior for strict matching.
9. Add configurable searchable fields (`name`, `description`, `tags`).
10. Add archived-entity inclusion/exclusion controls.
11. Add status-based filtering support.
12. Add include-ID allowlist filtering.
13. Add exclude-ID blocklist filtering.
14. Add synonyms expansion for query terms.
15. Add minimum query length controls to prevent noisy short-query matching.
16. Add deterministic deduplication by entity ID.
17. Add custom filter callback support for domain-specific predicates.
18. Add scoring for relevance-based ranking.
19. Add configurable sorting (`score`, `name`, `id`) with direction controls.
20. Add pagination (`offset`, `limit`) at the search layer.
21. Add rich diagnostics payload with dropped-reason counters.
22. Add diagnostics callback hook (`onDiagnostics`) for observability workflows.

## Implementation Notes

- Added comments around key utility functions and branch behavior requiring context.
- Added diagnostics counters for every filtering stage so behavior can be audited deterministically.
- Maintained existing behavior for old call sites by returning only entities from `filterEntities`.

## Verification Checklist

- [x] Linting executed and passing.
- [x] Unit tests for search behavior executed and passing.
- [x] New behaviors validated with direct assertions.
- [x] Update log documentation amended to record this enhancement set.

## Completion Status

All 22 planned improvements above are implemented and verified with automated unit tests.
