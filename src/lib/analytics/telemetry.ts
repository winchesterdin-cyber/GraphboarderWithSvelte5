/**
 * Privacy-safe telemetry layer.
 * Stores anonymous event payloads with opt-out support.
 */
export interface TelemetryEvent {
	name: string;
	context?: Record<string, unknown>;
	createdAt?: string;
}

const STORAGE_KEY = 'graphboarder.telemetry.events';
const OPT_OUT_KEY = 'graphboarder.telemetry.optOut';

export const telemetryOptedOut = (): boolean =>
	typeof window !== 'undefined' && localStorage.getItem(OPT_OUT_KEY) === 'true';

export const setTelemetryOptOut = (value: boolean): void => {
	if (typeof window !== 'undefined') localStorage.setItem(OPT_OUT_KEY, String(value));
};

export const trackTelemetryEvent = (event: TelemetryEvent): void => {
	if (typeof window === 'undefined' || telemetryOptedOut()) return;
	const raw = localStorage.getItem(STORAGE_KEY);
	const events: TelemetryEvent[] = raw ? JSON.parse(raw) : [];
	events.push({ ...event, createdAt: event.createdAt ?? new Date().toISOString() });
	localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
	console.info('[Telemetry] event tracked', event.name);
};
