import { derived, get, type Writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import { localEndpoints } from '$lib/stores/testData/testEndpoints';
import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
import type { AvailableEndpoint } from '$lib/types';
import { browser } from '$app/environment';

/**
 * @deprecated This store appears to be unused. Use localStorageEndpoints instead.
 */
export const userEndpoints: Writable<AvailableEndpoint[]> = persisted<AvailableEndpoint[]>(
	'userEndpoints',
	[]
);

/**
 * Persisted store for user-defined endpoints.
 * Data is saved to the browser's localStorage under the key 'localStorageEndpoints'.
 */
export const localStorageEndpoints: Writable<AvailableEndpoint[]> = persisted<AvailableEndpoint[]>(
	'localStorageEndpoints',
	[]
);

/**
 * Migrates endpoints from the legacy 'endpoints' localStorage key to the new 'localStorageEndpoints' store.
 * This runs once on module initialization in the browser.
 */
const migrateLegacyEndpoints = () => {
	if (!browser) return;

	const legacyEndpoints = localStorage.getItem('endpoints');
	if (legacyEndpoints) {
		try {
			const parsed = JSON.parse(legacyEndpoints);
			if (Array.isArray(parsed) && parsed.length > 0) {
				const current = get(localStorageEndpoints);
				if (current.length === 0) {
					localStorageEndpoints.set(parsed);
				}
			}
		} catch (e) {
			console.error('Failed to parse legacy endpoints', e);
		}
	}
};

migrateLegacyEndpoints();

/**
 * A derived store that combines hardcoded local endpoints with user-defined endpoints from localStorage.
 * It ensures uniqueness by ID and sorts the endpoints.
 */
export const endpoints = derived(localStorageEndpoints, ($localStorageEndpoints) => {
	const userUniqueEndpoints = $localStorageEndpoints.filter(
		(e) => !localEndpoints.find((le) => le.id === e.id)
	);

	const merged = [...localEndpoints, ...userUniqueEndpoints];
	// IDs can be string or number, getSortedAndOrderedEndpoints now handles both.
	const result = getSortedAndOrderedEndpoints(merged);
	console.debug('Endpoints updated:', result);
	return result;
});

/**
 * Adds or updates an endpoint in the user's localStorage.
 * If an endpoint with the same ID exists, it will be replaced.
 *
 * @param endpoint - The endpoint object to add or update.
 */
export const addEndpoint = (endpoint: AvailableEndpoint) => {
	console.debug('Adding endpoint:', endpoint);
	localStorageEndpoints.update((current) => {
		const filtered = current.filter((e) => e.id !== endpoint.id);
		return [...filtered, endpoint];
	});
};

/**
 * Removes an endpoint from the user's localStorage by its ID.
 *
 * @param id - The unique identifier of the endpoint to remove.
 */
export const removeEndpoint = (id: string) => {
	console.debug('Removing endpoint with id:', id);
	localStorageEndpoints.update((current) => {
		return current.filter((e) => e.id !== id);
	});
};
