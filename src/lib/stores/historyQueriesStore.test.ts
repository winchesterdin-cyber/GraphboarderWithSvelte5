import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { historyQueries } from './historyQueriesStore';

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

describe('historyQueriesStore', () => {
	beforeEach(() => {
		localStorage.clear();
		historyQueries.clear();
	});

	it('should start with an empty list', () => {
		const queries = get(historyQueries);
		expect(queries).toEqual([]);
	});

	it('should add a history item', () => {
		const item = {
			endpointId: 'ep1',
			queryName: 'TestQuery',
			type: 'query' as const,
			args: {},
			cols: [],
			timestamp: Date.now(),
			duration: 100,
			status: 'success' as const
		};

		historyQueries.add(item);

		const queries = get(historyQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].queryName).toBe('TestQuery');
		expect(queries[0].id).toBeDefined();
	});

	it('should limit history to 50 items', () => {
		for (let i = 0; i < 60; i++) {
			historyQueries.add({
				endpointId: 'ep1',
				queryName: `Query ${i}`,
				type: 'query' as const,
				args: {},
				cols: [],
				timestamp: Date.now() + i, // Ensure distinct timestamps
				duration: 100,
				status: 'success' as const
			});
		}

		const queries = get(historyQueries);
		expect(queries).toHaveLength(50);
		// The most recent one (Query 59) should be at the top (index 0)
		expect(queries[0].queryName).toBe('Query 59');
	});

	it('should clear history', () => {
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'TestQuery',
			type: 'query' as const,
			args: {},
			cols: [],
			timestamp: Date.now(),
			duration: 100,
			status: 'success' as const
		});

		historyQueries.clear();
		const queries = get(historyQueries);
		expect(queries).toHaveLength(0);
	});

	it('should import history and merge/sort', () => {
		// Add existing item
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'Existing',
			type: 'query' as const,
			args: {},
			cols: [],
			timestamp: 1000,
			duration: 100,
			status: 'success' as const
		});

		// Import items (one older, one newer)
		const importItems = [
			{
				endpointId: 'ep1',
				queryName: 'Old',
				type: 'query' as const,
				args: {},
				cols: [],
				timestamp: 500,
				duration: 100,
				status: 'success' as const
			},
			{
				endpointId: 'ep1',
				queryName: 'New',
				type: 'query' as const,
				args: {},
				cols: [],
				timestamp: 2000,
				duration: 100,
				status: 'success' as const
			}
		];

		historyQueries.importHistory(importItems);

		const queries = get(historyQueries);
		expect(queries).toHaveLength(3);
		expect(queries[0].queryName).toBe('New');
		expect(queries[1].queryName).toBe('Existing');
		expect(queries[2].queryName).toBe('Old');
	});
});
