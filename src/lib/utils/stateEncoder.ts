import { logger } from '$lib/utils/logger';

/**
 * Encodes a state object into a URL-safe Base64 string.
 * Handles Unicode characters correctly.
 * @param state The state object to encode.
 * @returns The encoded string.
 */
export function encodeState(state: any): string {
	try {
		const json = JSON.stringify(state);
		// Encode URI components to handle Unicode, then regex replace to convert to solid bytes
		const encoded = btoa(
			encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
				return String.fromCharCode(parseInt('0x' + p1));
			})
		);
		return encoded;
	} catch (e) {
		logger.debug('Error encoding state', { error: e });
		return '';
	}
}

/**
 * Decodes a URL-safe Base64 string back into a state object.
 * Handles Unicode characters correctly.
 * @param encoded The encoded string.
 * @returns The decoded state object, or null if decoding fails.
 */
export function decodeState(encoded: string): any {
	try {
		// Decode from Base64 to bytes, then URI decode to get back Unicode
		const decoded = decodeURIComponent(
			atob(encoded)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);
		return JSON.parse(decoded);
	} catch (e) {
		logger.debug('Error decoding state', { error: e });
		return null;
	}
}
