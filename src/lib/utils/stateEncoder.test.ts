import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from './stateEncoder';

describe('stateEncoder', () => {
	it('should encode and decode a simple object', () => {
		const state = { a: 1, b: 'test' };
		const encoded = encodeState(state);
		expect(encoded).toBeTruthy();
		const decoded = decodeState(encoded);
		expect(decoded).toEqual(state);
	});

	it('should handle Unicode characters', () => {
		const state = { text: 'こんにちは world 🌍' };
		const encoded = encodeState(state);
		const decoded = decodeState(encoded);
		expect(decoded).toEqual(state);
	});

	it('should handle nested objects and arrays', () => {
		const state = {
			args: { filter: { name: 'test' } },
			cols: [{ id: 'col1', visible: true }]
		};
		const encoded = encodeState(state);
		const decoded = decodeState(encoded);
		expect(decoded).toEqual(state);
	});

	it('should return null for invalid encoded string', () => {
		const decoded = decodeState('invalid-base64-string');
		expect(decoded).toBeNull(); // JSON.parse might throw, decodeState catches it
	});
});
