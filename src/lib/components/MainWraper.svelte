<script lang="ts">
	import { create_endpointInfo_Store } from '$lib/stores/endpointHandling/endpointInfo';
	import IntrospectionDataGenerator from '$lib/components/IntrospectionDataGenerator.svelte';
	import { create_schemaData } from '$lib/stores/endpointHandling/schemaData';

	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { Create_urqlCoreClient } from '$lib/utils/urqlCoreClient';
	import { setContextClient, Client, fetchExchange } from '@urql/svelte';
	import type { EndpointConfiguration } from '$lib/types';

	interface Props {
		prefix?: string;
		endpointInfoProvided?: Partial<EndpointConfiguration> | undefined;
		children?: import('svelte').Snippet;
	}

	let { prefix = '', endpointInfoProvided = undefined, children }: Props = $props();

	// Create stores (assuming factories return typed stores, if not, casting might be needed there, but here we treat them as provided)
	const endpointInfo = create_endpointInfo_Store(endpointInfoProvided);
	const schemaData = create_schemaData();

	// Subscribe to store value for usage
	// Using $endpointInfo since it's a store
	console.debug('Initializing URQL Client for:', ($endpointInfo as any)?.url);

	let getHeaders = () => {
		if (($endpointInfo as any)?.headers) {
			return ($endpointInfo as any).headers;
		}
		if (browser) {
			const headersStr = localStorage.getItem('headers');
			const headers = headersStr ? JSON.parse(headersStr) : {};
			console.debug('Loaded headers from localStorage:', headers);
			return headers;
		} else {
			return {};
		}
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
