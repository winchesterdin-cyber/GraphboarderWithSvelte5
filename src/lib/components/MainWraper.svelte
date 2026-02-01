<script lang="ts">
	import { create_endpointInfo_Store } from '$lib/stores/endpointHandling/endpointInfo';
	import IntrospectionDataGenerator from '$lib/components/IntrospectionDataGenerator.svelte';
	import { create_schemaData } from '$lib/stores/endpointHandling/schemaData';

	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { Create_urqlCoreClient } from '$lib/utils/urqlCoreClient';
	import { setContextClient, Client, fetchExchange } from '@urql/svelte';
	import type { EndpointConfiguration } from '$lib/types';
	import { envVars } from '$lib/stores/envVarsStore';
	import { get } from 'svelte/store';

	/**
	 * Props for MainWraper.
	 */
	interface Props {
		/** Prefix for context keys to allow nesting. */
		prefix?: string;
		/** Initial endpoint configuration. */
		endpointInfoProvided?: Partial<EndpointConfiguration> | undefined;
		/** Child components to render. */
		children?: import('svelte').Snippet;
	}

	/**
	 * Main wrapper component that sets up the GraphQL client and context.
	 * Handles endpoint configuration, schema introspection, and header management.
	 */
	let { prefix = '', endpointInfoProvided = undefined, children }: Props = $props();

	// Create stores (assuming factories return typed stores, if not, casting might be needed there, but here we treat them as provided)
	const endpointInfo = create_endpointInfo_Store(endpointInfoProvided);
	const schemaData = create_schemaData();

	// Subscribe to store value for usage
	// Using $endpointInfo since it's a store
	console.debug('Initializing URQL Client for:', ($endpointInfo as any)?.url);

	let getHeaders = () => {
		let headers: Record<string, string> = {};
		if (($endpointInfo as any)?.headers && Object.keys(($endpointInfo as any).headers).length > 0) {
			headers = ($endpointInfo as any).headers;
		} else if (browser) {
			const headersStr = localStorage.getItem('headers');
			headers = headersStr ? JSON.parse(headersStr) : {};
			console.debug('Loaded headers from localStorage:', headers);
		}

		// Environment Variable Substitution
		const vars = get(envVars);
		const substitutedHeaders: Record<string, string> = {};

		for (const [key, value] of Object.entries(headers)) {
			if (typeof value === 'string') {
				substitutedHeaders[key] = value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, varName) => {
					if (vars[varName] !== undefined) {
						// console.debug(`Substituted env var ${varName} in header ${key}`);
						return vars[varName];
					} else {
						console.warn(`Environment variable '${varName}' not found for header '${key}'`);
						return match;
					}
				});
			} else {
				substitutedHeaders[key] = value;
			}
		}

		return substitutedHeaders;
	};

	let client = new Client({
		url: ($endpointInfo as any)?.url || '',
		fetchOptions: () => {
			console.debug('Fetching with headers for:', ($endpointInfo as any)?.url);
			return {
				headers: getHeaders()
			};
		},
		exchanges: [fetchExchange]
	});

	const urqlCoreClient = Create_urqlCoreClient();
	urqlCoreClient.set(client);

	setContextClient(client);
	setContext(`${prefix}QMSMainWraperContext`, {
		endpointInfo: endpointInfo,
		schemaData: schemaData,
		urqlCoreClient: urqlCoreClient
	});
</script>

<IntrospectionDataGenerator>
	{@render children?.()}
</IntrospectionDataGenerator>
