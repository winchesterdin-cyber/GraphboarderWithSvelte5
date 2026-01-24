<script>
	import ExplorerTable from '$lib/components/ExplorerTable.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	export let data;
	export let columns;
	export let onRowClicked;
	export let onDeleteRow = () => {};
	export let onDuplicateRow = () => {};
</script>

<div class="mx-auto h-[50vh] pt-4 pl-4">
	<ExplorerTable
		{data}
		{columns}
		{onRowClicked}
		{onDeleteRow}
		{onDuplicateRow}
		enableMultiRowSelectionState={false}
		onRowSelectionChange={() => {}}
	/>
</div>
