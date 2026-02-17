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

export interface LoggerConfig {
	/** Number of characters to keep before truncating string values for safer log payloads. */
	maxStringLength: number;
	/** Maximum recursion depth for normalization to avoid deeply nested payload overhead. */
	maxDepth: number;
	/** Replacement used when sensitive values are redacted. */
	redactionPlaceholder: string;
	/** Extra sensitive key names or key fragments. */
	extraSensitiveKeys: string[];
}

export interface StructuredLogEvent {
	timestamp: string;
	level: LogLevel;
	message: string;
	sequence: number;
	[key: string]: unknown;
}

export type LogSubscriber = (event: StructuredLogEvent) => void;

const TRACE_ID_HEADER = 'x-trace-id';
const REDACTED_VALUE = '[REDACTED]';
const TRUNCATED_SUFFIX = '…[truncated]';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40
};

/**
 * Security-sensitive keys that should never be emitted in clear text.
 */
const BASE_SENSITIVE_KEYS = [
	'password',
	'token',
	'authorization',
	'auth',
	'secret',
	'apiKey',
	'accessToken',
	'refreshToken'
];

// Pre-normalize base sensitive keys to avoid repeated array allocations during deep sanitization passes.
const BASE_SENSITIVE_KEYS_NORMALIZED = new Set(
	BASE_SENSITIVE_KEYS.map((entry) => entry.toLowerCase())
);

const loggerConfig: LoggerConfig = {
	maxStringLength: 3_000,
	maxDepth: 6,
	redactionPlaceholder: REDACTED_VALUE,
	extraSensitiveKeys: []
};

const subscribers = new Set<LogSubscriber>();
let currentLogLevelThreshold: LogLevel = 'debug';
let logSequence = 0;

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

/**
 * Returns readonly runtime logger configuration for diagnostics and tests.
 */
export const getLoggerConfig = (): Readonly<LoggerConfig> => ({ ...loggerConfig });

/**
 * Applies partial logger configuration updates.
 */
export const configureLogger = (partialConfig: Partial<LoggerConfig>): void => {
	if (partialConfig.maxStringLength !== undefined) {
		// Keep this configurable down to 1 so tests and low-noise environments can intentionally tighten payload limits.
		loggerConfig.maxStringLength = Math.max(1, Math.floor(partialConfig.maxStringLength));
	}
	if (partialConfig.maxDepth !== undefined) {
		loggerConfig.maxDepth = Math.max(1, Math.floor(partialConfig.maxDepth));
	}
	if (partialConfig.redactionPlaceholder !== undefined) {
		loggerConfig.redactionPlaceholder = partialConfig.redactionPlaceholder;
	}
	if (partialConfig.extraSensitiveKeys !== undefined) {
		loggerConfig.extraSensitiveKeys = partialConfig.extraSensitiveKeys;
	}
};

/**
 * Restores predictable defaults used by most app paths and tests.
 */
export const resetLoggerConfig = (): void => {
	loggerConfig.maxStringLength = 3_000;
	loggerConfig.maxDepth = 6;
	loggerConfig.redactionPlaceholder = REDACTED_VALUE;
	loggerConfig.extraSensitiveKeys = [];
};

/**
 * Allows instrumentation hooks (for tests or diagnostics) to observe emitted logs.
 */
export const subscribeToLogs = (subscriber: LogSubscriber): (() => void) => {
	subscribers.add(subscriber);
	return () => {
		subscribers.delete(subscriber);
	};
};

/**
 * Temporarily raises/lower the log threshold for bounded operations.
 */
export const withTemporaryLogLevelThreshold = <T>(level: LogLevel, execute: () => T): T => {
	const previous = currentLogLevelThreshold;
	setLogLevelThreshold(level);
	try {
		return execute();
	} finally {
		setLogLevelThreshold(previous);
	}
};

const shouldLog = (level: LogLevel): boolean =>
	LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevelThreshold];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	Object.prototype.toString.call(value) === '[object Object]';

const truncateString = (value: string): string => {
	if (value.length <= loggerConfig.maxStringLength) {
		return value;
	}
	return `${value.slice(0, loggerConfig.maxStringLength)}${TRUNCATED_SUFFIX}`;
};

/**
 * Converts complex runtime values into JSON-safe representations for logs.
 */
export const normalizeForLogging = (
	value: unknown,
	seen = new WeakSet<object>(),
	depth = 0
): unknown => {
	if (value === null || value === undefined) return value;

	if (depth >= loggerConfig.maxDepth) {
		return '[MaxDepthExceeded]';
	}

	if (typeof value === 'string') return truncateString(value);
	if (typeof value === 'bigint') return value.toString();
	if (typeof value === 'symbol') return value.toString();
	if (typeof value === 'function') return `[Function:${value.name || 'anonymous'}]`;

	if (value instanceof Error) {
		return {
			name: value.name,
			message: truncateString(value.message),
			stack: value.stack ? truncateString(value.stack) : undefined
		};
	}

	if (value instanceof Date) return value.toISOString();

	if (value instanceof Map) {
		return {
			type: 'Map',
			entries: Array.from(value.entries()).map(([key, mapValue]) => [
				normalizeForLogging(key, seen, depth + 1),
				normalizeForLogging(mapValue, seen, depth + 1)
			])
		};
	}

	if (value instanceof Set) {
		return {
			type: 'Set',
			values: Array.from(value.values()).map((setValue) =>
				normalizeForLogging(setValue, seen, depth + 1)
			)
		};
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeForLogging(item, seen, depth + 1));
	}

	if (typeof value === 'object') {
		if (seen.has(value as object)) return '[Circular]';
		seen.add(value as object);

		if (isPlainObject(value)) {
			return Object.fromEntries(
				Object.entries(value).map(([key, objectValue]) => [
					key,
					normalizeForLogging(objectValue, seen, depth + 1)
				])
			);
		}

		return String(value);
	}

	return value;
};

const keyIsSensitive = (key: string): boolean => {
	const normalizedKey = key.toLowerCase();
	if (BASE_SENSITIVE_KEYS_NORMALIZED.has(normalizedKey)) {
		return true;
	}

	return loggerConfig.extraSensitiveKeys.some((entry) =>
		normalizedKey.includes(entry.toLowerCase())
	);
};

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
				keyIsSensitive(key) ? loggerConfig.redactionPlaceholder : sanitizeSensitiveData(entryValue)
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

	const structuredPayload = sanitizeSensitiveData({
		timestamp: new Date().toISOString(),
		level,
		message,
		sequence: ++logSequence,
		...context
	}) as StructuredLogEvent;
	const payload = normalizeForLogging(structuredPayload) as StructuredLogEvent;

	for (const subscriber of subscribers) {
		subscriber(payload);
	}

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
