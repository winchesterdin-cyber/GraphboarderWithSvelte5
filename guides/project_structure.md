# Project Structure Guide

This guide provides an overview of the file and directory structure of the **GraphboarderWithSvelte5** project.

## Directory Layout

### Root Directory

- `src/`: Contains the source code for the application and library.
- `static/`: Static assets served directly (e.g., images, robots.txt).
- `e2e/`: End-to-end tests using Playwright.
- `messages/` & `project.inlang/`: Internationalization (i18n) configuration.
- `stories/`: Storybook stories (if applicable).
- `CONTRIBUTING.md`: Guidelines for contributors.
- `README.md`: Project overview and setup instructions.
- `package.json`: Dependencies and scripts.
- `svelte.config.js`: SvelteKit configuration.
- `vite.config.js`: Vite configuration.
- `playwright.config.ts`: Playwright configuration.

### `src/` Directory

The `src` folder is divided into two main parts:

1.  `src/lib/`: The core library code. This contains reusable components, stores, utilities, and features.
2.  `src/routes/`: The SvelteKit application routes (Showcase/Preview app).

#### `src/lib/` (Library)

- **`actions/`**: Svelte actions (e.g., for handling DOM events or integrations).
- **`components/`**: Reusable UI components.
  - `fields/`: Input fields and editors (e.g., `CodeEditor`).
  - `ui/`: Generic UI elements.
- **`features/`**: Feature-specific modules (e.g., filtering, query building).
- **`header/`**: Header components.
- **`models/`**: Data models and type definitions.
- **`server/`**: Server-side logic (if any).
- **`stores/`**: State management using Svelte stores and runes.
  - `endpointHandling/`: Logic for managing GraphQL endpoints.
  - `QMSHandling/`: Query Management System logic.
- **`test/`**: Test utilities or shared test data.
- **`types/`**: TypeScript type definitions.
- **`utils/`**: Utility functions (string manipulation, object handling, GraphQL helpers).

#### `src/routes/` (Application)

Follows SvelteKit's file-based routing:

- `+layout.svelte`: Main layout component.
- `+page.svelte`: Home page.
- `endpoints/`: Routes for viewing and interacting with specific endpoints.
  - `[endpointid]/`: Dynamic route for a specific endpoint.
    - `queries/`: Query builder interface.
    - `mutations/`: Mutation builder interface.

## Key Files

- `src/app.css`: Global styles (including Bootstrap Icons and Tailwind/DaisyUI imports).
- `src/lib/index.ts`: Public API exports for the library.
- `src/lib/utils/usefulFunctions.ts`: Central export point for utility functions.
