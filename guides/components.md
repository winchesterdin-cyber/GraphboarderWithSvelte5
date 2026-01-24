# Components Guide

This guide describes the key components in the library and how to use them.

## General Guidelines

- **Svelte 5 Runes**: We use `$state`, `$props`, `$derived`, and `$effect` for reactivity.
- **Events**: Prefer passing callback props (e.g., `onclick: () => void`) over dispatching custom events (`dispatch('click')`).
- **Styling**: We use **DaisyUI** class names (e.g., `btn`, `card`, `modal`).

## Key Components

### EndpointPicker (`src/lib/components/EndpointPicker.svelte`)

- **Purpose**: Renders a grid of available GraphQL endpoints.
- **Usage**: Displays endpoints from the store and allows selection.

### CodeEditor (`src/lib/components/fields/CodeEditor.svelte`)

- **Purpose**: Provides a code editing interface (likely using CodeMirror).
- **Props**:
  - `rawValue` (string): The initial code.
  - `language` (string): 'graphql' or 'json'.
  - `onChanged` (function): Callback when code changes.

### Modal (`src/lib/components/Modal.svelte`)

- **Purpose**: A generic modal component using the native `<dialog>` element.
- **Usage**: Used for confirmations, forms, and other overlays.

### GraphqlCodeDisplay (`src/lib/components/GraphqlCodeDisplay.svelte`)

- **Purpose**: Displays generated GraphQL code and allows syncing with the visual builder.

### TypeInfoDisplay (`src/lib/components/TypeInfoDisplay.svelte`)

- **Purpose**: Displays information about GraphQL types, allowing expansion and interaction.

### ActiveArgument (`src/lib/components/ActiveArgument.svelte`)

- **Purpose**: Represents an active argument in the query builder, allowing modification of its value and state.

### ComponentForLayout (`src/routes/endpoints/[endpointid]/queries/[queryName]/ComponentForLayout.svelte`)

- **Purpose**: The main layout component for displaying and interacting with a specific query/mutation.
- **Usage**: Handles data fetching, pagination, and rendering the results table. It orchestrates the interaction between the query builder and the results display.

## Creating New Components

1.  **Reuse**: Check `src/lib/components` for existing primitives.
2.  **Accessibility**: Ensure semantic HTML and keyboard navigation.
3.  **Props**: Define props using `$props()`.
4.  **Events**: Use callback props for parent-child communication.
