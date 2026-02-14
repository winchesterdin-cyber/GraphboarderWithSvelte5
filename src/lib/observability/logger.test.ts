import { describe, expect, it } from 'vitest';
import { createTraceId, getTraceIdFromHeaders, TRACE_ID_HEADER } from './logger';

describe('logger observability helpers', () => {
	it('creates a trace id when missing', () => {
		expect(createTraceId()).toBeTruthy();
	});

	it('uses incoming trace id when present', () => {
		const headers = new Headers([[TRACE_ID_HEADER, 'trace-123']]);
		expect(getTraceIdFromHeaders(headers)).toBe('trace-123');
	});
});
