import { visit, Kind, parse, type DocumentNode } from 'graphql';

/**
 * Calculates the complexity of a GraphQL query based on the number of fields.
 * Each field counts as 1. Nested fields are summed up.
 *
 * @param {DocumentNode | string} query - The GraphQL query AST or string.
 * @returns {number} The calculated complexity score.
 */
export const calculateComplexity = (query: DocumentNode | string): number => {
	let ast: DocumentNode;
	try {
		if (typeof query === 'string') {
			if (!query.trim()) return 0;
			ast = parse(query);
		} else {
			ast = query;
		}
	} catch (e) {
		console.warn('Failed to parse query for complexity calculation', e);
		return 0;
	}

	let complexity = 0;

	visit(ast, {
		[Kind.FIELD]: () => {
			complexity++;
		}
	});

	return complexity;
};
