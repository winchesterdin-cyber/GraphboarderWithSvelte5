import { writable } from 'svelte/store';

/**
 * Notification center state with read/unread and channel metadata.
 */
export interface NotificationItem {
	id: string;
	title: string;
	message: string;
	channel: 'in-app' | 'email' | 'webhook';
	read: boolean;
	createdAt: string;
}

export const notificationCenter = writable<NotificationItem[]>([]);

export const pushNotification = (
	title: string,
	message: string,
	channel: NotificationItem['channel'] = 'in-app'
): void => {
	notificationCenter.update((items) => [
		{
			id: crypto.randomUUID(),
			title,
			message,
			channel,
			read: false,
			createdAt: new Date().toISOString()
		},
		...items
	]);
};
