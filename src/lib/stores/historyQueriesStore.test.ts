import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { historyQueries } from './historyQueriesStore';

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
		vi.restoreAllMocks();
	});

	it('adds history entries and preserves newest first', () => {
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'First',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 1,
			duration: 10,
			status: 'success',
			queryBody: 'query { first }'
		});
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'Second',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 2,
			duration: 20,
			status: 'success',
			queryBody: 'query { second }'
		});

		const items = get(historyQueries);
		expect(items[0].queryName).toBe('Second');
		expect(items[1].queryName).toBe('First');
	});

	it('removes an item by id', () => {
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'Remove Me',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 1,
			duration: 10,
			status: 'success',
			queryBody: 'query { removeMe }'
		});

		const [item] = get(historyQueries);
		historyQueries.remove(item.id);

		expect(get(historyQueries)).toHaveLength(0);
	});

	it('clears all history', () => {
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'One',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 1,
			duration: 10,
			status: 'success',
			queryBody: 'query { one }'
		});

		historyQueries.clear();
		expect(get(historyQueries)).toEqual([]);
	});

	it('limits stored history to the latest 50 items', () => {
		for (let i = 0; i < 55; i += 1) {
			historyQueries.add({
				endpointId: 'ep1',
				queryName: `Query ${i}`,
				type: 'query',
				args: {},
				cols: [],
				timestamp: i,
				duration: 10,
				status: 'success',
				queryBody: `query { q${i} }`
			});
		}

		const items = get(historyQueries);
		expect(items).toHaveLength(50);
		expect(items[0].queryName).toBe('Query 54');
		expect(items[49].queryName).toBe('Query 5');
	});

	it('imports history and keeps most recent timestamps', () => {
		historyQueries.add({
			endpointId: 'ep1',
			queryName: 'Existing',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 10,
			duration: 10,
			status: 'success',
			queryBody: 'query { existing }'
		});

		historyQueries.importHistory([
			{
				endpointId: 'ep1',
				queryName: 'Imported New',
				type: 'mutation',
				args: { name: 'Alpha' },
				cols: [],
				timestamp: 30,
				duration: 40,
				status: 'success',
				queryBody: 'mutation { addItem(name: "Alpha") { id } }'
			},
			{
				endpointId: 'ep1',
				queryName: 'Imported Old',
				type: 'query',
				args: {},
				cols: [],
				timestamp: 5,
				duration: 15,
				status: 'success',
				queryBody: 'query { old }'
			}
		]);

		const items = get(historyQueries);
		expect(items[0].queryName).toBe('Imported New');
		expect(items[items.length - 1].queryName).toBe('Imported Old');
	});
});
