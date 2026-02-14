/**
 * Performance budget validation used by CI.
 * Limits can be tuned as bundle analytics mature.
 */
export interface PerformanceBudget {
	bundleBytes: number;
	interactionMs: number;
}

export const DEFAULT_BUDGET: PerformanceBudget = {
	bundleBytes: 550_000,
	interactionMs: 200
};

export const isBudgetWithinLimits = (
	measured: PerformanceBudget,
	budget: PerformanceBudget = DEFAULT_BUDGET
): boolean =>
	measured.bundleBytes <= budget.bundleBytes && measured.interactionMs <= budget.interactionMs;
