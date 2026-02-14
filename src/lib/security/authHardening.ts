/**
 * Authentication hardening helpers used by server routes and hooks.
 * Includes secure cookie defaults and CSRF token generation/validation.
 */
export const SESSION_COOKIE_NAME = 'gb_session';
export const CSRF_COOKIE_NAME = 'gb_csrf';

export const getSecureCookieOptions = (isProduction: boolean) => ({
	httpOnly: true,
	secure: isProduction,
	sameSite: 'lax' as const,
	path: '/'
});

export const createCsrfToken = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	return `csrf-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

export const isValidCsrfToken = (
	cookieToken: string | undefined,
	requestToken: string | null
): boolean => {
	if (!cookieToken || !requestToken) {
		return false;
	}

	return cookieToken === requestToken;
};
