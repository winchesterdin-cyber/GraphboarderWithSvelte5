import { describe, expect, it, vi } from 'vitest';
import { filterEntities, searchEntities, type SearchableEntity } from './globalSearch';

const sampleEntities: SearchableEntity[] = [
	{
		id: '1',
		name: 'Orders',
		tags: ['core', 'sales'],
		description: 'Order queries',
		status: 'active'
	},
	{
		id: '2',
		name: 'Customers',
		tags: ['crm'],
		description: 'Customer relationship management',
		status: 'active'
	},
	{
		id: '3',
		name: 'Málaga Analytics',
		tags: ['regional', 'analytics'],
		description: 'Insights for Andalucía',
		archived: true,
		status: 'deprecated'
	},
	{
		id: '4',
		name: 'Order Archive',
		tags: ['archive'],
		description: 'Historical orders',
		status: 'inactive'
	},
	{
		id: '1',
		name: 'Orders Duplicate',
		tags: ['core'],
		description: 'Duplicate id row',
		status: 'active'
	}
];

describe('globalSearch', () => {
	it('keeps backwards compatibility for text/tag filtering', () => {
		const results = filterEntities(sampleEntities, { query: 'ord', tags: ['core'] });
		expect(results).toHaveLength(2);
		expect(results.map((item) => item.id)).toEqual(['1', '1']);
	});

	it('supports excludeTags filtering', () => {
		const { entities } = searchEntities(sampleEntities, {
			query: 'order',
			excludeTags: ['archive']
		});
		expect(entities.map((item) => item.id)).toEqual(['1', '1']);
	});

	it('supports exact and prefix search modes', () => {
		const exact = searchEntities(sampleEntities, {
			query: 'orders order queries',
			searchMode: 'exact',
			searchFields: ['name', 'description']
		});
		expect(exact.entities.map((item) => item.id)).toEqual(['1']);

		const prefix = searchEntities(sampleEntities, { query: 'cust', searchMode: 'prefix' });
		expect(prefix.entities.map((item) => item.id)).toEqual(['2']);
	});

	it('supports diacritic normalization and case sensitivity toggles', () => {
		const normalized = searchEntities(sampleEntities, { query: 'malaga' });
		expect(normalized.entities.map((item) => item.id)).toEqual(['3']);

		const strict = searchEntities(sampleEntities, {
			query: 'malaga',
			normalizeDiacritics: false,
			caseSensitive: true
		});
		expect(strict.entities).toHaveLength(0);
	});

	it('supports token-all mode and requireAllTokens', () => {
		const tokenAll = searchEntities(sampleEntities, {
			query: 'order queries',
			searchMode: 'token-all'
		});
		expect(tokenAll.entities.map((item) => item.id)).toEqual(['1']);

		const requireAll = searchEntities(sampleEntities, {
			query: 'order historical',
			requireAllTokens: true
		});
		expect(requireAll.entities.map((item) => item.id)).toEqual(['4']);
	});

	it('supports archived/status/includeIds/excludeIds filters', () => {
		const results = searchEntities(sampleEntities, {
			query: '',
			includeArchived: false,
			statuses: ['active'],
			includeIds: ['1', '2', '3'],
			excludeIds: ['2']
		});
		expect(results.entities.map((item) => item.id)).toEqual(['1', '1']);
	});

	it('supports synonyms and minimum query length', () => {
		const withSynonyms = searchEntities(sampleEntities, {
			query: 'clients',
			synonyms: { clients: ['customer'] }
		});
		expect(withSynonyms.entities.map((item) => item.id)).toEqual(['2']);

		const tooShort = searchEntities(sampleEntities, {
			query: 'or',
			minQueryLength: 3
		});
		expect(tooShort.totalMatches).toBe(sampleEntities.length);
	});

	it('supports customFilter, dedupeById, sorting, and pagination', () => {
		const result = searchEntities(sampleEntities, {
			query: 'order',
			dedupeById: true,
			customFilter: (entity) => entity.name !== 'Order Archive',
			sortBy: 'name',
			sortDirection: 'asc',
			offset: 0,
			limit: 1
		});

		expect(result.totalMatches).toBe(1);
		expect(result.entities.map((item) => item.id)).toEqual(['1']);
	});

	it('emits diagnostics through return payload and callback hook', () => {
		const diagnosticsSpy = vi.fn();
		const result = searchEntities(sampleEntities, {
			query: 'unknown text',
			tags: ['core'],
			onDiagnostics: diagnosticsSpy,
			dedupeById: true
		});

		expect(result.entities).toHaveLength(0);
		expect(result.diagnostics.inputCount).toBe(sampleEntities.length);
		expect(result.diagnostics.droppedBy.text).toBeGreaterThan(0);
		expect(result.diagnostics.droppedBy.duplicate).toBe(1);
		expect(diagnosticsSpy).toHaveBeenCalledTimes(1);
	});
});
