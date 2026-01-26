<script lang="ts">
	import { getContext } from 'svelte';
	import ManyToAllSelectInterfaceDefinitionItem from './ManyToAllSelectInterfaceDefinitionItem.svelte';
	import { getDeepField, getRootType } from '$lib/utils/usefulFunctions';
	interface Props {
		nodes: any;
		parentNodeId: any;
		parentNode?: any;
		node: any;
		availableOperators: any;
		group: any;
		type: any;
		originalNodes: any;
		prefix?: string;
		addDefaultFields: any;
		showSelectQMSModal?: boolean;
		rowSelectionState?: any;
		selectedQMS: any;
		selectedRowsColValues?: any;
	}

	let {
		nodes,
		parentNodeId,
		parentNode = nodes[parentNodeId],
		node,
		availableOperators,
		group,
		type,
		originalNodes,
		prefix = '',
		addDefaultFields,
		showSelectQMSModal = false,
		rowSelectionState = {},
		selectedQMS,
		selectedRowsColValues = []
	}: Props = $props();

	//
	let mainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as any;
	const endpointInfo = mainWraperContext?.endpointInfo;
	const schemaData = mainWraperContext?.schemaData;
	//
	const OutermostQMSWraperContext = getContext(`${prefix}OutermostQMSWraperContext`) as any;
	const { QMSFieldToQMSGetMany_Store } = OutermostQMSWraperContext;
	const inputFieldsContainerLocation = endpointInfo.get_inputFieldsContainerLocation(
		node,
		schemaData
	);
	const inputFieldsContainer = getDeepField(
		node,
		inputFieldsContainerLocation,
		schemaData,
		'inputFields'
	);
	const inputFieldsContainerRoot = getRootType(null, inputFieldsContainer?.dd_rootName, schemaData);
	const inputFields = inputFieldsContainerRoot?.inputFields || [];
</script>

<div class="flex space-x-2">
	<!-- {inputFieldsContainer?.dd_kindList ? '(LIST) ' : '(OBJECT) '} -->
	{#each inputFields as field}
		<ManyToAllSelectInterfaceDefinitionItem
			{field}
			{nodes}
			{parentNodeId}
			{parentNode}
			{node}
			{availableOperators}
			{group}
			{type}
			{originalNodes}
			{prefix}
			{addDefaultFields}
			bind:showSelectQMSModal
			{selectedRowsColValues}
		/>
	{/each}
</div>
