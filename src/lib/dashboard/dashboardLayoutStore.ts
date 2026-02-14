import { writable } from 'svelte/store';

/**
 * Dashboard widget layout persistence store.
 */
export interface DashboardWidget {
	id: string;
	title: string;
	order: number;
	enabled: boolean;
}

const STORAGE_KEY = 'graphboarder.dashboard.widgets';
const defaultWidgets: DashboardWidget[] = [
	{ id: 'recent-queries', title: 'Recent Queries', order: 1, enabled: true },
	{ id: 'favorites', title: 'Favorites', order: 2, enabled: true },
	{ id: 'notifications', title: 'Notifications', order: 3, enabled: true }
];

const loadWidgets = (): DashboardWidget[] => {
	if (typeof window === 'undefined') return defaultWidgets;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return defaultWidgets;
	try {
		return JSON.parse(raw);
	} catch (error) {
		console.warn('[Dashboard] Could not parse widgets', error);
		return defaultWidgets;
	}
};

export const dashboardWidgets = writable<DashboardWidget[]>(loadWidgets());
dashboardWidgets.subscribe((value) => {
	if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});
