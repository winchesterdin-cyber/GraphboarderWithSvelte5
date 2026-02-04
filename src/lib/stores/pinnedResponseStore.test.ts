import { describe, it, expect, beforeEach } from 'vitest';
import { pinnedResponseStore } from './pinnedResponseStore';
import { get } from 'svelte/store';

describe('pinnedResponseStore', () => {
	beforeEach(() => {
		pinnedResponseStore.clear();
	});

	it('should start with null', () => {
		const value = get(pinnedResponseStore);
		expect(value).toBeNull();
	});

	it('should pin a response', () => {
		const response = '{"data": "test"}';
		const queryName = 'TestQuery';

		pinnedResponseStore.pin(response, queryName);

		const value = get(pinnedResponseStore);
		expect(value).not.toBeNull();
		expect(value?.response).toBe(response);
		expect(value?.queryName).toBe(queryName);
		expect(value?.id).toBeDefined();
		expect(value?.timestamp).toBeDefined();
	});

	it('should clear the pinned response', () => {
		pinnedResponseStore.pin('{"data": "test"}', 'TestQuery');
		expect(get(pinnedResponseStore)).not.toBeNull();

		pinnedResponseStore.clear();
		expect(get(pinnedResponseStore)).toBeNull();
	});
});
