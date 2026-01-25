import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface RecentQuery {
	id: string;
	name: string;
	type: 'query' | 'mutation';
	endpointId: string;
	timestamp: number;
}

const STORAGE_KEY = 'recentQueries';
const MAX_RECENT = 10;

const createRecentQueriesStore = () => {
	const initial: RecentQuery[] =
		browser && localStorage.getItem(STORAGE_KEY)
			? JSON.parse(localStorage.getItem(STORAGE_KEY) as string)
			: [];

	const { subscribe, update } = writable<RecentQuery[]>(initial);

	return {
		subscribe,
		add: (query: Omit<RecentQuery, 'id' | 'timestamp'>) => {
			update((queries) => {
				const newQuery = { ...query, id: crypto.randomUUID(), timestamp: Date.now() };
				// Remove duplicates (same name, type, and endpoint)
				const filtered = queries.filter(
					(q) =>
						!(
							q.name === query.name &&
							q.type === query.type &&
							q.endpointId === query.endpointId
						)
				);
				const updated = [newQuery, ...filtered].slice(0, MAX_RECENT);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				}
				return updated;
			});
		},
		clear: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			update(() => []);
		}
	};
};

export const recentQueries = createRecentQueriesStore();
