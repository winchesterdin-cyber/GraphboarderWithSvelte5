<script lang="ts">
	import QMSWraper from '$lib/components/QMSWraper.svelte';
	import ComponentForLayout from './ComponentForLayout.svelte';
	import { page } from '$app/state';
	import { historyQueries } from '$lib/stores/historyQueriesStore';
	import { get } from 'svelte/store';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let queryName = page.params.queryName;

	import type { TableColumnData } from '$lib/types/index';

	let initialGqlArgObj = $state({});
	let tableColsData_StoreInitialValue = $state<TableColumnData[] | undefined>(undefined);

	$effect(() => {
		const historyId = page.url.searchParams.get('historyId');
		if (historyId) {
			const historyItem = historyQueries.get(historyId);
			if (historyItem) {
				console.debug('Restoring query history:', historyItem);
				if (historyItem.args) initialGqlArgObj = historyItem.args;
				if (historyItem.cols) tableColsData_StoreInitialValue = historyItem.cols;
			}
		}
	});
</script>

{@render children?.()}
{#key page.url.searchParams.get('historyId')}
<QMSWraper
	isOutermostQMSWraper={true}
	QMSName={queryName}
	initialGqlArgObj={initialGqlArgObj}
	tableColsData_StoreInitialValue={tableColsData_StoreInitialValue}
>
	<ComponentForLayout rowSelectionState={{}} />
</QMSWraper>
{/key}
