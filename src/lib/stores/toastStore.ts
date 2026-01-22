import { writable } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
}

export const toasts = writable<Toast[]>([]);

let nextId = 0;

export const addToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
	const id = nextId++;
	const toast: Toast = { id, message, type, duration };
	toasts.update((all) => [...all, toast]);

	if (duration > 0) {
		setTimeout(() => {
			removeToast(id);
		}, duration);
	}
};

export const removeToast = (id: number) => {
	toasts.update((all) => all.filter((t) => t.id !== id));
};
