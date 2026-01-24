# Contributing to GraphboarderWithSvelte5

Thank you for your interest in contributing to GraphboarderWithSvelte5!

## Setup

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Install Playwright Browsers** (Required for tests):
    ```bash
    npx playwright install
    ```

## Development Server

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Testing

We use [Vitest](https://vitest.dev/) for unit tests and [Playwright](https://playwright.dev/) for end-to-end tests.

### Run Unit Tests

```bash
npm run test:unit
```

### Run End-to-End Tests

```bash
npm run test:e2e
```

### Run All Tests

```bash
npm test
```

## Coding Standards

- **Naming Convention**: Use `camelCase` for variables and functions.
- **Semicolons**: Use explicit semicolons.
- **Logging**: Avoid `console.log` in production code. Use `console.warn` or `console.error` if necessary, or better yet, proper UI feedback.
- **Components**: Prefer passing callbacks as props (e.g., `onRowClicked`) over dispatching custom events.
- **State**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`) instead of legacy stores where appropriate.

## Refactoring Guidelines

- Keep components small and focused.
- Extract reusable logic into `src/lib/utils`.
- Avoid "any" types; define interfaces in `src/lib/types`.
- Ensure tests cover new logic.

## Project Structure

- `src/lib`: Library code (components, stores, utils).
- `src/routes`: Showcase/Preview application.
