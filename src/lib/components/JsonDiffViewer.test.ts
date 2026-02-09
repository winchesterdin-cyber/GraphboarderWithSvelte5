import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import JsonDiffViewer from './JsonDiffViewer.svelte';

describe('JsonDiffViewer', () => {
	it('renders unchanged content', () => {
		const left = { a: 1 };
		const right = { a: 1 };
		const { container } = render(JsonDiffViewer, { props: { left, right } });

		// Use more relaxed text matching as diffJson might split things
		expect(container.textContent).toContain('"a": 1');

		// No added/removed classes
		const added = container.querySelectorAll('.bg-success\\/30');
		const removed = container.querySelectorAll('.bg-error\\/30');
		expect(added.length).toBe(0);
		expect(removed.length).toBe(0);
	});

	it('renders differences', () => {
		const left = { a: 1 };
		const right = { a: 2 };
		const { container } = render(JsonDiffViewer, { props: { left, right } });

		// Should show removal of 1 and addition of 2
		const added = container.querySelectorAll('.bg-success\\/30');
		const removed = container.querySelectorAll('.bg-error\\/30');

		expect(added.length).toBeGreaterThan(0);
		expect(removed.length).toBeGreaterThan(0);

		// Check content
		expect(Array.from(removed).some((el) => el.textContent?.includes('1'))).toBe(true);
		expect(Array.from(added).some((el) => el.textContent?.includes('2'))).toBe(true);
	});

	it('handles string input', () => {
		const left = '{"a": 1}';
		const right = '{"a": 2}';
		const { container } = render(JsonDiffViewer, { props: { left, right } });

		const added = container.querySelectorAll('.bg-success\\/30');
		const removed = container.querySelectorAll('.bg-error\\/30');
		expect(added.length).toBeGreaterThan(0);
		expect(removed.length).toBeGreaterThan(0);
	});
});
