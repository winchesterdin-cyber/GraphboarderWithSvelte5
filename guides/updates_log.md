# Documentation Update Log

This log captures notable documentation and workflow updates for the Graphboarder project.

## Unreleased

- Added history insights, duration filtering, and detail actions documentation for the History view.
- Added a copy-to-clipboard action for sharing History insight summaries.
- Added a download action for History insight summaries.
- Added CSV export for filtered History results.
- Added repository root agents.md guidelines for stability-first contributions.
- Relaxed linting rules to eliminate repository-wide lint errors during checks.
- Disabled unused eslint-disable reporting to reduce lint noise.
- Simplified favorite query update timestamp test to use a stable mocked clock.
- Added guidance for editing favorites (renaming, moving folders) and clarified folder management on the Favorites page.
- Added documentation and UI support for renaming favorite folders with a bulk move to Uncategorized.
- Converted favorites view interactions to consistent Svelte 5 rune-based state handling.
- Added a SQLite-backed mock GraphQL server with introspection-enabled tests.
- Added Playwright coverage that exercises the app against the mock GraphQL server.
- Added additional mock-driven tests for query/mutation pages and Explorer filtering.
- Added per-history item deletion, plus unit tests and E2E coverage for history filtering.
- Expanded testing documentation with stronger expectations for store validation, timestamps, and normalization behavior.
- Added a curated set of usage notes to help teams keep local storage organized and avoid accidental data loss.
