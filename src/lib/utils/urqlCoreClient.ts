import { writable } from 'svelte/store';
import { logEvent } from '$lib/observability/logger';

/**
 * Creates a writable store for the URQL Core Client.
 * Includes lightweight query caching + manual invalidation hooks.
 */
export const Create_urqlCoreClient = () => {
	const store = writable(null);
	const queryCache = new Map<string, unknown>();
	const { subscribe, set, update } = store;

	const makeCacheKey = (query: unknown, variables: unknown) =>
		`${String(query)}::${JSON.stringify(variables)}`;

	return {
		subscribe,
		invalidateQueryCache: () => {
			queryCache.clear();
			logEvent('info', 'graphql.cache.invalidate_all', { feature: 'graphql-cache' });
		},
		invalidateByPattern: (pattern: string) => {
			for (const key of queryCache.keys()) {
				if (key.includes(pattern)) {
					queryCache.delete(key);
				}
			}
			logEvent('info', 'graphql.cache.invalidate_pattern', {
				feature: 'graphql-cache',
				pattern
			});
		},
		/**
		 * Sets the URQL client instance and decorates query/mutation methods.
		 */
		set: (value: any) => {
			logEvent('debug', 'urql.client.set', { feature: 'graphql-client' });
			if (value) {
				if (typeof value.query === 'function' && !value._queryLogged) {
					const originalQuery = value.query.bind(value);
					value.query = (query: unknown, variables: unknown, ...rest: unknown[]) => {
						const key = makeCacheKey(query, variables);
						if (queryCache.has(key)) {
							logEvent('debug', 'graphql.cache.hit', { feature: 'graphql-cache' });
							return queryCache.get(key);
						}

						const response = originalQuery(query, variables, ...rest);
						queryCache.set(key, response);
						logEvent('debug', 'graphql.cache.miss', { feature: 'graphql-cache' });
						return response;
					};
					value._queryLogged = true;
				}

				if (typeof value.mutation === 'function' && !value._mutationLogged) {
					const originalMutation = value.mutation.bind(value);
					value.mutation = (...args: unknown[]) => {
						logEvent('debug', 'graphql.mutation', { feature: 'graphql-client' });
						queryCache.clear();
						return originalMutation(...args);
					};
					value._mutationLogged = true;
				}
			}
			set(value);
		},
		/**
		 * Updates the URQL client instance.
		 */
		update: (updater: (value: any) => any) => {
			update((current) => {
				const newValue = updater(current);
				logEvent('debug', 'urql.client.update', { feature: 'graphql-client' });
				return newValue;
			});
		}
	};
};

export const urqlCoreClient = Create_urqlCoreClient();
