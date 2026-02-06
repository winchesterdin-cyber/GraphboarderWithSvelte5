import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Define localStorage mock
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

// Apply mocks before importing the store
Object.defineProperty(global, 'localStorage', {
	value: localStorageMock
});

vi.mock('$app/environment', () => ({
	browser: true
}));

describe('envVarsStore', () => {
    let envVars: any;

	beforeEach(async () => {
		localStorage.clear();

        // Dynamic import ensures localStorage is defined before store initialization
        const module = await import('./envVarsStore');
        envVars = module.envVars;

        // Clean up store state
        const current = get(envVars);
        Object.keys(current).forEach(key => envVars.removeVar(key));
	});

	it('should start empty', () => {
		const vars = get(envVars);
		expect(vars).toEqual({});
	});

	it('should set and get a variable', () => {
		envVars.setVar('TEST_KEY', 'test_value');
		const vars = get(envVars);
		expect(vars['TEST_KEY']).toBe('test_value');
        // Check localStorage persistence
        const stored = JSON.parse(localStorage.getItem('envVars') || '{}');
        expect(stored['TEST_KEY']).toBe('test_value');
	});

	it('should update an existing variable', () => {
		envVars.setVar('TEST_KEY', 'initial');
		envVars.setVar('TEST_KEY', 'updated');
		const vars = get(envVars);
		expect(vars['TEST_KEY']).toBe('updated');
	});

	it('should remove a variable', () => {
		envVars.setVar('TEST_KEY', 'value');
		envVars.removeVar('TEST_KEY');
		const vars = get(envVars);
		expect(vars['TEST_KEY']).toBeUndefined();
	});

	it('should import variables and merge', () => {
		envVars.setVar('EXISTING', 'old');
        envVars.setVar('KEEP_ME', 'kept');

		const toImport = {
			'EXISTING': 'new',
			'NEW_VAR': 'value'
		};

		envVars.importVars(toImport);

		const vars = get(envVars);
		expect(vars['EXISTING']).toBe('new');
		expect(vars['NEW_VAR']).toBe('value');
        expect(vars['KEEP_ME']).toBe('kept');
	});
});
