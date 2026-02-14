import { writable } from 'svelte/store';

/**
 * Onboarding state store with persistence to allow skip/resume behavior.
 */
const STORAGE_KEY = 'graphboarder.onboarding';

export interface OnboardingState {
	completed: boolean;
	step: number;
}

const defaultState: OnboardingState = { completed: false, step: 0 };

const initialState = (): OnboardingState => {
	if (typeof window === 'undefined') return defaultState;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return defaultState;
	try {
		return { ...defaultState, ...JSON.parse(raw) };
	} catch (error) {
		console.warn('[Onboarding] Could not parse state', error);
		return defaultState;
	}
};

export const onboardingState = writable<OnboardingState>(initialState());
onboardingState.subscribe((value) => {
	if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});
