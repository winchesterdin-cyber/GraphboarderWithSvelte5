<script lang="ts">
	import type {
		ActiveArgumentGroup,
		QMSMainWraperContext as QMSMainWraperContextType
	} from '$lib/types';
	import { getRootType } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';

	interface Props {
		group: any;
		prefix?: string;
	}

	let { group, prefix = '' } = $props();

	let QMSMainWraperContext = getContext<QMSMainWraperContextType>(`${prefix}QMSMainWraperContext`);
	const schemaData = QMSMainWraperContext?.schemaData;
	let showDescription = $state();
</script>

{#if !group.group_isRoot}
	<div class="text-sm">
		{group.group_name}
	</div>
{/if}
<div class="ml-2 pt-1 text-xs">
	{#if group.dd_kindList}
		( list )
	{/if}
	{#if getRootType(null, group.dd_rootName, schemaData)?.dd_baseFilterOperators}
		{`( ${getRootType(null, group.dd_rootName, schemaData)?.dd_baseFilterOperators?.join(',')} )`}
	{/if}
</div>

{#if group.group_name !== 'root'}
	<i
		role="button"
		tabindex="0"
		class="bi bi-info-circle cursor-pointer px-2 text-secondary"
		title={group.description}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				if (showDescription == group.description) {
					showDescription = '';
				} else {
					showDescription = group.description;
				}
			}
		}}
		onclick={() => {
			if (showDescription == group.description) {
				showDescription = '';
			} else {
				showDescription = group.description;
			}
		}}
	></i>
	{#if showDescription == group.description && group.description}
		<p class="text-xs font-light text-secondary select-none">
			({group.description})
		</p>
	{/if}
{/if}
