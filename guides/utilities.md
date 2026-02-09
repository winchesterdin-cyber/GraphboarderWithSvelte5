# Utilities Guide

Utility functions are centralized in `src/lib/utils/`.

## `usefulFunctions.ts`

This is the main entry point that re-exports functions from other utility files. Import from here when possible.

```typescript
import { getPreciseType, sortByName } from '$lib/utils/usefulFunctions';
```

## `objectUtils.ts`

Helpers for object manipulation.

- `getPreciseType(value)`: Returns specific type (e.g., 'array', 'null', 'date').
- `passAllObjectValuesThroughStringTransformerAndReturnNewObject(obj)`: Recursively transforms string values in an object/array using `string_transformer`.
- `getValueAtPath` / `setValueAtPath`: Access/modify deep properties using path arrays.

## `stringUtils.ts`

String formatting and manipulation.

- `formatData`: Truncates/formats data for display.
- `smartModifyStringBasedOnBoundries`: Advanced string manipulation.

## `dataStructureTransformers.ts`

Functions to transform data between raw types and UI-ready formats (often used for the QMS).

- `string_transformer`: Prepares a string for GraphQL usage (e.g., escaping).
- `stringToQMSString_transformer`: Reverses the transformation.
- `ISO8601_transformer` / `ISO8601_transformerREVERSE`: Convert date inputs (strings, `Date` objects, or millisecond timestamps) to/from GraphQL-safe ISO 8601 values, warning and falling back safely on invalid input.

## `graphql/`

Utilities for parsing, building, and handling GraphQL schemas and queries.

- `graphql-builder.ts`: Logic to construct query strings from the visual builder state.
