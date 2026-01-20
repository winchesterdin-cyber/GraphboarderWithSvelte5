# Testing Guide

We use **Vitest** for unit testing and **Playwright** for end-to-end (E2E) testing.

## Unit Tests

Unit tests are located alongside the source files or in `test/` directories within `src/lib`. They typically verify the logic of individual components, stores, and utility functions.

To run unit tests:

```bash
npm run test:unit
```

## End-to-End (E2E) Tests

E2E tests are located in the `e2e/` directory. These tests simulate user interactions in a browser environment to verify the full application flow.

To run E2E tests:

```bash
npm run test:e2e
```

**Note:** Ensure you have installed the Playwright browsers first: `npx playwright install`.

## Running All Tests

To run both unit and E2E tests:

```bash
npm test
```
