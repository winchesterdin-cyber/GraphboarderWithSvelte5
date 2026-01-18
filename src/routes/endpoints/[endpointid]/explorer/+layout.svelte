<script lang="ts">
	import QMSWraper from '$lib/components/QMSWraper.svelte';
	import { getContext } from 'svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	const prefix = '';
	let QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSMainWraperContext?.endpointInfo;
	const schemaData = QMSMainWraperContext?.schemaData;
	let queryFields = $derived($schemaData.queryFields);
</script>

{#if schemaData}
	<QMSWraper QMS_info={queryFields[0]} prefix="" extraInfo={{ isForExplorer: true }}>
		{@render children?.()}
	</QMSWraper>{/if}
