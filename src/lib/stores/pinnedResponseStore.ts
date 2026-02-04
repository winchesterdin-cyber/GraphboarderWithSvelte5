import { writable } from 'svelte/store';
import { logger } from '$lib/utils/logger';

/**
 * Interface representing a pinned response.
 */
export interface PinnedResponse {
	/** Unique identifier for the pinned response. */
	id: string;
	/** The JSON response string. */
	response: string;
	/** The name of the query that generated the response. */
	queryName: string;
	/** Timestamp when the response was pinned. */
	timestamp: number;
}

/**
 * Creates the store for managing pinned responses.
 * @returns An object with subscribe, pin, and clear methods.
 */
function createPinnedResponseStore() {
	const { subscribe, set, update } = writable<PinnedResponse | null>(null);

	return {
		subscribe,
		/**
		 * Pins a response.
		 * @param response - The JSON string of the response.
		 * @param queryName - The name of the query.
		 */
		pin: (response: string, queryName: string) => {
			const id = crypto.randomUUID();
			logger.info('Pinning response', { id, queryName });
			set({
				id,
				response,
				queryName,
				timestamp: Date.now()
			});
		},
		/**
		 * Clears the currently pinned response.
		 */
		clear: () => {
			logger.info('Clearing pinned response');
			set(null);
		}
	};
}

/**
 * Singleton instance of the pinned response store.
 */
export const pinnedResponseStore = createPinnedResponseStore();
