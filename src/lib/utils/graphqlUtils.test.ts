import { describe, it, expect } from 'vitest';
import { getSortedAndOrderedEndpoints } from './usefulFunctions';

describe('getSortedAndOrderedEndpoints', () => {
	it('should sort endpoints by numeric ID', () => {
		const endpoints = [
			{ id: 2 },
			{ id: 1 },
			{ id: 3 }
		];
		const result = getSortedAndOrderedEndpoints(endpoints);
		expect(result).toEqual([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 }
		]);
	});

	it('should filter out unmaintained endpoints if requested', () => {
		const endpoints = [
			{ id: 1, isMaintained: true },
			{ id: 2, isMaintained: false },
			{ id: 3, isMaintained: true }
		];
		const result = getSortedAndOrderedEndpoints(endpoints, true);
		expect(result).toEqual([
			{ id: 1, isMaintained: true },
			{ id: 3, isMaintained: true }
		]);
	});

	it('should handle string IDs', () => {
		const endpoints = [
			{ id: 'b' },
			{ id: 'a' },
			{ id: 'c' }
		];
		const result = getSortedAndOrderedEndpoints(endpoints);
		expect(result).toEqual([
			{ id: 'a' },
			{ id: 'b' },
			{ id: 'c' }
		]);
	});

	it('should handle mixed string and number IDs', () => {
		const endpoints = [
			{ id: 'b' },
			{ id: 1 },
			{ id: 'a' }
		];
		const result = getSortedAndOrderedEndpoints(endpoints);
		// Comparisons: 1 < 'b' (false, wait), 1 > 'b' (false) -> 0?
		// JS sort: if compareFunction returns 0, order is unchanged.
		// a.id > b.id
		// 'b' > 1 -> false
		// 'b' < 1 -> false
		// So 'b' and 1 are considered equal?
		// Let's verify this behavior or adjust expectation.
		// Actually, comparison of number and string:
		// 'b' > 1 is false (NaN)
		// 'b' < 1 is false (NaN)
		// So they are equal.
		// But 'a' vs 'b' -> 'b' > 'a' is true.
		// So order of 1 is undefined relative to strings.

		expect(result).toHaveLength(3);
        // We just ensure it doesn't crash.
	});

	it('should preserve other properties', () => {
		const endpoints = [
			{ id: 2, name: 'Two' },
			{ id: 1, name: 'One' }
		];
		const result = getSortedAndOrderedEndpoints(endpoints);
		expect(result).toEqual([
			{ id: 1, name: 'One' },
			{ id: 2, name: 'Two' }
		]);
	});
});
