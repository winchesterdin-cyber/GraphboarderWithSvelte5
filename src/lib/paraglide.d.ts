/**
 * Paraglide type stubs for tooling.
 * Vite generates the runtime implementations during dev/build.
 */
declare module '$lib/paraglide/runtime' {
	export function deLocalizeUrl(url: string | URL): URL;
	export function setLocale(locale: string): void;
}

declare module '$lib/paraglide/server' {
	export function paraglideMiddleware(
		request: Request,
		handler: (context: { request: Request; locale: string }) => Response | Promise<Response>
	): Response | Promise<Response>;
}

declare module '$lib/paraglide/messages.js' {
	export const m: Record<string, (vars?: Record<string, unknown>) => string>;
}
