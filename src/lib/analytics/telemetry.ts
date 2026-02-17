import {
	createChildLogger,
	sanitizeSensitiveData,
	type LogContext
} from '$lib/observability/logger';

/**
 * Privacy-safe telemetry layer.
 * Stores anonymous event payloads with opt-out support.
 */
export interface TelemetryEvent {
	name: string;
	context?: Record<string, unknown>;
	createdAt?: string;
	sessionId?: string;
	category?: string;
	severity?: 'low' | 'medium' | 'high';
}

export interface TelemetryTrackOptions {
	maxEvents?: number;
	dedupeWindowMs?: number;
	now?: number;
	random?: () => number;
}

export interface TelemetryConfig {
	maxEvents: number;
	dedupeWindowMs: number;
	eventTtlMs: number;
	sampleRate: number;
	contextMaxDepth: number;
	allowedEventNames: string[];
	blockedEventNames: string[];
	flushBatchSize: number;
}

export interface TelemetryMeta {
	count: number;
	optedOut: boolean;
	sessionId: string | null;
}

export interface TelemetryHealth extends TelemetryMeta {
	droppedByReason: Record<string, number>;
	lastFlushAt: string | null;
}

const telemetryLogger = createChildLogger({ feature: 'telemetry' });

const STORAGE_KEY = 'graphboarder.telemetry.events';
const OPT_OUT_KEY = 'graphboarder.telemetry.optOut';
const SESSION_ID_KEY = 'graphboarder.telemetry.sessionId';

const telemetryConfig: TelemetryConfig = {
	maxEvents: 100,
	dedupeWindowMs: 2_000,
	eventTtlMs: 7 * 24 * 60 * 60 * 1_000,
	sampleRate: 1,
	contextMaxDepth: 6,
	allowedEventNames: [],
	blockedEventNames: [],
	flushBatchSize: 25
};

const droppedByReason: Record<string, number> = {
	invalid_name: 0,
	invalid_context: 0,
	opted_out: 0,
	storage_unavailable: 0,
	sampled_out: 0,
	not_allowed: 0,
	blocked: 0,
	duplicate: 0,
	expired: 0,
	trimmed: 0,
	flush_failure: 0
};

let lastFlushAt: string | null = null;

const canUseStorage = (): boolean =>
	typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const incrementDropReason = (
	reason: keyof typeof droppedByReason,
	context: LogContext = {}
): void => {
	droppedByReason[reason] += 1;
	telemetryLogger.debug('Telemetry event dropped', {
		reason,
		droppedCount: droppedByReason[reason],
		...context
	});
};

/**
 * Reads storage values safely and emits structured warnings on corruption.
 */
const safeStorageGet = (key: string): string | null => {
	if (!canUseStorage()) return null;

	try {
		return localStorage.getItem(key);
	} catch (error) {
		telemetryLogger.warn('Telemetry storage read failed', { key, error });
		return null;
	}
};

/**
 * Writes storage values safely and emits structured warnings on write failures.
 */
const safeStorageSet = (key: string, value: string): void => {
	if (!canUseStorage()) return;

	try {
		localStorage.setItem(key, value);
	} catch (error) {
		telemetryLogger.warn('Telemetry storage write failed', { key, error });
	}
};

const safeStorageRemove = (key: string): void => {
	if (!canUseStorage()) return;

	try {
		localStorage.removeItem(key);
	} catch (error) {
		telemetryLogger.warn('Telemetry storage remove failed', { key, error });
	}
};

const readStoredEvents = (): TelemetryEvent[] => {
	const raw = safeStorageGet(STORAGE_KEY);
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed as TelemetryEvent[];
	} catch (error) {
		telemetryLogger.warn('Telemetry event payload parse failed; clearing invalid data', { error });
		safeStorageRemove(STORAGE_KEY);
		return [];
	}
};

