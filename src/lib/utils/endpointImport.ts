import type { AvailableEndpoint } from '$lib/types';

interface EndpointImportResult {
	endpoints: AvailableEndpoint[];
	skipped: number;
	total: number;
}

interface EndpointImportSummary {
	endpoints: AvailableEndpoint[];
	skippedInvalid: number;
	skippedDuplicates: number;
	skippedExisting: number;
	total: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Normalizes header payloads so only string values survive import.
 * This protects downstream request logic from non-string header values.
 */
const normalizeHeaders = (value: unknown): Record<string, string> | undefined => {
	if (!isRecord(value)) return undefined;

	const entries = Object.entries(value)
		.map(([key, val]) => [key, typeof val === 'string' ? val : null] as const)
		.filter(([, val]) => typeof val === 'string') as Array<[string, string]>;

	if (entries.length === 0) return undefined;
	return Object.fromEntries(entries);
};

/**
 * Parses endpoint import payloads from file or URL sources.
 * Invalid entries are skipped so a partial import can still succeed.
 */
export const parseEndpointImportPayload = (payload: unknown): EndpointImportResult => {
	if (!Array.isArray(payload)) {
		throw new Error('Invalid format: expected an array of endpoints');
	}

	const endpoints: AvailableEndpoint[] = [];
	let skipped = 0;

	payload.forEach((item) => {
		if (!isRecord(item)) {
			skipped += 1;
			return;
		}

		const id = normalizeString(item.id);
		const url = normalizeString(item.url);

		if (!id || !url) {
			skipped += 1;
			return;
		}

		const endpoint: AvailableEndpoint = { id, url };

		if (typeof item.description === 'string' && item.description.trim()) {
			endpoint.description = item.description.trim();
		}

		if (typeof item.isMaintained === 'boolean') {
			endpoint.isMaintained = item.isMaintained;
		}

		const headers = normalizeHeaders(item.headers);
		if (headers) {
			endpoint.headers = headers;
		}

		endpoints.push(endpoint);
	});

	return {
		endpoints,
		skipped,
		total: payload.length
	};
};

/**
 * Prepares endpoint imports by trimming invalid entries, de-duplicating payloads,
 * and optionally skipping IDs that already exist in local storage.
 */
export const prepareEndpointImport = (
	payload: unknown,
	options: { existingIds?: Iterable<string>; skipExisting?: boolean } = {}
): EndpointImportSummary => {
	const { endpoints, skipped, total } = parseEndpointImportPayload(payload);
	const existingIds = new Set(Array.from(options.existingIds ?? [], (id) => id.toString().trim()));
	const seenIds = new Set<string>();
	const prepared: AvailableEndpoint[] = [];
	let skippedDuplicates = 0;
	let skippedExisting = 0;

	endpoints.forEach((endpoint) => {
		const id = endpoint.id.toString().trim();
		if (seenIds.has(id)) {
			skippedDuplicates += 1;
			return;
		}

		seenIds.add(id);

		if (options.skipExisting && existingIds.has(id)) {
			skippedExisting += 1;
			return;
		}

		prepared.push(endpoint);
	});

	return {
		endpoints: prepared,
		skippedInvalid: skipped,
		skippedDuplicates,
		skippedExisting,
		total
	};
};
