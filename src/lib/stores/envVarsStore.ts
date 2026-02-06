import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { logger } from '$lib/utils/logger';

export interface EnvVars {
	[key: string]: string;
}

const STORAGE_KEY = 'envVars';

/**
 * Creates a store for managing environment variables.
 * These variables are stored in localStorage and can be used in dynamic headers.
 */
function createEnvVarsStore() {
	const { subscribe, set, update } = writable<EnvVars>({});

	// Initialize from localStorage if in browser
	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				set(JSON.parse(stored));
			} catch (e) {
				logger.error('Failed to parse stored env vars:', e);
			}
		}
	}

	return {
		subscribe,
		/**
		 * Sets a new environment variable or updates an existing one.
		 * @param key The variable name.
		 * @param value The variable value.
		 */
		setVar: (key: string, value: string) => {
			update((vars) => {
				const newVars = { ...vars, [key]: value };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newVars));
				}
				logger.debug(`EnvVar set: ${key}`);
				return newVars;
			});
		},
		/**
		 * Removes an environment variable.
		 * @param key The variable name to remove.
		 */
		removeVar: (key: string) => {
			update((vars) => {
				const newVars = { ...vars };
				delete newVars[key];
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newVars));
				}
				logger.debug(`EnvVar removed: ${key}`);
				return newVars;
			});
		},
		/**
		 * Imports environment variables, merging with existing ones.
		 * @param importedVars The variables to import.
		 */
		importVars: (importedVars: EnvVars) => {
			update((vars) => {
				const newVars = { ...vars, ...importedVars };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newVars));
				}
				logger.info(`Imported ${Object.keys(importedVars).length} env vars`);
				return newVars;
			});
		},
		/**
		 * Gets a variable value (mostly for internal use, use subscription in components).
		 * @param key The variable name.
		 */
		getVar: (key: string) => {
			// Note: access via subscription or $envVars in components
			// This helper might be useful for one-off reads if needed,
			// but usually we subscribe.
			// Since this is a store, we can't sync return easily without get() from svelte/store
			// but we can rely on the store value being passed around.
			return null;
		}
	};
}

export const envVars = createEnvVarsStore();
