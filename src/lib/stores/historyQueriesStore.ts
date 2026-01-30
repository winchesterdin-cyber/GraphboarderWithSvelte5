import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Interface representing a query executed in history.
 */
export interface HistoryQuery {
	/** Unique identifier for the history item */
	id: string;
	/** The ID of the endpoint this query belongs to */
	endpointId: string;
	/** The name of the query or mutation */
	queryName: string;
	/** Type of the operation */
	type: 'query' | 'mutation';
	/** The arguments used for the query (values only) */
	args: Record<string, unknown>;
	/** The table columns configuration (for queries) */
	cols: any[];
	/** Timestamp when the query was executed */
	timestamp: number;
	/** Duration of the execution in milliseconds */
	duration: number;
	/** Execution status */
	status: 'success' | 'error';
	/** The full query body string */
	queryBody?: string;
}

const STORAGE_KEY = 'historyQueries';
const MAX_HISTORY = 50;

/**
 * Store to manage query execution history with localStorage persistence.
 */
const createHistoryQueriesStore = () => {
	let initial: HistoryQuery[] = [];
	if (browser && localStorage.getItem(STORAGE_KEY)) {
		try {
			initial = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
		} catch (e) {
			console.error('Failed to parse history queries from localStorage', e);
		}
	}

	const { subscribe, update, set } = writable<HistoryQuery[]>(initial);

	return {
		subscribe,
		/**
		 * Adds a new query to history.
		 * Keeps only the last MAX_HISTORY items.
		 * @param item The history item to add (excluding id).
		 */
		add: (item: Omit<HistoryQuery, 'id'>) => {
			console.debug('[HistoryQueries] Adding item:', item.queryName);
			update((history) => {
				const newItem = { ...item, id: crypto.randomUUID() };
				const updated = [newItem, ...history].slice(0, MAX_HISTORY);
				if (browser) {
					try {
						localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
					} catch (e) {
						console.error('[HistoryQueries] Failed to save history to localStorage', e);
					}
				}
				return updated;
			});
		},
		/**
		 * Retrieves a history item by ID.
		 * @param id The ID of the history item.
		 */
		get: (id: string): HistoryQuery | undefined => {
			let item: HistoryQuery | undefined;
			subscribe((h) => {
				item = h.find((i) => i.id === id);
			})();
			return item;
		},
		/**
		 * Clears all history.
		 */
		clear: () => {
			console.debug('[HistoryQueries] Clearing history');
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set([]);
		}
	};
};

export const historyQueries = createHistoryQueriesStore();
