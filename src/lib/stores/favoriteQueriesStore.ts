import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Interface representing a favorite query.
 */
export interface FavoriteQuery {
	/** Unique identifier for the favorite query */
	id: string;
	/** User-defined name for the favorite query */
	name: string;
	/** The actual GraphQL query string */
	query: string;
	/** Type of the operation */
	type: 'query' | 'mutation';
	/** The ID of the endpoint this query belongs to */
	endpointId: string;
	/** Timestamp when the query was saved */
	timestamp: number;
}

const STORAGE_KEY = 'favoriteQueries';

/**
 * Store to manage favorite queries with localStorage persistence.
 */
const createFavoriteQueriesStore = () => {
	const initial: FavoriteQuery[] =
		browser && localStorage.getItem(STORAGE_KEY)
			? JSON.parse(localStorage.getItem(STORAGE_KEY) as string)
			: [];

	const { subscribe, update, set } = writable<FavoriteQuery[]>(initial);

	return {
		subscribe,
		/**
		 * Adds a new query to favorites.
		 * Removes any existing favorite with the same name and endpoint ID to prevent duplicates.
		 * @param query The query details (excluding id and timestamp).
		 */
		add: (query: Omit<FavoriteQuery, 'id' | 'timestamp'>) => {
			console.debug('[FavoriteQueries] Adding query:', query.name);
			update((queries) => {
				const newQuery = { ...query, id: crypto.randomUUID(), timestamp: Date.now() };
				// Check for duplicates based on name and endpoint
				const filtered = queries.filter(
					(q) => !(q.name === query.name && q.endpointId === query.endpointId)
				);
				const updated = [newQuery, ...filtered];
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		/**
		 * Removes a favorite query by its ID.
		 * @param id The ID of the query to remove.
		 */
		remove: (id: string) => {
			console.debug('[FavoriteQueries] Removing query id:', id);
			update((queries) => {
				const updated = queries.filter((q) => q.id !== id);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		/**
		 * Clears all favorite queries.
		 */
		clear: () => {
			console.debug('[FavoriteQueries] Clearing all favorites');
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set([]);
		}
	};
};

export const favoriteQueries = createFavoriteQueriesStore();
