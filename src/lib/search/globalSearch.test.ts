import { describe, expect, it } from 'vitest';
import { filterEntities } from './globalSearch';

describe('globalSearch', () => {
	it('filters entities by text and tags', () => {
		const results = filterEntities(
			[
				{ id: '1', name: 'Orders', tags: ['core'], description: 'Order queries' },
				{ id: '2', name: 'Customers', tags: ['crm'], description: 'Customer queries' }
			],
			{ query: 'ord', tags: ['core'] }
		);
		expect(results).toHaveLength(1);
		expect(results[0]?.id).toBe('1');
	});
});