const stableStringify = (value: unknown): string => {
	if (value === null || value === undefined) return String(value);
	if (typeof value !== 'object') return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;

	const objectValue = value as Record<string, unknown>;
	const keys = Object.keys(objectValue).sort();
	return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(',')}}`;
};

const capDepth = (value: unknown, maxDepth: number, depth = 0): unknown => {
	if (value === null || value === undefined) return value;
	if (depth >= maxDepth) return '[MaxDepthExceeded]';
	if (Array.isArray(value)) return value.map((entry) => capDepth(entry, maxDepth, depth + 1));
	if (typeof value === 'object') {
		const objectValue = value as Record<string, unknown>;
		return Object.fromEntries(
			Object.entries(objectValue).map(([key, item]) => [key, capDepth(item, maxDepth, depth + 1)])
		);
	}
	return value;
};

const validateEventName = (name: string): boolean => /^[a-z0-9_.-]{3,120}$/i.test(name);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	Object.prototype.toString.call(value) === '[object Object]';

const normalizeEventNameList = (names: string[]): string[] =>
	Array.from(
		new Set(
			names
				.filter((name) => typeof name === 'string')
				.map((name) => name.trim())
				.filter((name) => name.length > 0)
		)
	);

/**
 * Generates and persists a telemetry session id for event correlation.
 */
export const getTelemetrySessionId = (): string | null => {
	const existingSessionId = safeStorageGet(SESSION_ID_KEY);
	if (existingSessionId) return existingSessionId;

	if (!canUseStorage()) return null;

	const generatedSessionId =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `telemetry-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

	safeStorageSet(SESSION_ID_KEY, generatedSessionId);
	return generatedSessionId;
};

export const rotateTelemetrySessionId = (): string | null => {
	if (!canUseStorage()) return null;
	safeStorageRemove(SESSION_ID_KEY);
	const nextSessionId = getTelemetrySessionId();
	telemetryLogger.info('Telemetry session id rotated', { nextSessionId });
	return nextSessionId;
};

export const telemetryOptedOut = (): boolean => safeStorageGet(OPT_OUT_KEY) === 'true';

export const setTelemetryOptOut = (value: boolean): void => {
	safeStorageSet(OPT_OUT_KEY, String(value));
};

export const getTelemetryEvents = (): TelemetryEvent[] => readStoredEvents();

export const clearTelemetryEvents = (): void => {
	safeStorageRemove(STORAGE_KEY);
	telemetryLogger.info('Telemetry events cleared');
};

export const getTelemetryMeta = (): TelemetryMeta => {
	const events = readStoredEvents();
	return {
		count: events.length,
		optedOut: telemetryOptedOut(),
		sessionId: getTelemetrySessionId()
	};
};

export const getTelemetryHealth = (): TelemetryHealth => ({
	...getTelemetryMeta(),
	droppedByReason: { ...droppedByReason },
	lastFlushAt
});

/**
 * Allows runtime tuning for telemetry queueing and filtering behavior.
 */
export const configureTelemetry = (partialConfig: Partial<TelemetryConfig>): void => {
	if (partialConfig.maxEvents !== undefined) {
		telemetryConfig.maxEvents = Math.max(1, Math.floor(partialConfig.maxEvents));
	}
	if (partialConfig.dedupeWindowMs !== undefined) {
		telemetryConfig.dedupeWindowMs = Math.max(0, Math.floor(partialConfig.dedupeWindowMs));
	}
	if (partialConfig.eventTtlMs !== undefined) {
		telemetryConfig.eventTtlMs = Math.max(0, Math.floor(partialConfig.eventTtlMs));
	}
	if (partialConfig.sampleRate !== undefined) {
		telemetryConfig.sampleRate = Math.min(1, Math.max(0, partialConfig.sampleRate));
	}
	if (partialConfig.contextMaxDepth !== undefined) {
		telemetryConfig.contextMaxDepth = Math.max(1, Math.floor(partialConfig.contextMaxDepth));
	}
	if (partialConfig.allowedEventNames !== undefined) {
		// Clone + normalize incoming names so later caller mutations cannot alter runtime behavior implicitly.
		telemetryConfig.allowedEventNames = normalizeEventNameList(partialConfig.allowedEventNames);
	}
	if (partialConfig.blockedEventNames !== undefined) {
		// Clone + normalize blocked names for determinism and easier operator reasoning.
		telemetryConfig.blockedEventNames = normalizeEventNameList(partialConfig.blockedEventNames);
	}
	if (partialConfig.flushBatchSize !== undefined) {
		telemetryConfig.flushBatchSize = Math.max(1, Math.floor(partialConfig.flushBatchSize));
	}
};

