import { logEvent } from '$lib/observability/logger';

/**
 * Audit trail events for critical mutations.
 * This uses an in-memory queue for now and logs every event in structured format.
 */
export interface AuditEvent {
	actorId: string;
	action: string;
	resource: string;
	resourceId?: string;
	before?: unknown;
	after?: unknown;
	traceId?: string;
	createdAt?: string;
}

const auditBuffer: AuditEvent[] = [];

export const writeAuditEvent = (event: AuditEvent): AuditEvent => {
	const record = {
		...event,
		createdAt: event.createdAt ?? new Date().toISOString()
	};

	auditBuffer.push(record);
	logEvent('info', 'audit.event', {
		feature: 'audit-trail',
		traceId: event.traceId,
		action: event.action,
		resource: event.resource,
		resourceId: event.resourceId,
		actorId: event.actorId
	});

	return record;
};

export const readAuditEvents = (): AuditEvent[] => [...auditBuffer];

export const clearAuditEvents = (): void => {
	auditBuffer.length = 0;
};
