import { derived, get, type Writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import { localEndpoints } from '$lib/stores/testData/testEndpoints';
import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
import type { AvailableEndpoint } from '$lib/types';
import { browser } from '$app/environment';
import { logger } from '$lib/utils/logger';

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
 * Persisted store tracking user favorite endpoint IDs.
 * Stored under the 'favoriteEndpointIds' key in localStorage.
 */
export const favoriteEndpointIds: Writable<string[]> = persisted<string[]>(
	'favoriteEndpointIds',
	[]
);

export interface RecentEndpointEntry {
	id: string;
	lastVisited: number;
}

type ResolvedRecentEndpoint = {
	entry: RecentEndpointEntry;
	endpoint: AvailableEndpoint & { isFavorite: boolean };
};

/**
 * Persisted store tracking recently visited endpoints (by ID and last visit time).
 * Stored under the 'recentEndpointEntries' key in localStorage.
 */
export const recentEndpointEntries: Writable<RecentEndpointEntry[]> = persisted<
	RecentEndpointEntry[]
>('recentEndpointEntries', []);

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
			logger.error('Failed to parse legacy endpoints', e);
		}
	}
};

migrateLegacyEndpoints();

/**
 * A derived store that combines hardcoded local endpoints with user-defined endpoints from localStorage.
 * It ensures uniqueness by ID and sorts the endpoints.
 */
export const endpoints = derived(
	[localStorageEndpoints, favoriteEndpointIds],
	([$localStorageEndpoints, $favoriteEndpointIds]) => {
		const favoriteSet = new Set($favoriteEndpointIds.map((id) => id.toString()));
		const userUniqueEndpoints = $localStorageEndpoints.filter(
			(e) => !localEndpoints.find((le) => le.id === e.id)
		);

		const merged = [...localEndpoints, ...userUniqueEndpoints];
		// IDs can be string or number, getSortedAndOrderedEndpoints now handles both.
		const result = getSortedAndOrderedEndpoints(merged).map((endpoint) => ({
			...endpoint,
			isFavorite: favoriteSet.has(endpoint.id.toString())
		}));
		logger.debug('Endpoints updated', { count: result.length });
		return result;
	}
);

/**
 * Derived store that resolves recent endpoint entries to full endpoint data.
 * It filters out entries for endpoints that no longer exist.
 */
export const recentEndpoints = derived(
	[recentEndpointEntries, endpoints],
	([$recentEndpointEntries, $endpoints]) => {
		const endpointMap = new Map($endpoints.map((endpoint) => [endpoint.id.toString(), endpoint]));
		return $recentEndpointEntries
			.map((entry) => ({
				entry,
				endpoint: endpointMap.get(entry.id)
			}))
			.filter((item): item is ResolvedRecentEndpoint => Boolean(item.endpoint))
			.sort((a, b) => b.entry.lastVisited - a.entry.lastVisited);
	}
);

/**
 * Adds or updates an endpoint in the user's localStorage.
 * If an endpoint with the same ID exists, it will be replaced.
 *
 * @param endpoint - The endpoint object to add or update.
 */
export const addEndpoint = (endpoint: AvailableEndpoint) => {
	logger.info('Adding endpoint', { id: endpoint.id, url: endpoint.url });
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
	logger.info('Removing endpoint', { id });
	localStorageEndpoints.update((current) => {
		return current.filter((e) => e.id !== id);
	});
	favoriteEndpointIds.update((current) => current.filter((favoriteId) => favoriteId !== id));
};

/**
 * Toggles the favorite status for an endpoint ID.
 *
 * @param id - The endpoint ID to toggle.
 */
export const toggleEndpointFavorite = (id: string) => {
	logger.info('Toggling endpoint favorite', { id });
	favoriteEndpointIds.update((current) => {
		const normalizedId = id.toString();
		if (current.includes(normalizedId)) {
			return current.filter((favoriteId) => favoriteId !== normalizedId);
		}
		return [...current, normalizedId];
	});
};

/**
 * Records an endpoint visit for the "Recent endpoints" list.
 * The list is de-duplicated, ordered by recency, and capped for usability.
 *
 * @param id - The endpoint ID to record.
 * @param maxEntries - Maximum number of recent endpoints to keep.
 */
export const recordRecentEndpoint = (id: string, maxEntries = 5) => {
	const normalizedId = id.toString();
	recentEndpointEntries.update((current) => {
		const now = Date.now();
		const next = [
			{ id: normalizedId, lastVisited: now },
			...current.filter((entry) => entry.id !== normalizedId)
		].slice(0, maxEntries);
		logger.info('Recorded recent endpoint', { id: normalizedId, total: next.length });
		return next;
	});
};

/**
 * Clears the recently visited endpoint list.
 */
export const clearRecentEndpoints = () => {
	logger.warn('Clearing recent endpoints');
	recentEndpointEntries.set([]);
};