export const getTelemetryConfig = (): Readonly<TelemetryConfig> => ({ ...telemetryConfig });

export const resetTelemetryState = (): void => {
	configureTelemetry({
		maxEvents: 100,
		dedupeWindowMs: 2_000,
		eventTtlMs: 7 * 24 * 60 * 60 * 1_000,
		sampleRate: 1,
		contextMaxDepth: 6,
		allowedEventNames: [],
		blockedEventNames: [],
		flushBatchSize: 25
	});
	Object.keys(droppedByReason).forEach((key) => {
		droppedByReason[key as keyof typeof droppedByReason] = 0;
	});
	lastFlushAt = null;
	clearTelemetryEvents();
	setTelemetryOptOut(false);
};

/**
 * Clears expired telemetry events so storage remains bounded and relevant.
 */
export const pruneExpiredTelemetryEvents = (now = Date.now()): number => {
	if (!canUseStorage()) return 0;
	if (telemetryConfig.eventTtlMs <= 0) return 0;

	const events = readStoredEvents();
	const keptEvents = events.filter((event) => {
		const createdAt = event.createdAt ? Date.parse(event.createdAt) : Number.NaN;
		if (!Number.isFinite(createdAt)) return true;
		return now - createdAt <= telemetryConfig.eventTtlMs;
	});
	const removedCount = events.length - keptEvents.length;

	if (removedCount > 0) {
		safeStorageSet(STORAGE_KEY, JSON.stringify(keptEvents));
		droppedByReason.expired += removedCount;
		telemetryLogger.info('Telemetry expired events pruned', { removedCount });
	}

	return removedCount;
};

export const exportTelemetryEvents = (): string => JSON.stringify(readStoredEvents(), null, 2);

export const importTelemetryEvents = (
	rawPayload: string,
	strategy: 'replace' | 'merge' = 'replace'
): number => {
	const parsed = JSON.parse(rawPayload) as unknown;
	if (!Array.isArray(parsed)) {
		throw new Error('Telemetry import payload must be an array of events.');
	}

	const normalized = parsed
		.filter((entry) => isPlainObject(entry) && typeof (entry as TelemetryEvent).name === 'string')
		.map((entry) => ({
			...(entry as TelemetryEvent),
			context: sanitizeSensitiveData(
				capDepth((entry as TelemetryEvent).context ?? {}, telemetryConfig.contextMaxDepth)
			) as Record<string, unknown>
		}));

	const incoming = strategy === 'replace' ? normalized : [...readStoredEvents(), ...normalized];
	const capped = incoming.slice(-telemetryConfig.maxEvents);
	safeStorageSet(STORAGE_KEY, JSON.stringify(capped));
	telemetryLogger.info('Telemetry events imported', {
		strategy,
		importedCount: normalized.length,
		totalCount: capped.length
	});
	return normalized.length;
};

/**
 * Tracks telemetry events with sanitization, queue limits, duplicate suppression, and sampling.
 */
