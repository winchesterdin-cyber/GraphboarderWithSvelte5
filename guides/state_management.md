# State Management Guide

This project leverages Svelte 5's reactivity system and `svelte-persisted-store` for state management.

## Svelte 5 Runes

We are migrating to and using Svelte 5 runes:

- **`$state`**: For mutable state.
- **`$derived`**: For values that depend on other state.
- **`$effect`**: For side effects (e.g., logging, syncing).
- **`$props`**: For component props.

## Stores Directory (`src/lib/stores/`)

Global or shared state is managed in the `stores` directory.

### `endpointsStore.ts`

- **Purpose**: Manages the list of GraphQL endpoints.
- **Persistence**: Uses `svelte-persisted-store` to save user-defined endpoints to `localStorage`.
- **Logic**:
  - Merges hardcoded `localEndpoints` (from test data) with user endpoints.
  - Handles migration of legacy endpoint formats (`migrateLegacyEndpoints`).
  - Provides `endpoints` derived store for UI consumption.

### `endpointHandling/`

Contains stores specific to the currently selected endpoint, such as schema data (`schemaData.ts`) and general info (`endpointInfo.ts`).

### `QMSHandling/`

Manages the state of the "Query Management System" (the visual query builder). This includes:

- Active arguments (`activeArgumentsDataGrouped_Store.ts`)
- Field selection.

## Best Practices

1.  **Local vs. Global**: Use component-local `$state` for UI state (e.g., is a dropdown open?). Use stores for data that needs to persist or be shared across pages.
2.  **Immutability**: While Svelte 5 handles mutation well, try to keep data flow predictable.
3.  **Testing**: Write unit tests for complex store logic, mocking persistence where necessary.
