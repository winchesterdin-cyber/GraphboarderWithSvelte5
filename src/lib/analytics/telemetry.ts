import { logEvent, sanitizeSensitiveData } from '$lib/observability/logger';

/**
 * Privacy-safe telemetry layer.
 * Stores anonymous event payloads with opt-out support.
 */
export interface TelemetryEvent {
	name: string;
	context?: Record<string, unknown>;
	createdAt?: string;
	sessionId?: string;
}

export interface TelemetryTrackOptions {
	maxEvents?: number;
	dedupeWindowMs?: number;
	now?: number;
}

const STORAGE_KEY = 'graphboarder.telemetry.events';
const OPT_OUT_KEY = 'graphboarder.telemetry.optOut';
const SESSION_ID_KEY = 'graphboarder.telemetry.sessionId';
const DEFAULT_MAX_EVENTS = 100;
const DEFAULT_DEDUPE_WINDOW_MS = 2_000;

const canUseStorage = (): boolean =>
	typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Reads storage values safely and emits structured warnings on corruption.
 */
const safeStorageGet = (key: string): string | null => {
	if (!canUseStorage()) return null;

	try {
		return localStorage.getItem(key);
	} catch (error) {
		logEvent('warn', 'Telemetry storage read failed', { key, feature: 'telemetry', error });
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
		logEvent('warn', 'Telemetry storage write failed', { key, feature: 'telemetry', error });
	}
};

const safeStorageRemove = (key: string): void => {
	if (!canUseStorage()) return;

	try {
		localStorage.removeItem(key);
	} catch (error) {
		logEvent('warn', 'Telemetry storage remove failed', { key, feature: 'telemetry', error });
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
		logEvent('warn', 'Telemetry event payload parse failed; clearing invalid data', {
			feature: 'telemetry',
			error
		});
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

export const telemetryOptedOut = (): boolean => safeStorageGet(OPT_OUT_KEY) === 'true';

export const setTelemetryOptOut = (value: boolean): void => {
	safeStorageSet(OPT_OUT_KEY, String(value));
};

export const getTelemetryEvents = (): TelemetryEvent[] => readStoredEvents();

export const clearTelemetryEvents = (): void => {
	safeStorageRemove(STORAGE_KEY);
	logEvent('info', 'Telemetry events cleared', { feature: 'telemetry' });
};

export const getTelemetryMeta = (): {
	count: number;
	optedOut: boolean;
	sessionId: string | null;
} => {
	const events = readStoredEvents();
	return {
		count: events.length,
		optedOut: telemetryOptedOut(),
		sessionId: getTelemetrySessionId()
	};
};

/**
 * Tracks telemetry events with sanitization, queue limits, and duplicate suppression.
 */
export const trackTelemetryEvent = (
	event: TelemetryEvent,
	options: TelemetryTrackOptions = {}
): void => {
	if (!canUseStorage() || telemetryOptedOut()) return;

	const sanitizedContext = sanitizeSensitiveData(event.context ?? {});
	const now = options.now ?? Date.now();
	const dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
	const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
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
		logEvent('debug', 'Telemetry duplicate event dropped', {
			feature: 'telemetry',
			eventName: event.name,
			eventSignature
		});
		return;
	}

	const trackedEvent: TelemetryEvent = {
		...event,
		context: sanitizedContext,
		createdAt: event.createdAt ?? new Date(now).toISOString(),
		sessionId: event.sessionId ?? getTelemetrySessionId() ?? undefined
	};

	events.push(trackedEvent);

	if (events.length > maxEvents) {
		const overflowCount = events.length - maxEvents;
		events.splice(0, overflowCount);
		logEvent('info', 'Telemetry queue trimmed to capacity', {
			feature: 'telemetry',
			maxEvents,
			overflowCount
		});
	}

	safeStorageSet(STORAGE_KEY, JSON.stringify(events));
	logEvent('info', 'Telemetry event tracked', {
		feature: 'telemetry',
		eventName: trackedEvent.name,
		totalEvents: events.length
	});
};
