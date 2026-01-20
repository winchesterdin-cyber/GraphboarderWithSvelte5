# Architecture Guide

## Project Structure

This project follows a standard SvelteKit structure, separated into library code and a showcase application.

*   `src/lib`: Contains the core library logic, components, and utilities. This is the code that would be distributed as a package.
    *   `components/`: Reusable Svelte components (e.g., `EndpointPicker`, `CodeEditor`).
    *   `stores/`: State management using Svelte stores (including `endpointsStore`).
    *   `utils/`: Utility functions.
    *   `types/`: TypeScript type definitions.
    *   `features/`: Feature-specific modules.

*   `src/routes`: The SvelteKit application used to showcase and test the library.
    *   `+page.svelte`: The main entry point.
    *   `endpoints/`: Routes related to specific endpoints.
    *   `demo/`: Demo pages.

## State Management

*   **Svelte 5 Runes**: We are migrating to Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactive state management.
*   **Stores**: Legacy global state is managed using Svelte stores, with some persisting data to `localStorage` via `svelte-persisted-store`.

## Styling

*   **DaisyUI & Tailwind CSS**: The UI is built using DaisyUI components and Tailwind CSS utility classes.
*   **Bootstrap Icons**: Icons are provided by Bootstrap Icons, imported in `src/app.css`.
