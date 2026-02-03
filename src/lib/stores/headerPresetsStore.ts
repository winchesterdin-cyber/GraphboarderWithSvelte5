import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { logger } from '$lib/utils/logger';

export interface HeaderPreset {
	id: string;
	name: string;
	headers: Record<string, string>;
}

const STORAGE_KEY = 'headerPresets';

function createHeaderPresetsStore() {
	const { subscribe, set, update } = writable<HeaderPreset[]>([]);

	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				set(JSON.parse(stored));
			} catch (e) {
				logger.error('Failed to parse stored header presets', e);
			}
		}
	}

	return {
		subscribe,
		/**
		 * Add a new preset.
		 * @param preset The preset to add.
		 */
		addPreset: (preset: HeaderPreset) => {
			update((presets) => {
				const newPresets = [...presets, preset];
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
				}
				logger.debug(`Header preset added: ${preset.name}`);
				return newPresets;
			});
		},
		/**
		 * Remove a preset by ID.
		 * @param id The ID of the preset to remove.
		 */
		removePreset: (id: string) => {
			update((presets) => {
				const newPresets = presets.filter((p) => p.id !== id);
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
				}
				logger.debug(`Header preset removed: ${id}`);
				return newPresets;
			});
		},
		/**
		 * Update an existing preset.
		 * @param updatedPreset The preset with updated values.
		 */
		updatePreset: (updatedPreset: HeaderPreset) => {
			update((presets) => {
				const newPresets = presets.map((p) => (p.id === updatedPreset.id ? updatedPreset : p));
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
				}
				logger.debug(`Header preset updated: ${updatedPreset.name}`);
				return newPresets;
			});
		}
	};
}

export const headerPresetsStore = createHeaderPresetsStore();
