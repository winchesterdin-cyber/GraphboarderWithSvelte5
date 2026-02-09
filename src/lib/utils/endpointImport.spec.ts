import { describe, expect, it } from 'vitest';
import { parseEndpointImportPayload, prepareEndpointImport } from './endpointImport';

describe('parseEndpointImportPayload', () => {
	it('throws when payload is not an array', () => {
		expect(() => parseEndpointImportPayload({})).toThrow(
			'Invalid format: expected an array of endpoints'
		);
	});

	it('returns valid endpoints and skips invalid entries', () => {
		const result = parseEndpointImportPayload([
			{ id: ' Demo ', url: ' https://example.com/graphql ' },
			{ id: '', url: 'https://example.com/graphql' },
			{ id: 'Missing URL' },
			'not-an-object'
		]);

		expect(result.total).toBe(4);
		expect(result.endpoints).toEqual([{ id: 'Demo', url: 'https://example.com/graphql' }]);
		expect(result.skipped).toBe(3);
	});

	it('normalizes headers to string values only', () => {
		const result = parseEndpointImportPayload([
			{
				id: 'WithHeaders',
				url: 'https://example.com/graphql',
				headers: {
					Authorization: 'Bearer token',
					Count: 2
				}
			}
		]);

		expect(result.endpoints[0]).toEqual({
			id: 'WithHeaders',
			url: 'https://example.com/graphql',
			headers: {
				Authorization: 'Bearer token'
			}
		});
	});

	it('deduplicates payloads and skips existing IDs when requested', () => {
		const result = prepareEndpointImport(
			[
				{ id: 'alpha', url: 'https://example.com/graphql' },
				{ id: 'alpha', url: 'https://example.com/graphql' },
				{ id: 'beta', url: 'https://example.com/graphql' }
			],
			{
				existingIds: ['beta'],
				skipExisting: true
			}
		);

		expect(result.endpoints).toEqual([{ id: 'alpha', url: 'https://example.com/graphql' }]);
		expect(result.skippedDuplicates).toBe(1);
		expect(result.skippedExisting).toBe(1);
		expect(result.skippedInvalid).toBe(0);
	});
});
