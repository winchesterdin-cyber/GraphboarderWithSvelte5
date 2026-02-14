import { browser } from '$app/environment';
import { writable } from 'svelte/store';

/**
 * Feature flag registry for controlled rollouts.
 * Browser overrides are stored in localStorage for QA convenience.
 */
export type FeatureFlag =
	| 'observability_v1'
	| 'error_recovery_v1'
	| 'rbac_v1'
	| 'offline_queue_v1'
	| 'a11y_uplift_v1';

const defaultFlags: Record<FeatureFlag, boolean> = {
	observability_v1: true,
	error_recovery_v1: true,
	rbac_v1: false,
	offline_queue_v1: false,
	a11y_uplift_v1: true
};

const STORAGE_KEY = 'graphboarder.featureFlags';

const getInitialFlags = (): Record<FeatureFlag, boolean> => {
	if (!browser) {
		return defaultFlags;
	}

	const storedValue = localStorage.getItem(STORAGE_KEY);
	if (!storedValue) {
		return defaultFlags;
	}

	try {
		return {
			...defaultFlags,
			...JSON.parse(storedValue)
		};
	} catch (error) {
		console.warn('[FeatureFlags] Unable to parse stored flags', error);
		return defaultFlags;
	}
};

export const featureFlags = writable<Record<FeatureFlag, boolean>>(getInitialFlags());

featureFlags.subscribe((value) => {
	if (!browser) {
		return;
	}

	localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});

export const isFeatureEnabled = (flags: Record<FeatureFlag, boolean>, flag: FeatureFlag): boolean =>
	Boolean(flags[flag]);
