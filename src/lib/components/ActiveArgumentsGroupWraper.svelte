<script lang="ts">
	import ActiveArgumentsGroup_addFilterAndSortingButton from '$lib/components/ActiveArgumentsGroup_addFilterAndSortingButton.svelte';
	import ActiveArgumentsGroup_info from '$lib/components/ActiveArgumentsGroup_info.svelte';
	import ActiveArgumentsGroupNormal from '$lib/components/ActiveArgumentsGroupNormal.svelte';
	import { getContext, setContext } from 'svelte';
	import ActiveArgumentsGroupHasFilterOperators from '$lib/components/ActiveArgumentsGroupHasFilterOperators.svelte';
	import Toggle from './fields/Toggle.svelte';
	import { writable } from 'svelte/store';
	import GroupDescriptionAndControls from './GroupDescriptionAndControls.svelte';

	interface Props {
		group: any;
		argsInfo: any;
		update_activeArgumentsDataGrouped: any;
		activeArgumentsDataGrouped: any;
		prefix?: string;
		onUpdateQuery?: () => void;
	}

	let {
		group = $bindable(),
		argsInfo,
		update_activeArgumentsDataGrouped,
		activeArgumentsDataGrouped,
		prefix = '',
		onUpdateQuery
	}: Props = $props();

	let dragDisabled = true;
	function handleSort(e: any) {
		group.group_args = e.detail.items;
		dragDisabled = true;
	}
	const hasGroup_argsNode = group.group_argsNode;

	const { finalGqlArgObj_Store } = getContext(`${prefix}QMSWraperContext`) as any;
	const CPItemContext = getContext(`${prefix}CPItemContext`) as any;

	const dndIsOn = writable(false);
	const showInputField = writable(false);
	setContext('dndIsOn', dndIsOn);
	setContext('showInputField', showInputField);

	// const mutationVersion = writable(
	// 	!CPItemContext || group.group_argsNode[CPItemContext.CPItem.nodeId]?.operator ? false : true
	// );
	const mutationVersion = writable(false);
	setContext('mutationVersion', mutationVersion);
	let activeArgumentsContext = getContext(`${prefix}activeArgumentsContext`) as any;
</script>

{#if !CPItemContext}
	<div class="flex space-x-1">
		<ActiveArgumentsGroup_info {group} />
		{#if !hasGroup_argsNode}
			<ActiveArgumentsGroup_addFilterAndSortingButton
				{onUpdateQuery}
				bind:group
				{argsInfo}
				{update_activeArgumentsDataGrouped}
				{activeArgumentsDataGrouped}
				node={group.group_argsNode?.mainContainer}
			/>
		{/if}
		<GroupDescriptionAndControls {hasGroup_argsNode} />
	</div>{/if}

<div class="pb-10==">
	{#if hasGroup_argsNode}
		<div class=" overflow-x-auto overflow-y-visible">
			<ActiveArgumentsGroupHasFilterOperators
				addDefaultFields={true}
				onUpdateQuery={() => {
					onUpdateQuery?.();
					group.group_args = Object.values(group.group_argsNode)?.filter((node: any) => {
						return !node?.operator;
					});
					update_activeArgumentsDataGrouped(group);
					if (!activeArgumentsContext.isControlPanelChild) {
						finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
					}
				}}
				type={group.group_name + 'ActiveArgumentsGroupHasFilterOperators'}
				node={CPItemContext
					? group.group_argsNode[CPItemContext?.CPItem.nodeId]
					: group.group_argsNode.mainContainer}
				originalNodes={group.group_argsNode}
				{group}
				nodes={group.group_argsNode}
				onChanged={() => {
					group.group_args = Object.values(group.group_argsNode)?.filter((node: any) => {
						return !node?.operator;
					});
					update_activeArgumentsDataGrouped(group);
					onUpdateQuery?.();
				}}
				parentNodeId={
					CPItemContext
						? CPItemContext?.CPItem.nodeId
						: group.group_argsNode.mainContainer.id
				}
				availableOperators={[]}
			/>
		</div>
	{:else}
		<ActiveArgumentsGroupNormal
			onUpdateQuery={() => {
				update_activeArgumentsDataGrouped(group);
				finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
			}}
			bind:group
			{argsInfo}
			{update_activeArgumentsDataGrouped}
			{activeArgumentsDataGrouped}
		/>
	{/if}
</div>
