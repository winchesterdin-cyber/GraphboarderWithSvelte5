<script lang="ts">
	import ActiveArgumentsGroupHasFilterOperators from './ActiveArgumentsGroupHasFilterOperators.svelte';
	import SelectModal from './SelectModal.svelte';

	import {
		filterElFromArr,
		getDataGivenStepsOfFields,
		getDeepField,
		getPreciseType,
		getQMSWraperCtxDataGivenControlPanelItem,
		getRootType
	} from './../utils/usefulFunctions';
	//!!! chnage bonded to item
	import { flip } from 'svelte/animate';
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
	import { getContext, setContext } from 'svelte';
	import ActiveArgument from '$lib/components/ActiveArgument.svelte';
	import ActiveArgumentsGroup_addFilterAndSortingButtonContent from '$lib/components/ActiveArgumentsGroup_addFilterAndSortingButtonContent.svelte';
	import Modal from './Modal.svelte';
	import { nodeAddDefaultFields } from '$lib/utils/usefulFunctions';
	import {
		stepsOfNodesToStepsOfFields,
		getUpdatedStepsOfNodes,
		updateNodeSteps
	} from '$lib/utils/nodeStepsUtils';
	import { generateGroupDisplayTitle } from '$lib/utils/displayTitleUtils';
	import {
		getShadowDimensions,
		updateShadowElement,
		handleDragStart,
		handleDragKeyDown,
		transformDraggedElement as transformDraggedElementUtil,
		handleDndConsider as handleDndConsiderUtil,
		handleDndFinalize as handleDndFinalizeUtil,
		handleDeleteItem
	} from '$lib/utils/dndUtils';
	import { writable } from 'svelte/store';
	import AddNodeToControlPanel from './AddNodeToControlPanel.svelte';
	import GroupDescriptionAndControls from './GroupDescriptionAndControls.svelte';
	import SelectedRowsDisplay from './SelectedRowsDisplay.svelte';
	import { addToast } from '$lib/stores/toastStore';
	import type {
		ContainerData,
		ActiveArgumentData,
		QMSWraperContext,
		QMSMainWraperContext
	} from '$lib/types';

	// Props interface - using specific types where possible, falling back to Record<string, any> or unknown for loose structures
	interface Props {
		nodes: Record<string, ContainerData | ActiveArgumentData>;
		parentNodeId: string;
		parentNode?: ContainerData;
		node: ContainerData | ActiveArgumentData;
		availableOperators: any; // Complex type, leaving as any for now
		group: any;
		type: any;
		originalNodes: any;
		prefix?: string;
		addDefaultFields?: boolean; // Changed to boolean based on usage
		onChanged?: () => void;
		onUpdateQuery?: () => void;
		onChildrenStartDrag?: (e?: any) => void;
		onDeleteSubNode?: (detail: { id: string }) => void;
	}

	let {
		nodes = $bindable(),
		parentNodeId,
		parentNode = nodes[parentNodeId] as ContainerData,
		node = $bindable(),
		availableOperators,
		group = $bindable(),
		type,
		originalNodes,
		prefix = '',
		addDefaultFields,
		onChanged,
		onUpdateQuery,
		onChildrenStartDrag,
		onDeleteSubNode
	}: Props = $props();

	let stepsOfNodes = $state<unknown[]>([]);
	let stepsOfFields = $state<string[]>([]);
	let stepsOfFieldsFull = $state<string[]>([]);
	let testName_stepsOFFieldsWasUpdated = $state(false);

	const OutermostQMSWraperContext = getContext(
		`${prefix}OutermostQMSWraperContext`
	) as QMSWraperContext;
	const { QMSFieldToQMSGetMany_Store } = OutermostQMSWraperContext;
	let getManyQMS = $state<any>();
	///

	let nodeContext_forDynamicData: any = {};
	if ((node as any).nodeContext_forDynamicData) {
		nodeContext_forDynamicData = (node as any).nodeContext_forDynamicData;
	} else {
		nodeContext_forDynamicData.selectedRowsColValues = writable();
		nodeContext_forDynamicData.selectedRowsColValuesProcessed = writable();

		nodeContext_forDynamicData.rowSelectionState = writable();
		nodeContext_forDynamicData.idColName = writable();
		nodeContext_forDynamicData.selectedQMS = writable();
		nodeContext_forDynamicData.QMSRows = writable();
		nodeContext_forDynamicData.itemColumns = writable();
		nodeContext_forDynamicData.requiredColNames = writable();

		(node as any).nodeContext_forDynamicData = nodeContext_forDynamicData;
	}
	let selectedRowsColValuesAAA = nodeContext_forDynamicData.selectedRowsColValues;
	let selectedRowsColValuesProcessedAAA = nodeContext_forDynamicData.selectedRowsColValuesProcessed;
	let rowSelectionStateAAA = nodeContext_forDynamicData.rowSelectionState;
	let idColNameAAA = nodeContext_forDynamicData.idColName;
	let selectedQMSAAA = nodeContext_forDynamicData.selectedQMS;
	let QMSRowsAAA = nodeContext_forDynamicData.QMSRows;
	let QMSColumnsAAA = nodeContext_forDynamicData.itemColumns;
	let requiredColNamesAAA = nodeContext_forDynamicData.requiredColNames;

	setContext(`${prefix}nodeContext_forDynamicData`, nodeContext_forDynamicData);
	///

	let pathIsInCP = false;
	const nodeContext = getContext(`${prefix}nodeContext`) as { pathIsInCP: boolean } | undefined;
	if (nodeContext) {
		pathIsInCP = nodeContext?.pathIsInCP;
	}

	const CPItemContext = getContext(`${prefix}CPItemContext`) as
		| { CPItem: { nodeId: string } }
		| undefined;
	let nodeIsInCP = $derived(CPItemContext?.CPItem.nodeId == node.id);

	if (CPItemContext?.CPItem.nodeId == node.id) {
		setContext(`${prefix}nodeContext`, { pathIsInCP: true });
	}
	const isCPChild = !!CPItemContext;
	let visibleInCP = $derived(pathIsInCP || nodeIsInCP);
	let visible = $derived(visibleInCP || !CPItemContext || (node as ContainerData).isMain);

	let correctQMSWraperContext: any = ''; // Typed broadly for now as context structure is complex
	if (isCPChild) {
		correctQMSWraperContext = getQMSWraperCtxDataGivenControlPanelItem(
			CPItemContext!.CPItem as any,
			OutermostQMSWraperContext as any
		);
	} else {
		correctQMSWraperContext = getContext(`${prefix}QMSWraperContext`);
	}
	/////end

	const { finalGqlArgObj_Store, QMS_info, activeArgumentsDataGrouped_Store, QMSType } =
		correctQMSWraperContext;
	const operatorChangeHandler = () => {
		stepsOfNodes = getUpdatedStepsOfNodes(
			JSON.parse(JSON.stringify(parentNode?.stepsOfNodes || [])),
			node
		);
	};
	const dndIsOn = getContext('dndIsOn') as any;
	const showInputField = getContext('showInputField');

	const mutationVersion = getContext('mutationVersion') as any;
	if (QMSType == 'mutation') {
		$mutationVersion = true;
	}

	$effect(() => {
		if (!testName_stepsOFFieldsWasUpdated) {
			stepsOfNodes = getUpdatedStepsOfNodes(
				JSON.parse(JSON.stringify(parentNode?.stepsOfNodes || [])),
				node
			);
			testName_stepsOFFieldsWasUpdated = true;
		}
	});

	let MainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as QMSMainWraperContext;
	const endpointInfo = MainWraperContext?.endpointInfo;
	const schemaData = MainWraperContext?.schemaData;
	let dragDisabled = $state(true);
	const flipDurationMs = 500;

	function handleDndConsider(e: CustomEvent<DndEvent<any>>) {
		// e.detail.items is generic Item[] but contains our ContainerItem structure
		const result = handleDndConsiderUtil(e.detail.items);
		(node as ContainerData).items = result.items;
		dragDisabled = result.dragDisabled;
	}
	function handleDndFinalize(e: CustomEvent<DndEvent<any>>) {
		const result = handleDndFinalizeUtil(e.detail.items, () => {
			nodes = { ...nodes };
			handleChanged();
			onChanged?.();
		});
		(node as ContainerData).items = result.items;
		dragDisabled = result.dragDisabled;
	}

	const deleteItem = (e: { detail: { id: string } }) => {
		(node as ContainerData).items = handleDeleteItem(
			(node as ContainerData).items,
			e.detail.id,
			() => {
				nodes = { ...nodes };
				handleChanged();
				onChanged?.();
			}
		);
	};
	//
	let labelEl = $state<HTMLElement>();
	let shadowEl = $state<HTMLElement>();
	let shadowHeight = $state(20);
	let shadowWidth = $state(20);

	let labelElClone = $state();

	function startDrag(e: any) {
		// preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
		//e.preventDefault();
		dragDisabled = handleDragStart(e);
	}
	function handleKeyDown(e: KeyboardEvent) {
		dragDisabled = handleDragKeyDown(e, dragDisabled);
	}
	const transformDraggedElement = (
		draggedEl: HTMLElement | undefined,
		data: any,
		index: number | undefined
	) => {
		transformDraggedElementUtil(draggedEl);
	};
	//

	const handleChanged = () => {
		finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
	};

	let argsInfo = $state(QMS_info?.args);
	let showModal = $state(false);

	let groupDisplayTitle = $derived(generateGroupDisplayTitle(node, getPreciseType));

	$effect(() => {
		if ((node as any)?.addDefaultFields || ((node as ContainerData)?.isMain && addDefaultFields)) {
			nodeAddDefaultFields(
				node as ContainerData,
				prefix,
				group,
				activeArgumentsDataGrouped_Store,
				schemaData,
				endpointInfo
			);
		}
	});

	let showSelectModal = $state(false);

	let showAddModal = $state(false);
	let selectedRowsColValues = $state([]);

	//------------
	let inputColumnsLocationQMS_Info = $state<any>();
	//!! todo:before getting inputColumnsLocation value,you should check if it is a query or a mutation,and handle it accordingly
	let inputColumnsLocation = $endpointInfo?.inputColumnsPossibleLocationsInArg?.find(
		(path: string[]) => {
			inputColumnsLocationQMS_Info = getDeepField(node as any, path, schemaData, 'inputFields');
			return inputColumnsLocationQMS_Info;
		}
	);
	//should work
	let idColName = $state();

	//should work
	//------------

	let QMSWraperContextForSelectedQMS = {};
	let activeArgumentsContext = getContext(`${prefix}activeArgumentsContext`);
	let forceShowSelectAndAddButtons = false;
	$effect(() => {
		if ($QMSFieldToQMSGetMany_Store.length > 0) {
			getManyQMS = QMSFieldToQMSGetMany_Store.getObj({
				nodeOrField: node
			})?.getMany?.selectedQMS;
			if (getManyQMS) {
			}
		}
	});

	$effect(() => {
		stepsOfFieldsFull = stepsOfNodesToStepsOfFields(stepsOfNodes);
		stepsOfFields = filterElFromArr(stepsOfFieldsFull, ['list', 'bonded']);
		updateNodeSteps(
			node,
			stepsOfFieldsFull,
			stepsOfFields,
			stepsOfNodes as any[],
			filterElFromArr
		);
	});
	$effect(() => {
		if (labelEl) {
			const dimensions = getShadowDimensions(labelEl);
			shadowHeight = dimensions.height;
			shadowWidth = dimensions.width;
		}
	});
	$effect(() => {
		if (shadowHeight && shadowEl) {
			labelElClone = updateShadowElement(
				shadowEl,
				labelEl as HTMLElement | null,
				shadowHeight,
				shadowWidth
			);
		}
	});

	$effect(() => {
		if (QMSWraperContextForSelectedQMS) {
			idColName = (QMSWraperContextForSelectedQMS as any).idColName;
		}
	});
