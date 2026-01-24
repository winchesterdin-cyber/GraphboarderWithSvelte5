import { writable } from 'svelte/store';

/**
 * Creates a writable store for the URQL Core Client.
 * It includes logging for set and update operations to aid debugging.
 */
export const Create_urqlCoreClient = () => {
	const store = writable(null);
	const { subscribe, set, update } = store;

	return {
		subscribe,
		/**
		 * Sets the URQL client instance.
		 * @param value - The new URQL client instance.
		 */
		set: (value: any) => {
			console.debug('urqlCoreClient set:', value);
			if (value) {
				// Wrap query and mutation to log
				if (typeof value.query === 'function' && !value._queryLogged) {
					const originalQuery = value.query.bind(value);
					value.query = (...args: any[]) => {
						console.debug('GraphQL Query:', args[0], args[1]);
						return originalQuery(...args);
					};
					value._queryLogged = true;
				}
				if (typeof value.mutation === 'function' && !value._mutationLogged) {
					const originalMutation = value.mutation.bind(value);
					value.mutation = (...args: any[]) => {
						console.debug('GraphQL Mutation:', args[0], args[1]);
						return originalMutation(...args);
					};
					value._mutationLogged = true;
				}
			}
			set(value);
		},
		/**
		 * Updates the URQL client instance.
		 * @param updater - A function that takes the current client and returns the new one.
		 */
		update: (updater: (value: any) => any) => {
			update((current) => {
				const newValue = updater(current);
				console.debug('urqlCoreClient update:', { current, newValue });
				return newValue;
			});
		}
	};
};
export const urqlCoreClient = Create_urqlCoreClient();
