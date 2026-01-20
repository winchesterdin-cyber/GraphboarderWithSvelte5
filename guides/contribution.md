# Contribution Guide

## Coding Standards

*   **Naming Convention**: Use `camelCase` for variables and functions.
*   **Semicolons**: Use explicit semicolons to prevent ASI errors.
*   **Logging**:
    *   **Do not** commit `console.log` statements.
    *   Use `console.warn` or `console.error` for necessary warnings/errors.
    *   Prefer UI feedback over console logs.
*   **Components**:
    *   Keep components small and focused.
    *   Pass callbacks as props (e.g., `onRowClicked`) instead of dispatching custom events.
    *   Use `onclick` (Svelte 5) instead of `on:click` (Svelte 4).
*   **State**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`) instead of legacy `svelte/legacy` imports like `run`.

## Refactoring

*   **Dry Code**: Extract reusable logic into `src/lib/utils`.
*   **Type Safety**: Avoid `any` types. Define interfaces in `src/lib/types`.
*   **Testing**: Ensure new logic is covered by tests.

## Workflow

1.  Create a branch for your changes.
2.  Make your changes, adhering to the coding standards.
3.  Run tests (`npm test`) to ensure no regressions.
4.  Submit a pull request.
