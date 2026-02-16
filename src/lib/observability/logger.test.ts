import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createChildLogger,
	createTraceId,
	getLogLevelThreshold,
	getTraceIdFromHeaders,
	logEvent,
	normalizeForLogging,
	sanitizeSensitiveData,
	setLogLevelThreshold,
	TRACE_ID_HEADER
} from './logger';

describe('logger observability helpers', () => {
	const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
	const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

	beforeEach(() => {
		setLogLevelThreshold('debug');
		infoSpy.mockClear();
		debugSpy.mockClear();
	});

	afterEach(() => {
		setLogLevelThreshold('debug');
	});

	it('creates a trace id when missing', () => {
		expect(createTraceId()).toBeTruthy();
	});

	it('uses incoming trace id when present', () => {
		const headers = new Headers([[TRACE_ID_HEADER, 'trace-123']]);
		expect(getTraceIdFromHeaders(headers)).toBe('trace-123');
	});

	it('supports changing and reading log level threshold', () => {
		setLogLevelThreshold('warn');
		expect(getLogLevelThreshold()).toBe('warn');
		logEvent('info', 'suppressed');
		expect(infoSpy).not.toHaveBeenCalled();
	});

	it('sanitizes sensitive fields recursively', () => {
		const sanitized = sanitizeSensitiveData({
			authorization: 'Bearer abc',
			nested: { token: 'secret' },
			list: [{ password: 'abc' }]
		});

		expect(sanitized).toEqual({
			authorization: '[REDACTED]',
			nested: { token: '[REDACTED]' },
			list: [{ password: '[REDACTED]' }]
		});
	});

	it('normalizes complex values for log safety', () => {
		const input: Record<string, unknown> = {
			error: new Error('boom'),
			map: new Map([['k', 1]]),
			set: new Set(['a']),
			big: 3n
		};
		input.self = input;

		const normalized = normalizeForLogging(input) as Record<string, unknown>;
		expect(normalized.error).toMatchObject({ message: 'boom' });
		expect(normalized.map).toEqual({ type: 'Map', entries: [['k', 1]] });
		expect(normalized.set).toEqual({ type: 'Set', values: ['a'] });
		expect(normalized.big).toBe('3');
		expect(normalized.self).toBe('[Circular]');
	});

	it('creates child loggers that merge base context', () => {
		const child = createChildLogger({ feature: 'history' });
		child.info('event', { traceId: 'trace-1' });
		expect(infoSpy).toHaveBeenCalledTimes(1);

		const payload = infoSpy.mock.calls[0]?.[1] as Record<string, unknown>;
		expect(payload.feature).toBe('history');
		expect(payload.traceId).toBe('trace-1');
	});

	it('emits debug events when threshold allows it', () => {
		logEvent('debug', 'debug-message', { feature: 'test' });
		expect(debugSpy).toHaveBeenCalledTimes(1);
	});
});
