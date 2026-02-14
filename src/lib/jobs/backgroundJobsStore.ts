import { writable } from 'svelte/store';

/**
 * Background jobs store for tracking long-running task progress.
 */
export interface BackgroundJob {
	id: string;
	name: string;
	status: 'queued' | 'running' | 'succeeded' | 'failed';
	progress: number;
	updatedAt: string;
}

export const backgroundJobs = writable<BackgroundJob[]>([]);

export const upsertBackgroundJob = (job: Omit<BackgroundJob, 'updatedAt'>): void => {
	backgroundJobs.update((items) => {
		const next = {
			...job,
			updatedAt: new Date().toISOString()
		};
		const index = items.findIndex((item) => item.id === job.id);
		if (index === -1) return [next, ...items];
		const copy = [...items];
		copy[index] = next;
		return copy;
	});
};
