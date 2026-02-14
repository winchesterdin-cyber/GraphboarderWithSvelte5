/**
 * Basic role-based access controls.
 * This is intentionally minimal and can be expanded when auth providers are integrated.
 */
export type AppRole = 'viewer' | 'editor' | 'admin';

export type AppPermission =
	| 'endpoint:read'
	| 'endpoint:write'
	| 'query:run'
	| 'query:manage'
	| 'admin:settings';

const permissionsByRole: Record<AppRole, AppPermission[]> = {
	viewer: ['endpoint:read', 'query:run'],
	editor: ['endpoint:read', 'endpoint:write', 'query:run', 'query:manage'],
	admin: ['endpoint:read', 'endpoint:write', 'query:run', 'query:manage', 'admin:settings']
};

export const hasPermission = (role: AppRole, permission: AppPermission): boolean =>
	permissionsByRole[role].includes(permission);

export const assertPermission = (role: AppRole, permission: AppPermission): void => {
	if (!hasPermission(role, permission)) {
		throw new Error(`Missing permission: ${permission}`);
	}
};
