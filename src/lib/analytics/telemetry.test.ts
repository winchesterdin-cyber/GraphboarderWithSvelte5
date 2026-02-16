import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearTelemetryEvents,
	getTelemetryEvents,
	getTelemetryMeta,
	getTelemetrySessionId,
	setTelemetryOptOut,
	telemetryOptedOut,
	trackTelemetryEvent
} from './telemetry';

interface MockStorage {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
	clear: () => void;
}

const installMockStorage = (): MockStorage => {
	const store = new Map<string, string>();
	const storage: MockStorage = {
		getItem: (key) => store.get(key) ?? null,
		setItem: (key, value) => {
			store.set(key, value);
		},
		removeItem: (key) => {
			store.delete(key);
		},
		clear: () => {
			store.clear();
		}
	};

	Object.defineProperty(globalThis, 'window', {
		value: { localStorage: storage },
		configurable: true
	});
	Object.defineProperty(globalThis, 'localStorage', {
		value: storage,
		configurable: true
	});

	return storage;
};

const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('telemetry', () => {
	beforeEach(() => {
		installMockStorage().clear();
		setTelemetryOptOut(false);
		infoSpy.mockClear();
		warnSpy.mockClear();
		debugSpy.mockClear();
	});

	afterAll(() => {
		infoSpy.mockRestore();
		warnSpy.mockRestore();
		debugSpy.mockRestore();
	});

	it('is not opted-out by default', () => {
		expect(telemetryOptedOut()).toBe(false);
	});

	it('tracks events with createdAt and session id', () => {
		trackTelemetryEvent({ name: 'query.execute' }, { now: 1000 });
		const events = getTelemetryEvents();

		expect(events).toHaveLength(1);
		expect(events[0]?.createdAt).toBe(new Date(1000).toISOString());
		expect(events[0]?.sessionId).toBeTruthy();
	});

	it('redacts sensitive fields from telemetry context', () => {
		trackTelemetryEvent({
			name: 'auth.attempt',
			context: { token: 'abc', nested: { password: '123' } }
		});
		const [event] = getTelemetryEvents();
		expect(event?.context).toEqual({ token: '[REDACTED]', nested: { password: '[REDACTED]' } });
	});

	it('drops duplicate events inside dedupe window', () => {
		trackTelemetryEvent(
			{ name: 'endpoint.check', context: { id: '1' } },
			{ now: 1000, dedupeWindowMs: 5000 }
		);
		trackTelemetryEvent(
			{ name: 'endpoint.check', context: { id: '1' } },
			{ now: 2000, dedupeWindowMs: 5000 }
		);
		expect(getTelemetryEvents()).toHaveLength(1);
	});

	it('keeps duplicate events outside dedupe window', () => {
		trackTelemetryEvent(
			{ name: 'endpoint.check', context: { id: '1' } },
			{ now: 1000, dedupeWindowMs: 1000 }
		);
		trackTelemetryEvent(
			{ name: 'endpoint.check', context: { id: '1' } },
			{ now: 5000, dedupeWindowMs: 1000 }
		);
		expect(getTelemetryEvents()).toHaveLength(2);
	});

	it('limits queue size by evicting oldest events', () => {
		trackTelemetryEvent({ name: 'e1' }, { now: 1000, maxEvents: 2, dedupeWindowMs: 0 });
		trackTelemetryEvent({ name: 'e2' }, { now: 2000, maxEvents: 2, dedupeWindowMs: 0 });
		trackTelemetryEvent({ name: 'e3' }, { now: 3000, maxEvents: 2, dedupeWindowMs: 0 });

		const events = getTelemetryEvents();
		expect(events).toHaveLength(2);
		expect(events.map((event) => event.name)).toEqual(['e2', 'e3']);
	});

	it('supports clear and metadata helpers', () => {
		trackTelemetryEvent({ name: 'inspect.event' });
		expect(getTelemetryMeta().count).toBe(1);

		clearTelemetryEvents();
		const meta = getTelemetryMeta();
		expect(meta.count).toBe(0);
		expect(meta.optedOut).toBe(false);
	});

	it('respects opt-out and skips tracking', () => {
		setTelemetryOptOut(true);
		trackTelemetryEvent({ name: 'skip.event' });
		expect(getTelemetryEvents()).toHaveLength(0);
	});

	it('returns stable telemetry session id across calls', () => {
		const first = getTelemetrySessionId();
		const second = getTelemetrySessionId();
		expect(first).toBeTruthy();
		expect(first).toBe(second);
	});

	it('clears invalid stored telemetry payloads without throwing', () => {
		localStorage.setItem('graphboarder.telemetry.events', '{invalid');
		expect(() => getTelemetryEvents()).not.toThrow();
		expect(getTelemetryEvents()).toEqual([]);
	});

	it('handles storage write errors safely', () => {
		const originalSetItem = localStorage.setItem;
		const throwSpy = vi.fn(() => {
			throw new Error('quota exceeded');
		});
		localStorage.setItem = throwSpy;

		expect(() => trackTelemetryEvent({ name: 'safe.error' })).not.toThrow();

		localStorage.setItem = originalSetItem;
	});
});
