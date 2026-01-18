import { derived, get, writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import { localEndpoints } from '$lib/stores/testData/testEndpoints';
import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
import type { AvailableEndpoint } from '$lib/types';
import { browser } from '$app/environment';

// Helper to safely parse JSON from localStorage if needed, though persisted store handles it.
// We use a separate store for user endpoints to keep them distinct from hardcoded ones.
export const userEndpoints = persisted<AvailableEndpoint[]>('userEndpoints', []);

// We also need to support the legacy 'endpoints' key from localStorage if it exists and migrate it or use it.
// The current implementation uses 'endpoints' key directly.
// To avoid breaking changes, we can try to read from 'endpoints' if 'userEndpoints' is empty,
// or just stick to 'endpoints' key but use persisted store.
// Given the memory "Data persistence for endpoints is handled using the svelte-persisted-store library",
// but the code showed direct localStorage access, I will standardize on 'endpoints' key to keep data.
// But wait, the code used 'localStorageEndpoints' key in +layout.svelte with persisted store.
// And +page.svelte read 'endpoints'.
// I will use 'localStorageEndpoints' as the key for the persisted store to match +layout.svelte.

export const localStorageEndpoints = persisted<AvailableEndpoint[]>('localStorageEndpoints', []);

// If we want to import data from the raw 'endpoints' key (legacy), we could do it once.
if (browser) {
    const legacyEndpoints = localStorage.getItem('endpoints');
    if (legacyEndpoints) {
        try {
            const parsed = JSON.parse(legacyEndpoints);
            if (Array.isArray(parsed) && parsed.length > 0) {
                 // Check if we already have them in localStorageEndpoints
                 const current = get(localStorageEndpoints);
                 if (current.length === 0) {
                     localStorageEndpoints.set(parsed);
                 }
            }
        } catch (e) {
            console.error('Failed to parse legacy endpoints', e);
        }
    }
}

export const endpoints = derived(localStorageEndpoints, ($localStorageEndpoints) => {
    // Merge localEndpoints and localStorageEndpoints
    // We prioritize localStorageEndpoints if there are conflicts (though IDs should be unique)
    // The original logic filtered out localEndpoints if they were in localStorage.
    // "endpointsFromLocalStorage.filter((e) => !localEndpoints.find((le) => le.id === e.id))"
    // Wait, the original logic was:
    /*
        let mergedEndpoints = [
            ...localEndpoints,
            ...endpointsFromLocalStorage.filter(
                (e) => !localEndpoints.find((le) => le.id === e.id)
            )
        ];
    */
    // This means if I have a local endpoint 'A' and a local storage endpoint 'A', I keep the local one?
    // "filter((e) => !localEndpoints.find((le) => le.id === e.id))" removes 'A' from localStorage list if 'A' is in localEndpoints.
    // So localEndpoints take precedence? That seems odd if I want to override a local endpoint.
    // But maybe the intent is to avoid duplicates.

    // However, usually user data should override default data.
    // But let's stick to existing logic: filter out user endpoints that collide with local endpoints.

    const userUniqueEndpoints = $localStorageEndpoints.filter(
        (e) => !localEndpoints.find((le) => le.id === e.id)
    );

    const merged = [...localEndpoints, ...userUniqueEndpoints];
    // Cast to any because getSortedAndOrderedEndpoints expects {id: number} but IDs are strings.
    // The function actually works with strings too.
    return getSortedAndOrderedEndpoints(merged as any);
});

export const addEndpoint = (endpoint: AvailableEndpoint) => {
    localStorageEndpoints.update((current) => {
        // Remove existing if any (update)
        const filtered = current.filter(e => e.id !== endpoint.id);
        return [...filtered, endpoint];
    });
};

export const removeEndpoint = (id: string) => {
    localStorageEndpoints.update((current) => {
        return current.filter(e => e.id !== id);
    });
};
