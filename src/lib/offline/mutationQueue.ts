import { writable } from 'svelte/store';

/**
 * Offline-first mutation queue.
 * Queue entries are persisted in localStorage and can be replayed when network connectivity resumes.
 */
export interface QueuedMutation {
	id: string;
	name: string;
	payload: unknown;
	createdAt: string;
}

const STORAGE_KEY = 'graphboarder.offlineQueue';

const readInitialQueue = (): QueuedMutation[] => {
	if (typeof window === 'undefined') {
		return [];
	}

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return [];
	}

	try {
		return JSON.parse(raw);
	} catch (error) {
		console.warn('[OfflineQueue] failed to parse queue', error);
		return [];
	}
};

export const offlineMutationQueue = writable<QueuedMutation[]>(readInitialQueue());

offlineMutationQueue.subscribe((entries) => {
	if (typeof window === 'undefined') {
		return;
	}

	localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
});

export const enqueueMutation = (name: string, payload: unknown): void => {
	offlineMutationQueue.update((entries) => [
		...entries,
		{
			id: crypto.randomUUID(),
			name,
			payload,
			createdAt: new Date().toISOString()
		}
	]);
};

export const dequeueMutation = (): QueuedMutation | undefined => {
	let item: QueuedMutation | undefined;
	offlineMutationQueue.update((entries) => {
		item = entries[0];
		return entries.slice(1);
	});
	return item;
};
