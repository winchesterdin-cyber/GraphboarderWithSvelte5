import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface EnvVars {
	[key: string]: string;
}

const STORAGE_KEY = 'envVars';

function createEnvVarsStore() {
	const { subscribe, set, update } = writable<EnvVars>({});

	// Initialize from localStorage if in browser
	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				set(JSON.parse(stored));
			} catch (e) {
				console.error('Failed to parse stored env vars:', e);
			}
		}
	}

	return {
		subscribe,
		setVar: (key: string, value: string) => {
			update((vars) => {
				const newVars = { ...vars, [key]: value };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newVars));
				}
				console.debug(`EnvVar set: ${key}`);
				return newVars;
			});
		},
		removeVar: (key: string) => {
			update((vars) => {
				const newVars = { ...vars };
				delete newVars[key];
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newVars));
				}
				console.debug(`EnvVar removed: ${key}`);
				return newVars;
			});
		},
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
