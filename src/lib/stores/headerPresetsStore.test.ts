import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { headerPresetsStore } from './headerPresetsStore';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock
});

describe('headerPresetsStore', () => {
	beforeEach(() => {
		localStorage.clear();
		// Clear existing items
		const presets = get(headerPresetsStore);
		presets.forEach((p) => headerPresetsStore.removePreset(p.id));
	});

	it('should start with an empty list', () => {
		const presets = get(headerPresetsStore);
		expect(presets).toEqual([]);
	});

	it('should add a preset', () => {
		const preset = {
			id: '1',
			name: 'Test Preset',
			headers: { Authorization: 'Bearer test' }
		};
		headerPresetsStore.addPreset(preset);

		const presets = get(headerPresetsStore);
		expect(presets).toHaveLength(1);
		expect(presets[0]).toEqual(preset);
	});

	it('should remove a preset', () => {
		const preset = {
			id: '1',
			name: 'Test Preset',
			headers: { Authorization: 'Bearer test' }
		};
		headerPresetsStore.addPreset(preset);

		headerPresetsStore.removePreset('1');

		const presets = get(headerPresetsStore);
		expect(presets).toHaveLength(0);
	});

	it('should update a preset', () => {
		const preset = {
			id: '1',
			name: 'Test Preset',
			headers: { Authorization: 'Bearer test' }
		};
		headerPresetsStore.addPreset(preset);

		const updatedPreset = {
			...preset,
			name: 'Updated Preset'
		};
		headerPresetsStore.updatePreset(updatedPreset);

		const presets = get(headerPresetsStore);
		expect(presets).toHaveLength(1);
		expect(presets[0].name).toBe('Updated Preset');
	});
});
