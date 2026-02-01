import { describe, it, expect } from 'vitest';
import { calculateComplexity } from './complexity';

describe('calculateComplexity', () => {
	it('calculates complexity for simple query', () => {
		const query = 'query { user { id name } }';
		expect(calculateComplexity(query)).toBe(3); // user, id, name
	});

	it('calculates complexity for nested query', () => {
		const query = 'query { user { id posts { title } } }';
		expect(calculateComplexity(query)).toBe(4); // user, id, posts, title
	});

	it('returns 0 for empty query', () => {
		expect(calculateComplexity('')).toBe(0);
	});

	it('returns 0 for invalid query', () => {
		// Suppress console.warn for this test
		const originalWarn = console.warn;
		console.warn = () => {};
		expect(calculateComplexity('invalid query')).toBe(0);
		console.warn = originalWarn;
	});
});
