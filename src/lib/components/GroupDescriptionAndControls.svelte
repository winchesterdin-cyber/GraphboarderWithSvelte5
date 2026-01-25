<script lang="ts">
	import Toggle from '$lib/components/fields/Toggle.svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	interface Props {
		prefix?: string;
		hasGroup_argsNode: any;
	}

	let { prefix = '', hasGroup_argsNode }: Props = $props();

	const dndIsOn = getContext(`${prefix}dndIsOn`) as Writable<boolean>;
	const showInputField = getContext(`${prefix}showInputField`) as Writable<boolean>;
	const mutationVersion = getContext(`${prefix}mutationVersion`) as Writable<boolean>;
</script>

<div class="btn ml-4 flex w-min btn-ghost btn-xs {hasGroup_argsNode ? '' : 'pt-1'}">
	<Toggle
		useSwap
		swapOnText="dnd"
		showValue={false}
		otherClases="toggle-xs"
		rawValue={$dndIsOn}
		onChanged={() => {
			$dndIsOn = !$dndIsOn;
		}}
	/>
</div>
<div class="btn ml-4 flex w-min btn-ghost btn-xs {hasGroup_argsNode ? '' : 'pt-1'}">
	<Toggle
		useSwap
		swapOnText="field"
		showValue={false}
		otherClases="toggle-xs"
		rawValue={$showInputField}
		onChanged={() => {
			$showInputField = !$showInputField;
		}}
	/>
</div>
<div class="btn ml-4 flex w-min btn-ghost btn-xs {hasGroup_argsNode ? '' : 'pt-1'}">
	<Toggle
		useSwap
		swapOnText="mutVer"
		showValue={false}
		otherClases="toggle-xs"
		rawValue={$mutationVersion}
		onChanged={() => {
			$mutationVersion = !$mutationVersion;
		}}
	/>
</div>
