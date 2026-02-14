/**
 * Centralized observability utilities.
 * These helpers provide structured logs with trace-id correlation to support faster debugging.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
	traceId?: string;
	feature?: string;
	[key: string]: unknown;
}

const TRACE_ID_HEADER = 'x-trace-id';

/**
 * Creates a short correlation identifier.
 * NOTE: This intentionally uses crypto.randomUUID when available for globally unique IDs.
 */
export const createTraceId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Extracts trace id from request headers and creates one when missing.
 */
export const getTraceIdFromHeaders = (headers: Headers): string =>
	headers.get(TRACE_ID_HEADER) ?? createTraceId();

/**
 * Logs structured payloads so log aggregators can parse events consistently.
 */
export const logEvent = (level: LogLevel, message: string, context: LogContext = {}): void => {
	const payload = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...context
	};

	if (level === 'error') {
		console.error('[Graphboarder]', payload);
		return;
	}

	if (level === 'warn') {
		console.warn('[Graphboarder]', payload);
		return;
	}

	if (level === 'debug') {
		console.debug('[Graphboarder]', payload);
		return;
	}

	console.info('[Graphboarder]', payload);
};

export { TRACE_ID_HEADER };
