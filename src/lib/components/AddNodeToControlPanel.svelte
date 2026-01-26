<script lang="ts">
	import { run } from 'svelte/legacy';

	import { getContext } from 'svelte';
	interface Props {
		prefix?: string;
		node: any;
	}

	let { prefix = '', node }: Props = $props();
	let activeArgumentsContext = getContext(`${prefix}activeArgumentsContext`) as any;
	const { mergedChildren_controlPanel_Store } = getContext(
		`${prefix}OutermostQMSWraperContext`
	) as any;
	let currentObject = {
		stepsOfFieldsThisAppliesTo: activeArgumentsContext?.stepsOfFieldsThisAppliesTo,
		nodeId: node.id,
		id: Date.now() + Math.random()
	};
	let objIsStarred = $derived(mergedChildren_controlPanel_Store.getObj(currentObject));
	run(() => {});
</script>

<button
	class="btn flex btn-xs"
	aria-label="Add node to control panel"
	onclick={() => {
		if (objIsStarred) {
			mergedChildren_controlPanel_Store.delete(currentObject);
		} else {
			mergedChildren_controlPanel_Store.addOrReplaceKeepingOldId(currentObject);
		}
		objIsStarred = mergedChildren_controlPanel_Store.getObj(currentObject);
	}}
>
	<i class="bi {objIsStarred ? 'bi-star-fill' : 'bi-star'}"></i>
</button>
