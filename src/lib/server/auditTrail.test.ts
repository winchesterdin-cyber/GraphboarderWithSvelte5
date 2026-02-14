import { describe, expect, it } from 'vitest';
import { clearAuditEvents, readAuditEvents, writeAuditEvent } from './auditTrail';

describe('audit trail', () => {
	it('records audit entries with timestamps', () => {
		clearAuditEvents();
		writeAuditEvent({
			actorId: 'user-1',
			action: 'endpoint.update',
			resource: 'endpoint',
			resourceId: 'ep-1'
		});

		const events = readAuditEvents();
		expect(events).toHaveLength(1);
		expect(events[0]?.createdAt).toBeTruthy();
	});
});
