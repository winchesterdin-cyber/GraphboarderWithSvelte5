import { derived, get } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import { localEndpoints } from '$lib/stores/testData/testEndpoints';
import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
import type { AvailableEndpoint } from '$lib/types';
import { browser } from '$app/environment';

export const userEndpoints = persisted<AvailableEndpoint[]>('userEndpoints', []);
export const localStorageEndpoints = persisted<AvailableEndpoint[]>('localStorageEndpoints', []);

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

export const endpoints = derived(localStorageEndpoints, ($localStorageEndpoints) => {
	const userUniqueEndpoints = $localStorageEndpoints.filter(
		(e) => !localEndpoints.find((le) => le.id === e.id)
	);

	const merged = [...localEndpoints, ...userUniqueEndpoints];
	// IDs can be string or number, getSortedAndOrderedEndpoints now handles both.
	return getSortedAndOrderedEndpoints(merged);
});

export const addEndpoint = (endpoint: AvailableEndpoint) => {
	localStorageEndpoints.update((current) => {
		const filtered = current.filter((e) => e.id !== endpoint.id);
		return [...filtered, endpoint];
	});
};

export const removeEndpoint = (id: string) => {
	localStorageEndpoints.update((current) => {
		return current.filter((e) => e.id !== id);
	});
};
