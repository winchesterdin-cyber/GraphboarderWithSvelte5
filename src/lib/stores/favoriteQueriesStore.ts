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
	/** Optional folder name for organization */
	folder?: string;
	/** Timestamp when the query was saved */
	timestamp: number;
}

const STORAGE_KEY = 'favoriteQueries';

const normalizeText = (value?: string) => value?.trim() ?? '';

const normalizeFolder = (value?: string) => {
	const normalized = normalizeText(value);
	return normalized.length > 0 ? normalized : undefined;
};

const normalizeFavoriteInput = (query: Omit<FavoriteQuery, 'id' | 'timestamp'>) => ({
	...query,
	name: normalizeText(query.name),
	query: normalizeText(query.query),
	folder: normalizeFolder(query.folder)
});

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
			const normalized = normalizeFavoriteInput(query);
			if (!normalized.name || !normalized.query || !normalized.endpointId) {
				console.warn('[FavoriteQueries] Skipping add: missing required fields');
				return;
			}
			console.debug(
				'[FavoriteQueries] Adding query:',
				normalized.name,
				'Folder:',
				normalized.folder
			);
			update((queries) => {
				const newQuery = { ...normalized, id: crypto.randomUUID(), timestamp: Date.now() };
				// Check for duplicates based on name and endpoint
				const filtered = queries.filter(
					(q) => !(q.name === newQuery.name && q.endpointId === newQuery.endpointId)
				);
				const updated = [newQuery, ...filtered];
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		/**
		 * Updates an existing favorite query.
		 * Moves the updated favorite to the top and removes duplicates by name + endpoint.
		 * @param id The ID of the favorite to update.
		 * @param updates Partial updates to apply.
		 */
		update: (id: string, updates: Partial<Omit<FavoriteQuery, 'id' | 'timestamp'>>) => {
			update((queries) => {
				const target = queries.find((q) => q.id === id);
				if (!target) return queries;

				const merged = {
					...target,
					...updates,
					name: normalizeText(updates.name ?? target.name),
					query: normalizeText(updates.query ?? target.query),
					folder: normalizeFolder(updates.folder ?? target.folder),
					timestamp: Date.now()
				};

				if (!merged.name || !merged.query || !merged.endpointId) {
					return queries;
				}

				const withoutDuplicates = queries.filter(
					(q) => q.id === id || !(q.name === merged.name && q.endpointId === merged.endpointId)
				);

				const reordered = [merged, ...withoutDuplicates.filter((q) => q.id !== id)];
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
				}
				return reordered;
			});
		},
		/**
		 * Renames (or clears) a folder across favorites for a specific endpoint.
		 * @param endpointId The endpoint scope for the folder rename.
		 * @param from The existing folder name.
		 * @param to The new folder name (blank to clear).
		 */
		renameFolder: (endpointId: string, from: string, to: string) => {
			const fromFolder = normalizeFolder(from);
			const toFolder = normalizeFolder(to);
			update((queries) => {
				const updated = queries.map((q) => {
					if (q.endpointId !== endpointId) return q;
					const currentFolder = normalizeFolder(q.folder);
					if (currentFolder !== fromFolder) return q;
					return { ...q, folder: toFolder, timestamp: Date.now() };
				});
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
		},
		/**
		 * Imports a list of favorite queries.
		 * Overwrites existing favorites with the same name and endpoint ID.
		 * @param queries List of favorites to import.
		 */
		importFavorites: (queries: Omit<FavoriteQuery, 'id' | 'timestamp'>[]) => {
			console.debug('[FavoriteQueries] Importing queries:', queries.length);
			update((current) => {
				const now = Date.now();
				let updated = [...current];

				queries.forEach((query) => {
					const q = normalizeFavoriteInput(query);
					if (!q.name || !q.query || !q.endpointId) {
						return;
					}
					// Remove existing if any
					updated = updated.filter(
						(existing) => !(existing.name === q.name && existing.endpointId === q.endpointId)
					);
					// Add new
					updated.unshift({
						...q,
						id: crypto.randomUUID(),
						timestamp: now
					});
				});

				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		}
	};
};

export const favoriteQueries = createFavoriteQueriesStore();
