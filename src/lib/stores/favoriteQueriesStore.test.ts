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
		vi.restoreAllMocks();
	});

	it('should start with an empty list', () => {
		const queries = get(favoriteQueries);
		expect(queries).toEqual([]);
	});

	it('should add a query', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
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
		expect(queries[0].timestamp).toBe(1700000000000);
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
		vi.spyOn(Date, 'now').mockReturnValue(1700000001000);
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

	it('should import favorites', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1700000002000);
		const importData = [
			{
				name: 'Imported 1',
				query: '{ q1 }',
				type: 'query' as const,
				endpointId: 'ep1'
			},
			{
				name: 'Imported 2',
				query: 'mutation { m1 }',
				type: 'mutation' as const,
				endpointId: 'ep1'
			}
		];

		favoriteQueries.importFavorites(importData);

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(2);
		// Since we unshift each item, the last one processed ends up at index 0
		expect(queries[0].name).toBe('Imported 2');
		expect(queries[1].name).toBe('Imported 1');
		expect(queries[0].timestamp).toBe(1700000002000);
	});

	it('should add a query with folder', () => {
		favoriteQueries.add({
			name: 'Query with Folder',
			query: '{ test }',
			type: 'query',
			endpointId: 'ep1',
			folder: 'My Folder'
		});

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].name).toBe('Query with Folder');
		expect(queries[0].folder).toBe('My Folder');
	});

	it('should trim and validate favorites on add', () => {
		favoriteQueries.add({
			name: '  Trimmed Name  ',
			query: '  { test }  ',
			type: 'query',
			endpointId: 'ep1',
			folder: '  '
		});

		favoriteQueries.add({
			name: '   ',
			query: '{ invalid }',
			type: 'query',
			endpointId: 'ep1'
		});

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].name).toBe('Trimmed Name');
		expect(queries[0].query).toBe('{ test }');
		expect(queries[0].folder).toBeUndefined();
	});

	it('should update a favorite and move it to the top', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1700000005000);

		favoriteQueries.add({
			name: 'First',
			query: '{ first }',
			type: 'query',
			endpointId: 'ep1'
		});
		favoriteQueries.add({
			name: 'Second',
			query: '{ second }',
			type: 'query',
			endpointId: 'ep1'
		});

		let queries = get(favoriteQueries);
		const secondId = queries[0].id;

		favoriteQueries.update(secondId, { name: 'Second Updated', folder: 'New Folder' });

		queries = get(favoriteQueries);
		expect(queries[0].name).toBe('Second Updated');
		expect(queries[0].folder).toBe('New Folder');
		expect(queries[0].timestamp).toBe(1700000005000);
	});

	it('should clear the folder when updating with a blank value', () => {
		favoriteQueries.add({
			name: 'Foldered',
			query: '{ foldered }',
			type: 'query',
			endpointId: 'ep1',
			folder: 'Old Folder'
		});

		const [favorite] = get(favoriteQueries);
		favoriteQueries.update(favorite.id, { folder: '   ' });

		const queries = get(favoriteQueries);
		expect(queries[0].folder).toBeUndefined();
	});

	it('should remove duplicates when updating a favorite name', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1700000006000);

		favoriteQueries.add({
			name: 'Original',
			query: '{ original }',
			type: 'query',
			endpointId: 'ep1'
		});
		favoriteQueries.add({
			name: 'Other',
			query: '{ other }',
			type: 'query',
			endpointId: 'ep1'
		});

		let queries = get(favoriteQueries);
		const otherId = queries.find((q) => q.name === 'Other')?.id as string;

		favoriteQueries.update(otherId, { name: 'Original' });

		queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].name).toBe('Original');
	});

	it('should ignore updates that remove required fields', () => {
		favoriteQueries.add({
			name: 'Keep Me',
			query: '{ keep }',
			type: 'query',
			endpointId: 'ep1'
		});

		const [favorite] = get(favoriteQueries);
		favoriteQueries.update(favorite.id, { name: '   ' });

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].name).toBe('Keep Me');
	});

	it('should rename folders for a specific endpoint', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1700000007000);

		favoriteQueries.add({
			name: 'One',
			query: '{ one }',
			type: 'query',
			endpointId: 'ep1',
			folder: 'Alpha'
		});
		favoriteQueries.add({
			name: 'Two',
			query: '{ two }',
			type: 'query',
			endpointId: 'ep1',
			folder: 'Alpha'
		});
		favoriteQueries.add({
			name: 'Three',
			query: '{ three }',
			type: 'query',
			endpointId: 'ep2',
			folder: 'Alpha'
		});

		favoriteQueries.renameFolder('ep1', 'Alpha', 'Beta');

		const queries = get(favoriteQueries);
		const ep1Folders = queries.filter((q) => q.endpointId === 'ep1').map((q) => q.folder);
		const ep2Folders = queries.filter((q) => q.endpointId === 'ep2').map((q) => q.folder);

		expect(ep1Folders).toEqual(['Beta', 'Beta']);
		expect(ep2Folders).toEqual(['Alpha']);
	});

	it('should clear folders when renaming to a blank value', () => {
		favoriteQueries.add({
			name: 'Alpha Query',
			query: '{ alpha }',
			type: 'query',
			endpointId: 'ep1',
			folder: 'Alpha'
		});

		favoriteQueries.renameFolder('ep1', 'Alpha', '   ');

		const queries = get(favoriteQueries);
		expect(queries[0].folder).toBeUndefined();
	});

	it('should skip invalid entries during import', () => {
		favoriteQueries.importFavorites([
			{
				name: 'Valid',
				query: '{ valid }',
				type: 'query',
				endpointId: 'ep1'
			},
			{
				name: '',
				query: '{ invalid }',
				type: 'query',
				endpointId: 'ep1'
			},
			{
				name: 'Missing Query',
				query: '',
				type: 'query',
				endpointId: 'ep1'
			}
		]);

		const queries = get(favoriteQueries);
		expect(queries).toHaveLength(1);
		expect(queries[0].name).toBe('Valid');
	});
});
