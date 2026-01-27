import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { favoriteQueries } from './favoriteQueriesStore';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock
});

describe('favoriteQueriesStore', () => {
	beforeEach(() => {
		localStorage.clear();
		favoriteQueries.clear();
	});

	it('should start with an empty list', () => {
		const queries = get(favoriteQueries);
		expect(queries).toEqual([]);
	});

	it('should add a query', () => {
		favoriteQueries.add({
			name: 'Test Query',
			query: '{ test }',
			type: 'query',
			endpointId: 'ep1'
		});

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].name).toBe('Test Query');
		expect(queries[0].id).toBeDefined();
		expect(queries[0].timestamp).toBeDefined();
	});

	it('should remove a query', () => {
		favoriteQueries.add({
			name: 'Test Query',
			query: '{ test }',
			type: 'query',
			endpointId: 'ep1'
		});

		let queries = get(favoriteQueries);
		const id = queries[0].id;

		favoriteQueries.remove(id);

		queries = get(favoriteQueries);
		expect(queries).toHaveLength(0);
	});

	it('should prevent duplicates based on name and endpointId', () => {
		favoriteQueries.add({
			name: 'Test Query',
			query: '{ test }',
			type: 'query',
			endpointId: 'ep1'
		});

		// Add same query again (should update/overwrite, but in our logic it puts it at top)
		// Wait, my logic filters out OLD one and adds NEW one at top.
		favoriteQueries.add({
			name: 'Test Query',
			query: '{ test 2 }',
			type: 'query',
			endpointId: 'ep1'
		});

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].query).toBe('{ test 2 }');
	});

	it('should allow same name for different endpoints', () => {
		favoriteQueries.add({
			name: 'Test Query',
			query: '{ test }',
			type: 'query',
			endpointId: 'ep1'
		});

		favoriteQueries.add({
			name: 'Test Query',
			query: '{ test }',
			type: 'query',
			endpointId: 'ep2'
		});

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(2);
	});
});
