import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { addRevision, restoreLatestRevision, revisionHistory } from './revisionStore';

describe('revisionStore', () => {
	it('adds and restores latest revision', () => {
		revisionHistory.set([]);
		addRevision('resource-1', { n: 1 });
		const latest = restoreLatestRevision('resource-1');
		expect(get(revisionHistory)).toHaveLength(1);
		expect((latest?.payload as { n: number }).n).toBe(1);
	});
});
