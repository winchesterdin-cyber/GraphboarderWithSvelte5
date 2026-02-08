import { logger } from '$lib/utils/logger';

export interface HealthCheckResult {
	healthy: boolean;
	latency?: number;
	error?: string;
}

/**
 * Checks the health of a GraphQL endpoint by sending a lightweight introspection query.
 * @param url The endpoint URL.
 * @param headers Optional headers.
 * @returns A promise resolving to the health check result.
 */
export const checkEndpointHealth = async (
	url: string,
	headers: Record<string, string> = {}
): Promise<HealthCheckResult> => {
	const startTime = performance.now();
	try {
		logger.debug('Health check started', { url });
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify({ query: '{ __typename }' })
		});

		const latency = Math.round(performance.now() - startTime);

		if (!response.ok) {
			logger.warn('Health check failed', {
				url,
				status: response.status,
				statusText: response.statusText,
				latency
			});
			return {
				healthy: false,
				latency,
				error: `${response.status} ${response.statusText}`
			};
		}

		const result = await response.json();
		if (result.errors) {
			logger.warn('Health check GraphQL error', { url, latency, errors: result.errors });
			return {
				healthy: false,
				latency,
				error: result.errors[0]?.message || 'GraphQL Error'
			};
		}

		logger.info('Health check succeeded', { url, latency });
		return {
			healthy: true,
			latency
		};
	} catch (error: any) {
		const latency = Math.round(performance.now() - startTime);
		logger.error('Health check network error', { url, latency, error });
		return {
			healthy: false,
			latency,
			error: error.message || 'Network Error'
		};
	}
};
