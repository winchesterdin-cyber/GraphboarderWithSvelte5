import { describe, expect, it } from 'vitest';
import { telemetryOptedOut } from './telemetry';

describe('telemetry', () => {
	it('is not opted-out by default in test runtime', () => {
		expect(telemetryOptedOut()).toBe(false);
	});
});
