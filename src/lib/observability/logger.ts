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

export interface ChildLogger {
	debug: (message: string, context?: LogContext) => void;
	info: (message: string, context?: LogContext) => void;
	warn: (message: string, context?: LogContext) => void;
	error: (message: string, context?: LogContext) => void;
	log: (level: LogLevel, message: string, context?: LogContext) => void;
}

const TRACE_ID_HEADER = 'x-trace-id';
const REDACTED_VALUE = '[REDACTED]';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40
};

/**
 * Security-sensitive keys that should never be emitted in clear text.
 */
const SENSITIVE_KEYS = new Set([
	'password',
	'token',
	'authorization',
	'auth',
	'secret',
	'apiKey',
	'accessToken',
	'refreshToken'
]);

let currentLogLevelThreshold: LogLevel = 'debug';

/**
 * Creates a short correlation identifier.
 * NOTE: This intentionally uses crypto.randomUUID when available for globally unique IDs.
 */
export const createTraceId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	// Fallback keeps a deterministic prefix for easier log filtering.
	return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

/**
 * Extracts trace id from request headers and creates one when missing.
 */
export const getTraceIdFromHeaders = (headers: Headers): string =>
	headers.get(TRACE_ID_HEADER) ?? createTraceId();

/**
 * Controls which log levels are emitted. Lower-priority logs are dropped.
 */
export const setLogLevelThreshold = (level: LogLevel): void => {
	currentLogLevelThreshold = level;
};

export const getLogLevelThreshold = (): LogLevel => currentLogLevelThreshold;

const shouldLog = (level: LogLevel): boolean =>
	LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevelThreshold];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	Object.prototype.toString.call(value) === '[object Object]';

/**
 * Converts complex runtime values into JSON-safe representations for logs.
 */
export const normalizeForLogging = (value: unknown, seen = new WeakSet<object>()): unknown => {
	if (value === null || value === undefined) return value;

	if (typeof value === 'bigint') return value.toString();
	if (typeof value === 'symbol') return value.toString();
	if (typeof value === 'function') return `[Function:${value.name || 'anonymous'}]`;

	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack
		};
	}

	if (value instanceof Date) return value.toISOString();

	if (value instanceof Map) {
		return {
			type: 'Map',
			entries: Array.from(value.entries()).map(([key, mapValue]) => [
				normalizeForLogging(key, seen),
				normalizeForLogging(mapValue, seen)
			])
		};
	}

	if (value instanceof Set) {
		return {
			type: 'Set',
			values: Array.from(value.values()).map((setValue) => normalizeForLogging(setValue, seen))
		};
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeForLogging(item, seen));
	}

	if (typeof value === 'object') {
		if (seen.has(value as object)) return '[Circular]';
		seen.add(value as object);

		if (isPlainObject(value)) {
			return Object.fromEntries(
				Object.entries(value).map(([key, objectValue]) => [
					key,
					normalizeForLogging(objectValue, seen)
				])
			);
		}

		return String(value);
	}

	return value;
};

const keyIsSensitive = (key: string): boolean => SENSITIVE_KEYS.has(key.toLowerCase());

/**
 * Redacts sensitive keys recursively so payloads remain privacy-safe.
 */
export const sanitizeSensitiveData = <T>(value: T): T => {
	if (value === null || value === undefined) return value;

	if (Array.isArray(value)) {
		return value.map((entry) => sanitizeSensitiveData(entry)) as T;
	}

	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, entryValue]) => [
				key,
				keyIsSensitive(key) ? REDACTED_VALUE : sanitizeSensitiveData(entryValue)
			])
		) as T;
	}

	return value;
};

/**
 * Logs structured payloads so log aggregators can parse events consistently.
 */
export const logEvent = (level: LogLevel, message: string, context: LogContext = {}): void => {
	if (!shouldLog(level)) {
		return;
	}

	const payload = normalizeForLogging(
		sanitizeSensitiveData({
			timestamp: new Date().toISOString(),
			level,
			message,
			...context
		})
	);

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

/**
 * Creates a logger that always includes base context for a subsystem/feature.
 */
export const createChildLogger = (baseContext: LogContext): ChildLogger => ({
	log: (level, message, context = {}) => logEvent(level, message, { ...baseContext, ...context }),
	debug: (message, context = {}) => logEvent('debug', message, { ...baseContext, ...context }),
	info: (message, context = {}) => logEvent('info', message, { ...baseContext, ...context }),
	warn: (message, context = {}) => logEvent('warn', message, { ...baseContext, ...context }),
	error: (message, context = {}) => logEvent('error', message, { ...baseContext, ...context })
});

export { TRACE_ID_HEADER };
