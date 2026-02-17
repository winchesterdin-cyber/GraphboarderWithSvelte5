import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	configureLogger,
	createChildLogger,
	createTraceId,
	getLoggerConfig,
	getLogLevelThreshold,
	getTraceIdFromHeaders,
	logEvent,
	normalizeForLogging,
	resetLoggerConfig,
	sanitizeSensitiveData,
	setLogLevelThreshold,
	subscribeToLogs,
	TRACE_ID_HEADER,
	withTemporaryLogLevelThreshold
} from './logger';

describe('logger observability helpers', () => {
	const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
	const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

	beforeEach(() => {
		setLogLevelThreshold('debug');
		resetLoggerConfig();
		infoSpy.mockClear();
		debugSpy.mockClear();
	});

	afterEach(() => {
		setLogLevelThreshold('debug');
		resetLoggerConfig();
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

	it('supports temporary threshold overrides', () => {
		setLogLevelThreshold('error');
		withTemporaryLogLevelThreshold('debug', () => {
			logEvent('debug', 'inside-window');
		});

		expect(debugSpy).toHaveBeenCalledTimes(1);
		expect(getLogLevelThreshold()).toBe('error');
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

	it('supports configuring redaction behavior', () => {
		configureLogger({ extraSensitiveKeys: ['credential'], redactionPlaceholder: '[MASKED]' });
		const sanitized = sanitizeSensitiveData({ clientCredential: 'x', nested: { secret: 'y' } });

		expect(sanitized).toEqual({ clientCredential: '[MASKED]', nested: { secret: '[MASKED]' } });
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

	it('applies max depth and max string constraints during normalization', () => {
		configureLogger({ maxDepth: 2, maxStringLength: 10 });

		const normalized = normalizeForLogging({
			message: 'x'.repeat(120),
			nested: { deeper: { value: 'end' } }
		}) as Record<string, unknown>;

		expect(normalized.message).toBe(`${'x'.repeat(10)}…[truncated]`);
		expect(normalized.nested).toEqual({ deeper: '[MaxDepthExceeded]' });
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

	it('notifies subscribers with structured events and supports unsubscribe', () => {
		const subscriber = vi.fn();
		const unsubscribe = subscribeToLogs(subscriber);
		logEvent('info', 'first', { feature: 'subscribed' });
		unsubscribe();
		logEvent('info', 'second', { feature: 'subscribed' });

		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(subscriber.mock.calls[0]?.[0]).toMatchObject({
			message: 'first',
			sequence: expect.any(Number)
		});
	});

	it('returns logger configuration snapshot', () => {
		configureLogger({ maxDepth: 3 });
		expect(getLoggerConfig()).toMatchObject({ maxDepth: 3, redactionPlaceholder: '[REDACTED]' });
	});
});
