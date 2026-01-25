<script lang="ts">
	import type { QMSMainWraperContext } from '$lib/types';
	import { getContext } from 'svelte';

	interface Props {
		type: any;
		i: any;
		prefix?: string;
	}

	let { type, i, prefix = '' }: Props = $props();

	const QMSWraperContext = getContext(`${prefix}QMSWraperContext`);
	let mainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as QMSMainWraperContext;
	const schemaData = mainWraperContext?.schemaData;
</script>

<tr>
	<th>{i + 1}</th>
	<td class="cursor-pointer hover:text-primary" onclick={() => {}}> {type.dd_displayName}</td>
	<td class="cursor-pointer hover:text-primary" onclick={() => {}}>{type.dd_rootName}</td>
	<td>{type.dd_kindList_NON_NULL ? '!' : ''}</td>
	<td>{type.dd_kindList ? 'list' : ''}</td>
	<td>{type.dd_kindEl_NON_NULL ? '!' : ''}</td>
	<td>{type.dd_kindEl}</td>
</tr>
