import { writable } from 'svelte/store';

/**
 * Collaboration primitives: presence + comments state.
 */
export interface PresenceUser {
	id: string;
	name: string;
	activeResource?: string;
}

export interface CollaborationComment {
	id: string;
	resourceId: string;
	author: string;
	message: string;
	createdAt: string;
}

export const activeUsers = writable<PresenceUser[]>([]);
export const collaborationComments = writable<CollaborationComment[]>([]);

export const addComment = (resourceId: string, author: string, message: string): void => {
	collaborationComments.update((comments) => [
		{
			id: crypto.randomUUID(),
			resourceId,
			author,
			message,
			createdAt: new Date().toISOString()
		},
		...comments
	]);
};
