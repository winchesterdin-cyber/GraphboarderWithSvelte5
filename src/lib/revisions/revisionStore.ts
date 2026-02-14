import { writable } from 'svelte/store';

/**
 * Revision history tracking for editable resources.
 */
export interface Revision<T = unknown> {
	id: string;
	resourceId: string;
	createdAt: string;
	payload: T;
}

export const revisionHistory = writable<Revision[]>([]);

export const addRevision = <T>(resourceId: string, payload: T): void => {
	revisionHistory.update((items) => [
		{
			id: crypto.randomUUID(),
			resourceId,
			createdAt: new Date().toISOString(),
			payload
		},
		...items
	]);
};

export const restoreLatestRevision = (resourceId: string): Revision | undefined => {
	let latest: Revision | undefined;
	revisionHistory.update((items) => {
		latest = items.find((item) => item.resourceId === resourceId);
		return items;
	});
	return latest;
};
