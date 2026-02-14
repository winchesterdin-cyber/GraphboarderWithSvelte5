import { describe, expect, it } from 'vitest';
import { hasSchemaDrift } from './schemaContract';

describe('schemaContract', () => {
	it('detects schema drift when payload changes', () => {
		expect(hasSchemaDrift({ a: 1 }, { a: 2 })).toBe(true);
		expect(hasSchemaDrift({ a: 1 }, { a: 1 })).toBe(false);
	});
});