</script>

{#if visible}
	{#if showAddModal}
		<Modal
			showApplyBtn={false}
			onCancel={() => {
				showAddModal = false;
			}}
		/>
	{/if}

	{#if showModal}
		<Modal
			showApplyBtn={false}
			onCancel={() => {
				showModal = false;
			}}
		>
			<div class="flex flex-col">
				<div class="mb-2 w-full text-center text-lg">
					<p class="badge font-bold badge-info">
						{groupDisplayTitle}
					</p>
				</div>

				{#if (node as ContainerData)?.isMain}
					<button
						class="btn mb-6 flex-1 normal-case btn-xs btn-info"
						onclick={() => {
							nodeAddDefaultFields(
								node as ContainerData,
								prefix,
								group,
								activeArgumentsDataGrouped_Store,
								schemaData,
								endpointInfo
							);
						}}
					>
						addDefaultFields
					</button>
				{/if}

				{#if !(node as ContainerData)?.isMain}
					<div class="flex space-x-4">
						{#if parentNode?.inputFields?.some((inputField) => {
							return inputField.dd_displayName == '_not';
						})}
							<div class="form-control mr-1">
								<label class="label w-min cursor-pointer py-0">
									<span class="label-text pr-1">Not</span>
									<input
										type="checkbox"
										class="toggle toggle-sm"
										checked={node.not}
										onchange={(e) => {
											e.stopPropagation();
											e.preventDefault();
											if (!(node as ContainerData)?.isMain) {
												node.not = !node.not;
												operatorChangeHandler();
												handleChanged();
												onChanged?.();
											}
										}}
									/>
								</label>
							</div>
						{/if}

						<button
							class="btn mb-6 flex-1 normal-case btn-xs btn-info"
							onclick={() => {
								nodeAddDefaultFields(
									node as ContainerData,
									prefix,
									group,
									activeArgumentsDataGrouped_Store,
									schemaData,
									endpointInfo
								);
							}}
						>
							addDefaultFields
						</button>

						<button
							class="btn mb-1 flex-1 text-sm normal-case btn-xs"
							onclick={() => {
								const _node = node as ContainerData;
								if (_node?.operator && !_node?.isMain) {
									if (_node?.operator == '~spread~') {
										_node.operator = 'bonded';
									} else if (_node?.operator == 'bonded') {
										_node.operator = '~spread~';
									} else {
										_node.operator = 'bonded';
									}
								}
								operatorChangeHandler();
								handleChanged();
								onChanged?.();
							}}
						>
							change
						</button>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<button
							class="btn mb-6 flex-1 btn-xs btn-warning"
							aria-label="Delete group"
							onclick={() => {
								addToast('Delete group not yet implemented', 'warning');
							}}
						>
							<i class="bi bi-trash-fill"></i>
						</button>
						{#if !CPItemContext}
							<AddNodeToControlPanel {node} />
						{/if}
					</div>
				{/if}
				<!-- <div class="my-2 flex">
					<div class="card w-full bg-neutral text-neutral-content overflow-x-auto">
						<div class="card-body  pl-0">
							<ManyToAllSelectInterfaceDefinition
								bind:selectedRowsColValues
								{originalNodes}
								{type}
								bind:nodes
								{node}
								{parentNode}
								{parentNodeId}
								{availableOperators}
								{group}
							/>
						</div>
					</div>
				</div> -->
				<div>
					<ActiveArgumentsGroup_addFilterAndSortingButtonContent
						parent_inputFields={parentNode?.inputFields}
						{onUpdateQuery}
						bind:group
						{argsInfo}
						{node}
						activeArgumentsDataGrouped={[]}
					/>
				</div>
			</div>
		</Modal>{/if}

	<SelectModal
		onDeleteSubNode={(detail: any) => {
			deleteItem({ detail });
			//
		}}
		bindSelectedQMS={getManyQMS}
		bindSelectedRowsColValues={selectedRowsColValues}
		bind:showSelectModal
		{originalNodes}
		{onUpdateQuery}
		{type}
		bind:nodes
		{node}
		{parentNode}
		{parentNodeId}
		{onChanged}
		{availableOperators}
		onChildrenStartDrag={startDrag}
		{group}
	/>

	{#if !(node as ContainerData)?.isMain}
		<div class="   w-min-max grid w-max content-center rounded-full">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="flex">
				{#if $dndIsOn && !nodeIsInCP}
					<div
						role="button"
						tabindex={dragDisabled ? 0 : -1}
						aria-label="drag-handle"
						class="  transition:all bi bi-grip-vertical -mr-1 ml-2 rounded-l-md text-lg duration-500 {(node as ContainerData)?.operator ==
							undefined || (node as ContainerData)?.operator == 'bonded'
							? 'text-base-content'
							: (node as ContainerData)?.operator == '_and'
								? 'text-primary'
								: 'text-secondary'}
						{node?.not ? ' bg-gradient-to-r== from-base-300/100==' : 'bg-error/0'}
						"
						style={dragDisabled ? 'cursor: grab' : 'cursor: grabbing'}
						onmousedown={(e) => {
							// preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
							e.preventDefault();

							onChildrenStartDrag?.();
						}}
						ontouchstart={(e) => {
							// preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
							e.preventDefault();

							onChildrenStartDrag?.();
						}}
						onkeydown={handleKeyDown}
						oncontextmenu={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}}
					></div>
				{/if}
				<!-- node?.items?.length <= 1 -->
				{#if (node as ContainerData)?.operator && !$mutationVersion}
					<button
						class="btn rounded-full px-[1px] text-xs font-light normal-case btn-ghost transition-all duration-500 btn-xs {(node as ContainerData)?.operator ==
							'bonded' || (node as ContainerData)?.operator == 'list'
							? 'text-base-content'
							: (node as ContainerData)?.operator == '_and'
								? 'text-primary'
								: 'text-secondary'} h-max w-max break-all
						{node?.not ? ' bg-gradient-to-r from-secondary/50' : 'bg-error/0'}
						"
						onclick={() => {
							showModal = true;
						}}
						oncontextmenu={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}}
					>
						{groupDisplayTitle}
						<!-- <sub>{stepsOfFields.join('->')}</sub> -->
						{#if node.dd_NON_NULL}
							<sup>
								<i class="bi bi-asterisk text-primary"></i>
							</sup>
						{/if}
					</button>
					{#if nodeIsInCP && (node as ContainerData)?.operator}
						<GroupDescriptionAndControls hasGroup_argsNode={(node as any).group_argsNode} />
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		role="group"
		class="  w-min-max w-max transition-all duration-500
	
	
	{(node as ContainerData)?.operator && ((node as ContainerData).items.length > 1 || ($mutationVersion && (node as ContainerData).items.length >= 1))
			? 'bg-gradient-to-rxxx my-1==   rounded-l-md border-l-[1px] shadow-sm'
			: ''} 
	{(node as ContainerData)?.isMain ? '  bg-gradient-to-rxxx my-1==   rounded-l-md border-l-[2px] shadow-sm' : ''}
{(node as ContainerData)?.operator && node?.not ? 'border-dashed  ' : ''}
{(node as ContainerData)?.operator == 'bonded' || (node as ContainerData)?.operator == 'list'
			? 'border-base-content'
			: (node as ContainerData)?.operator == '_and'
				? 'border-primary'
				: 'border-secondary '}


"
		oncontextmenu={(e) => {
			e.stopPropagation();
			e.preventDefault();
		}}
		bind:this={labelEl}
		onmousedown={() => {
			dragDisabled = true;
		}}
		ontouchstart={() => {
			dragDisabled = true;
		}}
		onkeydown={() => {
			dragDisabled = true;
		}}
	>
		{#if (node as ContainerData)?.operator}
			{#if $mutationVersion && !(node as ContainerData)?.isMain}
				<div class="flex">
					<button
						class="btn rounded-full px-[1px] text-xs font-light normal-case btn-ghost transition-all duration-500 btn-xs {getManyQMS ||
						$selectedQMSAAA
							? 'text-secondary'
							: ''}   {(node as ContainerData)?.operator == 'bonded' || (node as ContainerData)?.operator == 'list'
							? 'text-base-content'
							: (node as ContainerData)?.operator == '_and'
								? 'text-primary'
								: 'text-secondary'} h-max w-max break-all
						{node?.not ? ' bg-gradient-to-r from-secondary/50' : 'bg-error/0'}
						"
						onclick={() => {
							showModal = true;
						}}
						oncontextmenu={(e) => {
							e.stopPropagation();
							e.preventDefault();
							showSelectModal = !showSelectModal;
						}}
					>
						{groupDisplayTitle}
						{#if node.dd_NON_NULL}
							<sup>
								<i class="bi bi-asterisk text-primary"></i>
							</sup>
						{/if}
					</button>

					{#if nodeIsInCP && (node as ContainerData)?.operator}
						<GroupDescriptionAndControls hasGroup_argsNode={(node as any).group_argsNode} />
					{/if}
				</div>
				<!-- {#if inputColumnsLocation && inputColumnsLocationQMS_Info.dd_displayName == node.dd_displayName} -->

				{#if (inputColumnsLocation && inputColumnsLocationQMS_Info.dd_displayName == node.dd_displayName) || forceShowSelectAndAddButtons || getManyQMS}
					<!-- {getManyQMS?.dd_displayName} -->
					<!-- <button
						class="btn btn-xs normal-case"
						on:click={() => {
							showSelectModal = true;
						}}>select</button
					>
					<button
						class="btn btn-xs normal-case"
						on:click={() => {
							showAddModal = true;
						}}>add</button
					> -->
				{/if}

				<SelectedRowsDisplay />
			{/if}
			<div class="flex">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- node?.items?.length > 1 || node?.isMain -->

				{#if (node as ContainerData)?.isMain}
					<button
						class="btn rounded-full px-[1px] text-xs font-light normal-case btn-ghost transition-all duration-500 btn-xs {(node as ContainerData)?.operator ==
							'bonded' || (node as ContainerData)?.operator == 'list'
							? 'text-base-content'
							: (node as ContainerData)?.operator == '_and'
								? 'text-primary'
								: 'text-secondary'} h-max w-max break-all"
						onclick={() => {
							showModal = true;
						}}
					>
						{groupDisplayTitle}
						{#if node.dd_NON_NULL}
							<sup>
								<i class="bi bi-asterisk text-primary"></i>
							</sup>
						{/if}
					</button>
				{/if}
				<p class="grow"></p>
			</div>
		{:else}
			<div class="w-full rounded-box pr-2">
				<div class=" transition-color ringxxx ring-1xxx rounded-box duration-500">
					<ActiveArgument
						{onUpdateQuery}
						bind:nodes={nodes as any}
						{onChanged}
						startDrag={startDrag}
						onChildrenStartDrag={startDrag}
						{parentNode}
						{node}
						parentNodeId={node.id}
						{availableOperators}
						onContextmenuUsed={() => {
							if (!(node as ContainerData)?.isMain) {
								node.not = !node.not;
								handleChanged();
								onChanged?.();
							}
						}}
						isNot={node.not || false}
						onInUseChanged={() => {}}
						activeArgumentData={node as ActiveArgumentData}
						{group}
						activeArgumentsDataGrouped={[]}
						originalNodes={[]}
						{type}
					/>
				</div>
			</div>
		{/if}

		{#if node.hasOwnProperty('items')}
			<section
				class=" duration-500 {$dndIsOn
					? '  min-h-[30px] min-w-[200px]'
					: 'pl-1'} rounded-l-none {(node as ContainerData)?.isMain && !isCPChild
					? ' min-h-[40vh] border-l-2  border-l-transparent md:min-h-[60vh] '
					: ' '}
				 w-full"
				use:dndzone={{
					items: (node as ContainerData).items,
					dragDisabled,
					flipDurationMs,
					transformDraggedElement,
					centreDraggedOnCursor: true,
					type: node?.dd_rootName || 'default'
				}}
				onconsider={handleDndConsider}
				onfinalize={handleDndFinalize}
			>
				<!-- WE FILTER THE SHADOW PLACEHOLDER THAT WAS ADDED IN VERSION 0.7.4, filtering this way rather than checking whether 'nodes' have the id became possible in version 0.9.1 -->
				{#if (node as ContainerData).items.length > 1 || (node as ContainerData)?.isMain || true}
					{#each (node as ContainerData).items.filter((item) => {
						return item.id !== SHADOW_PLACEHOLDER_ITEM_ID;
					}) as item (item.id)}
						<div
							animate:flip={{ duration: flipDurationMs }}
							class="    border-2== max-w-min {$mutationVersion && 'mt-2'} "
						>
							<div class="dnd-item flex">
								{#if testName_stepsOFFieldsWasUpdated}
									{#key stepsOfFields}
										<ActiveArgumentsGroupHasFilterOperators
											onDeleteSubNode={(detail) => {
												deleteItem({ detail });
												//
											}}
											{originalNodes}
											{onUpdateQuery}
											{type}
											bind:nodes
											node={nodes[item.id]}
											parentNode={node as ContainerData}
											parentNodeId={node.id}
											{onChanged}
											{availableOperators}
											onChildrenStartDrag={startDrag}
											{group}
										/>
									{/key}
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</section>
		{/if}
	</div>
	{#if node.id == SHADOW_PLACEHOLDER_ITEM_ID}
		<div class=" visible top-0 left-0 ml-8 h-0" id="shadowEl" bind:this={shadowEl}></div>
	{/if}
{/if}
