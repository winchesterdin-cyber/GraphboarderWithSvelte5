import { describe, it, expect } from 'vitest';
import { getIntrospectionQuery } from 'graphql';
import { startMockGraphqlServer } from './mockGraphqlServer';

const postGraphql = async <T>(url: string, query: string, variables?: Record<string, unknown>) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, variables })
	});

	expect(response.ok).toBe(true);
	return (await response.json()) as T;
};

describe('mockGraphqlServer', () => {
	it('supports introspection queries', async () => {
		const server = await startMockGraphqlServer();
		try {
			const result = await postGraphql<{ data: { __schema?: unknown } }>(
				server.url,
				getIntrospectionQuery()
			);
			expect(result.data.__schema).toBeTruthy();
		} finally {
			await server.close();
		}
	});

	it('reads and writes sqlite-backed items', async () => {
		const server = await startMockGraphqlServer();
		try {
			const listResult = await postGraphql<{ data: { items: Array<{ name: string }> } }>(
				server.url,
				`query { items { name } }`
			);

			expect(listResult.data.items.map((item) => item.name)).toEqual(['Alpha', 'Beta']);

			const addResult = await postGraphql<{ data: { addItem: { name: string } } }>(
				server.url,
				`mutation AddItem($name: String!) { addItem(name: $name) { name } }`,
				{ name: 'Gamma' }
			);

			expect(addResult.data.addItem.name).toBe('Gamma');

			const updatedResult = await postGraphql<{ data: { items: Array<{ name: string }> } }>(
				server.url,
				`query { items { name } }`
			);

			expect(updatedResult.data.items.map((item) => item.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
		} finally {
			await server.close();
		}
	});
});
