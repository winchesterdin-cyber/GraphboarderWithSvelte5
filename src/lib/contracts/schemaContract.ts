/**
 * API schema contract helpers used to detect drift.
 */
export const stableStringify = (value: unknown): string =>
	JSON.stringify(value, Object.keys(value as object).sort(), 2);

export const hasSchemaDrift = (previousSchema: unknown, nextSchema: unknown): boolean =>
	stableStringify(previousSchema) !== stableStringify(nextSchema);
