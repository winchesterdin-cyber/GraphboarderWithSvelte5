<script>
	import { page } from '$app/stores';
	import Page from '$lib/components/Page.svelte';
	import MutationExample from '../MutationExample.svelte';
	import QMSWraper from '$lib/components/QMSWraper.svelte';
	import { historyQueries } from '$lib/stores/historyQueriesStore';
	import { get } from 'svelte/store';

	let item = $derived($page.params.item);

	let initialGqlArgObj = $state({});

	$effect(() => {
		const historyId = $page.url.searchParams.get('historyId');
		if (historyId) {
			const historyItem = historyQueries.get(historyId);
			if (historyItem) {
				console.debug('Restoring mutation history:', historyItem);
				if (historyItem.args) initialGqlArgObj = historyItem.args;
			}
		}
	});
</script>

<Page MenuItem={false} CustomId="fdsfdsee" backPath="/" title={$page.params.item ?? ''}>
	{#key ($page.params.item ?? '') + ($page.url.searchParams.get('historyId') ?? '')}
		{#if $page.params.item}
			<QMSWraper
				isOutermostQMSWraper={true}
				QMSName={$page.params.item}
				QMSType="mutation"
				initialGqlArgObj={initialGqlArgObj}
			>
				<MutationExample />
			</QMSWraper>
		{/if}
	{/key}
</Page>
