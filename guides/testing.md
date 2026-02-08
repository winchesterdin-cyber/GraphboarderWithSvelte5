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
- **Normalization & Validation**: When stores sanitize input (trim names, drop empty values, or merge duplicates), include explicit cases to confirm the normalization rules.
- **Timestamped Updates**: If a store updates timestamps (e.g., when a favorite is edited or moved), mock `Date.now()` so tests can assert exact values.

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

## Store Test Coverage Expectations

- Validate that favorites prevent duplicates by name + endpoint combinations.
- Confirm that edits move updated favorites to the top of the list and update timestamps.
- Ensure invalid imports (missing names, queries, or endpoints) are safely ignored.
- Validate folder rename behaviors, including clearing folders to return favorites to "Uncategorized".

## Mock GraphQL Server Testing

The project includes a lightweight mock GraphQL server backed by SQLite for exercising GraphQL workflows.

- **Location**: `src/lib/server/mockGraphqlServer.ts` and its accompanying test file.
- **Features**: Introspection is enabled by default, and mutations write to an in-memory SQLite database.
- **Usage**: Run the unit test to verify introspection and query/mutation flows:

```bash
npm run test:unit -- mockGraphqlServer
```

### App E2E Coverage with the Mock Server

Playwright includes an end-to-end test that registers the mock server as an endpoint and verifies the
Explorer UI can load and display query fields.

```bash
npm run test:e2e -- mock-graphql
```

Additional mock-driven E2E coverage validates query and mutation pages plus Explorer filtering:

```bash
npm run test:e2e -- mock-graphql-features
```

History filtering and deletion behavior is covered by a dedicated Playwright test:

```bash
npm run test:e2e -- history-filtering
```

## History Store Coverage Expectations

- Verify history entries cap at 50 items and remain sorted by newest first.
- Ensure history removal and imports update localStorage correctly.