export const trackTelemetryEvent = (
	event: TelemetryEvent,
	options: TelemetryTrackOptions = {}
): void => {
	const now = options.now ?? Date.now();
	const random = options.random ?? Math.random;
	const dedupeWindowMs = options.dedupeWindowMs ?? telemetryConfig.dedupeWindowMs;
	const maxEvents = options.maxEvents ?? telemetryConfig.maxEvents;

	if (!validateEventName(event.name)) {
		incrementDropReason('invalid_name', { eventName: event.name });
		return;
	}

	if (event.context !== undefined && !isPlainObject(event.context)) {
		incrementDropReason('invalid_context', { eventName: event.name });
		return;
	}

	if (!canUseStorage()) {
		incrementDropReason('storage_unavailable', { eventName: event.name });
		return;
	}
	if (telemetryOptedOut()) {
		incrementDropReason('opted_out', { eventName: event.name });
		return;
	}

	if (
		telemetryConfig.allowedEventNames.length > 0 &&
		!telemetryConfig.allowedEventNames.includes(event.name)
	) {
		incrementDropReason('not_allowed', { eventName: event.name });
		return;
	}

	if (telemetryConfig.blockedEventNames.includes(event.name)) {
		incrementDropReason('blocked', { eventName: event.name });
		return;
	}

	if (telemetryConfig.sampleRate < 1 && random() > telemetryConfig.sampleRate) {
		incrementDropReason('sampled_out', {
			eventName: event.name,
			sampleRate: telemetryConfig.sampleRate
		});
		return;
	}

	pruneExpiredTelemetryEvents(now);

	const sanitizedContext = sanitizeSensitiveData(
		capDepth(event.context ?? {}, telemetryConfig.contextMaxDepth)
	) as Record<string, unknown>;
	const eventSignature = `${event.name}:${stableStringify(sanitizedContext)}`;
	const events = readStoredEvents();
	const lastEvent = events.at(-1);
	const lastEventCreatedAt = lastEvent?.createdAt ? Date.parse(lastEvent.createdAt) : Number.NaN;
	const isDuplicateBurst =
		lastEvent?.name === event.name &&
		stableStringify(lastEvent.context ?? {}) === stableStringify(sanitizedContext) &&
		Number.isFinite(lastEventCreatedAt) &&
		now - lastEventCreatedAt <= dedupeWindowMs;

	if (isDuplicateBurst) {
		incrementDropReason('duplicate', { eventName: event.name, eventSignature });
		return;
	}

	const trackedEvent: TelemetryEvent = {
		...event,
		context: sanitizedContext,
		category: event.category ?? 'general',
		severity: event.severity ?? 'low',
		createdAt: event.createdAt ?? new Date(now).toISOString(),
		sessionId: event.sessionId ?? getTelemetrySessionId() ?? undefined
	};

	events.push(trackedEvent);

	if (events.length > maxEvents) {
		const overflowCount = events.length - maxEvents;
		events.splice(0, overflowCount);
		droppedByReason.trimmed += overflowCount;
		telemetryLogger.info('Telemetry queue trimmed to capacity', { maxEvents, overflowCount });
	}

	safeStorageSet(STORAGE_KEY, JSON.stringify(events));
	telemetryLogger.info('Telemetry event tracked', {
		eventName: trackedEvent.name,
		eventSignature,
		totalEvents: events.length
	});
};

/**
 * Convenience helper to track duration for actions using start/end style instrumentation.
 */
export const createTelemetryTimer = (
	eventName: string,
	baseContext: Record<string, unknown> = {},
	now = Date.now()
): { stop: (extraContext?: Record<string, unknown>) => number } => {
	const startedAt = now;
	return {
		stop: (extraContext = {}) => {
			const durationMs = Math.max(0, Date.now() - startedAt);
			trackTelemetryEvent({
				name: eventName,
				context: { ...baseContext, ...extraContext, durationMs },
				category: 'performance',
				severity: 'low'
			});
			return durationMs;
		}
	};
};

/**
 * Flushes telemetry events to a transport callback and removes delivered events.
 */
export const flushTelemetryEvents = async (
	transport: (events: TelemetryEvent[]) => Promise<void>
): Promise<{ sent: number; remaining: number }> => {
	const allEvents = readStoredEvents();
	if (allEvents.length === 0) return { sent: 0, remaining: 0 };

	const batch = allEvents.slice(0, telemetryConfig.flushBatchSize);
	try {
		await transport(batch);
		const remaining = allEvents.slice(batch.length);
		safeStorageSet(STORAGE_KEY, JSON.stringify(remaining));
		lastFlushAt = new Date().toISOString();
		telemetryLogger.info('Telemetry flush succeeded', {
			sent: batch.length,
			remaining: remaining.length
		});
		return { sent: batch.length, remaining: remaining.length };
	} catch (error) {
		incrementDropReason('flush_failure', { error });
		telemetryLogger.warn('Telemetry flush failed', {
			error,
			attemptedBatchSize: batch.length
		});
		return { sent: 0, remaining: allEvents.length };
	}
};
