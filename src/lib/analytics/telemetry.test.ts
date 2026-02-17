import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	clearTelemetryEvents,
	configureTelemetry,
	createTelemetryTimer,
	exportTelemetryEvents,
	flushTelemetryEvents,
	getTelemetryConfig,
	getTelemetryEvents,
	getTelemetryHealth,
	getTelemetryMeta,
	getTelemetrySessionId,
	importTelemetryEvents,
	pruneExpiredTelemetryEvents,
	resetTelemetryState,
	rotateTelemetrySessionId,
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
		resetTelemetryState();
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
		expect(events[0]?.category).toBe('general');
	});

	it('rejects invalid event names', () => {
		trackTelemetryEvent({ name: '$' });
		expect(getTelemetryEvents()).toHaveLength(0);
		expect(getTelemetryHealth().droppedByReason.invalid_name).toBe(1);
	});

	it('rejects non-object event contexts', () => {
		trackTelemetryEvent({
			name: 'auth.attempt',
			context: 'wrong' as unknown as Record<string, unknown>
		});
		expect(getTelemetryEvents()).toHaveLength(0);
		expect(getTelemetryHealth().droppedByReason.invalid_context).toBe(1);
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
		expect(getTelemetryHealth().droppedByReason.duplicate).toBe(1);
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
		trackTelemetryEvent({ name: 'event.one' }, { now: 1000, maxEvents: 2, dedupeWindowMs: 0 });
		trackTelemetryEvent({ name: 'event.two' }, { now: 2000, maxEvents: 2, dedupeWindowMs: 0 });
		trackTelemetryEvent({ name: 'event.three' }, { now: 3000, maxEvents: 2, dedupeWindowMs: 0 });

		const events = getTelemetryEvents();
		expect(events).toHaveLength(2);
		expect(events.map((event) => event.name)).toEqual(['event.two', 'event.three']);
		expect(getTelemetryHealth().droppedByReason.trimmed).toBe(1);
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
		expect(getTelemetryHealth().droppedByReason.opted_out).toBe(1);
	});

	it('returns stable telemetry session id across calls', () => {
		const first = getTelemetrySessionId();
		const second = getTelemetrySessionId();
		expect(first).toBeTruthy();
		expect(first).toBe(second);
	});

	it('rotates telemetry session id on demand', () => {
		const first = getTelemetrySessionId();
		const second = rotateTelemetrySessionId();
		expect(first).toBeTruthy();
		expect(second).toBeTruthy();
		expect(first).not.toBe(second);
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

	it('supports telemetry configuration updates and snapshots', () => {
		configureTelemetry({ sampleRate: 0.5, contextMaxDepth: 3, flushBatchSize: 2 });
		expect(getTelemetryConfig()).toMatchObject({
			sampleRate: 0.5,
			contextMaxDepth: 3,
			flushBatchSize: 2
		});
	});

	it('supports allowlists and blocklists', () => {
		const allowlist = [' allowed.event ', 'allowed.event'];
		configureTelemetry({ allowedEventNames: allowlist });
		// Mutate caller-owned list to verify telemetry config was cloned and remains stable.
		allowlist.length = 0;

		trackTelemetryEvent({ name: 'blocked.by.allowlist' });
		trackTelemetryEvent({ name: 'allowed.event' });

		expect(getTelemetryEvents().map((entry) => entry.name)).toEqual(['allowed.event']);
		expect(getTelemetryHealth().droppedByReason.not_allowed).toBe(1);

		configureTelemetry({ blockedEventNames: [' allowed.event ', 'allowed.event'] });
		trackTelemetryEvent({ name: 'allowed.event' });
		expect(getTelemetryHealth().droppedByReason.blocked).toBe(1);
	});

	it('applies sampling when configured', () => {
		configureTelemetry({ sampleRate: 0.4 });
		trackTelemetryEvent({ name: 'sampled.out' }, { random: () => 0.9 });
		expect(getTelemetryEvents()).toHaveLength(0);
		expect(getTelemetryHealth().droppedByReason.sampled_out).toBe(1);
	});

	it('caps deep telemetry context payloads', () => {
		configureTelemetry({ contextMaxDepth: 2 });
		trackTelemetryEvent({ name: 'depth.check', context: { a: { b: { c: true } } } });
		expect(getTelemetryEvents()[0]?.context).toEqual({ a: { b: '[MaxDepthExceeded]' } });
	});

	it('prunes expired events', () => {
		configureTelemetry({ eventTtlMs: 100 });
		trackTelemetryEvent({ name: 'old.event' }, { now: 1000, dedupeWindowMs: 0 });
		trackTelemetryEvent({ name: 'new.event' }, { now: 1050, dedupeWindowMs: 0 });

		const removed = pruneExpiredTelemetryEvents(1140);
		expect(removed).toBe(1);
		expect(getTelemetryEvents().map((entry) => entry.name)).toEqual(['new.event']);
		expect(getTelemetryHealth().droppedByReason.expired).toBe(1);
	});

	it('exports and imports telemetry data', () => {
		trackTelemetryEvent({ name: 'export.event' });
		const payload = exportTelemetryEvents();
		clearTelemetryEvents();
		expect(getTelemetryEvents()).toHaveLength(0);

		const importedCount = importTelemetryEvents(payload, 'replace');
		expect(importedCount).toBe(1);
		expect(getTelemetryEvents()).toHaveLength(1);
	});

	it('flushes events through provided transport', async () => {
		configureTelemetry({ flushBatchSize: 1 });
		trackTelemetryEvent({ name: 'flush.first' });
		trackTelemetryEvent({ name: 'flush.second' });
		const transport = vi.fn(async () => {});

		const result = await flushTelemetryEvents(transport);
		expect(result).toEqual({ sent: 1, remaining: 1 });
		expect(transport).toHaveBeenCalledTimes(1);
		expect(getTelemetryHealth().lastFlushAt).toBeTruthy();
	});

	it('tracks flush failures in health metrics', async () => {
		trackTelemetryEvent({ name: 'flush.error' });
		const transport = vi.fn(async () => {
			throw new Error('network issue');
		});

		const result = await flushTelemetryEvents(transport);
		expect(result).toEqual({ sent: 0, remaining: 1 });
		expect(getTelemetryHealth().droppedByReason.flush_failure).toBe(1);
	});

	it('creates telemetry timers and records duration events', () => {
		const nowSpy = vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1145);
		const timer = createTelemetryTimer('duration.event', { endpoint: 'users' }, Date.now());
		const elapsed = timer.stop({ source: 'test' });

		expect(elapsed).toBe(145);
		const [event] = getTelemetryEvents();
		expect(event?.category).toBe('performance');
		expect(event?.context).toMatchObject({ endpoint: 'users', source: 'test', durationMs: 145 });
		nowSpy.mockRestore();
	});
});
