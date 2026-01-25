<script lang="ts">
	import Type from '$lib/components/Type.svelte';
	import { setContext, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	interface Props {
		prefix?: string;
		types: any;
		template: any;
		depth: any;
		stepsOfFields: any;
		oncolAddRequest?: (detail: any) => void;
	}

	let {
		prefix = '',
		types,
		template,
		depth,
		stepsOfFields,
		oncolAddRequest
	}: Props = $props();
</script>

{#each types as type, index (index)}
	<Type
		{index}
		{prefix}
		{type}
		{template}
		{depth}
		{stepsOfFields}
		isOnMainList={true}
		oncolAddRequest={oncolAddRequest}
	/>
{/each}
