# Useful Notes

Quick reference notes to keep day-to-day work smooth while using Graphboarder.

## Favorites Organization

- Use folders to group favorites by workflow (e.g., "Auth", "Pagination", "Reporting").
- Keep names short and specific so they surface quickly in search or scroll lists.
- Rename and move favorites when APIs change to avoid stale or confusing entries.
- Use folder renames to keep your taxonomy clean when teams standardize naming.
- When editing favorites UI logic, prefer Svelte 5 runes (`$state`, `$derived`) for local state and derived values.

## Local Storage Hygiene

- Export favorites and endpoints before clearing local storage to avoid losing curated configurations.
- If history grows large, export a backup before using the "Clear All" action.
- Use the Storage Manager when debugging to inspect raw JSON quickly.

## Test Data Management

- When writing or updating tests, pin timestamps with `Date.now()` mocks so snapshot-style checks stay stable.
- Add validation cases for empty names, empty queries, or missing endpoint IDs to catch regressions early.
- Prefer realistic example queries so that update flows match actual UI usage.
- Use the mock GraphQL server for repeatable schema tests when network access is unreliable.
- The Playwright mock-graphql test pairs with the mock server to validate end-to-end Explorer behavior.
- The mock-graphql-features test extends coverage to query, mutation, and filtering flows.
- The history-filtering E2E test validates per-item deletion and filtering combinations.
