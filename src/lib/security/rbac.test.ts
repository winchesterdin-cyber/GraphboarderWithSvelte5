import { describe, expect, it } from 'vitest';
import { assertPermission, hasPermission } from './rbac';

describe('rbac permissions', () => {
	it('allows viewer read permission', () => {
		expect(hasPermission('viewer', 'endpoint:read')).toBe(true);
	});

	it('throws for missing permission', () => {
		expect(() => assertPermission('viewer', 'admin:settings')).toThrowError('Missing permission');
	});
});
