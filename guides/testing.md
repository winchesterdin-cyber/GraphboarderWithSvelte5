# Testing Guide

This project uses **Vitest** for unit testing and **Playwright** for end-to-end (E2E) testing.

## Unit Testing (Vitest)

Unit tests focus on testing individual functions, stores, and components in isolation.

### Running Tests

To run unit tests:

```bash
npm run test:unit
```

### Writing Tests

- **Location**: Co-locate test files with the source file. For example, if you are testing `src/lib/utils/objectUtils.ts`, create `src/lib/utils/objectUtils.test.ts`.
- **Framework**: Use `vitest` imports (`describe`, `it`, `expect`, `vi`).
- **Mocking**: Use `vi.spyOn` or `vi.mock` to mock dependencies (e.g., `console.log`, external modules).

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from './myUtility';

describe('myUtility', () => {
	it('should return correct value', () => {
		expect(myUtility(1)).toBe(2);
	});
});
```

### Special Considerations

- **Stores**: When testing stores that use `svelte-persisted-store` or browser APIs, ensure you mock `localStorage` or run in an environment that supports it.
- **Console Logs**: Tests usually mock `console` methods to keep output clean.

## End-to-End Testing (Playwright)

E2E tests simulate user interactions in a real browser.

### Running Tests

To run E2E tests:

```bash
npm run test:e2e
```

### Setup

Ensure Playwright browsers are installed:

```bash
npx playwright install
```

### Writing Tests

- **Location**: `e2e/` directory or `*.spec.ts` files in `src/`.
- **Best Practices**:
  - Use explicit waits for UI changes (e.g., `expect(locator).not.to_be_visible()`).
  - Target elements using accessible selectors (role, label, text) when possible.

## Running All Tests

To run both unit and E2E tests:

```bash
npm test
```

## CI/CD

Tests are typically run in the CI pipeline to prevent regressions. Ensure all tests pass locally before submitting changes.
