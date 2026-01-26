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
		console.debug(`[HealthCheck] Checking ${url}...`);
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
			console.debug(`[HealthCheck] Failed ${url}: ${response.status} ${response.statusText}`);
			return {
				healthy: false,
				latency,
				error: `${response.status} ${response.statusText}`
			};
		}

		const result = await response.json();
		if (result.errors) {
			console.debug(`[HealthCheck] GraphQL Error ${url}:`, result.errors);
			return {
				healthy: false,
				latency,
				error: result.errors[0]?.message || 'GraphQL Error'
			};
		}

		console.debug(`[HealthCheck] Success ${url} in ${latency}ms`);
		return {
			healthy: true,
			latency
		};
	} catch (error: any) {
		const latency = Math.round(performance.now() - startTime);
		console.debug(`[HealthCheck] Network Error ${url}:`, error);
		return {
			healthy: false,
			latency,
			error: error.message || 'Network Error'
		};
	}
};
