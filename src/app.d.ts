// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			traceId: string;
			currentUserRole: 'viewer' | 'editor' | 'admin';
		}
	}
}

declare module 'svelte/elements' {
	export interface HTMLAttributes<T> {
		onclick_outside?: (event: CustomEvent<any>) => void;
	}
}

export {};
