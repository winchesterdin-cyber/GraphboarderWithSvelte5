# Components Guide

This guide describes the key components in the library and how to use them.

## General Guidelines

*   **Svelte 5 Runes**: We use `$state`, `$props`, `$derived`, and `$effect` for reactivity.
*   **Events**: Prefer passing callback props (e.g., `onclick: () => void`) over dispatching custom events (`dispatch('click')`).
*   **Styling**: We use **DaisyUI** class names (e.g., `btn`, `card`, `modal`).

## Key Components

### `EndpointPicker`

*   **Location**: `src/lib/components/EndpointPicker.svelte` (Hypothetical path based on description)
*   **Purpose**: Renders a grid of available GraphQL endpoints.
*   **Usage**: Used on the landing page to select an endpoint.

### `CodeEditor`

*   **Location**: `src/lib/components/fields/CodeEditor.svelte`
*   **Purpose**: A wrapper around CodeMirror for editing GraphQL queries or JSON.
*   **Props**:
    *   `rawValue` (string): The initial code.
    *   `language` (string): 'graphql' or 'json'.
    *   `onChanged` (function): Callback when code changes.

### `Modal`

*   **Location**: `src/lib/components/ui/Modal.svelte`
*   **Purpose**: Accessible modal dialog using the HTML `<dialog>` element.
*   **Usage**: Use for confirmations (e.g., deleting an endpoint) or forms.

### `GraphqlCodeDisplay`

*   **Location**: `src/lib/components/GraphqlCodeDisplay.svelte`
*   **Purpose**: Displays generated GraphQL code and allows syncing with the visual builder.

## Creating New Components

1.  **Reuse**: Check `src/lib/components/ui` for existing primitives.
2.  **Accessibility**: Ensure semantic HTML and keyboard navigation.
3.  **Props**: Define props using `$props()`.
4.  **Events**: Use callback props for parent-child communication.
