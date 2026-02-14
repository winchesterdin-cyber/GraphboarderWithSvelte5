import { describe, expect, it } from 'vitest';
import { findMissingLocaleKeys } from './localeWorkflow';

describe('locale workflow', () => {
	it('returns missing keys', () => {
		const missing = findMissingLocaleKeys({ a: 'A', b: 'B' }, { a: 'A' });
		expect(missing).toEqual(['b']);
	});
});
