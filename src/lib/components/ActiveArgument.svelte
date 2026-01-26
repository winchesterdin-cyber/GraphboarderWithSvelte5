<script lang="ts">
	import Type from '$lib/components/Type.svelte';
	import Description from './Description.svelte';
	import { writable, type Writable } from 'svelte/store';
	import AutoInterface from '$lib/components/fields/AutoInterface.svelte';
	import { SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import { getContext, setContext } from 'svelte';
	import type {
		ActiveArgumentData,
		ActiveArgumentGroup,
		ContainerData,
		QMSWraperContext,
		QMSMainWraperContext
	} from '$lib/types/index';
	import Toggle from '$lib/components/fields/Toggle.svelte';
	import { clickOutside } from '$lib/actions/clickOutside';
	import Modal from './Modal.svelte';
	import { string_transformerREVERSE } from '$lib/utils/dataStructureTransformers';
	import {
		argumentCanRunQuery,
		formatData,
		getPreciseType,
		getRootType
	} from '$lib/utils/usefulFunctions';
	import AddNodeToControlPanel from './AddNodeToControlPanel.svelte';
	import GroupDescriptionAndControls from './GroupDescriptionAndControls.svelte';
	import SelectModal from './SelectModal.svelte';
	import ExplorerTable from './ExplorerTable.svelte';
	import SelectedRowsDisplay from './SelectedRowsDisplay.svelte';

	interface Props {
		setNotInUseIfNotValid?: boolean;
		setNotInUseIfNotValidAndENUM?: boolean;
		parentNode?: ContainerData | ActiveArgumentData;
		node?: ActiveArgumentData | ContainerData;
		prefix?: string;
		isNot?: boolean;
		activeArgumentData: ActiveArgumentData;
		group: ActiveArgumentGroup;
		activeArgumentsDataGrouped?: ActiveArgumentGroup[];
		nodes?: (ActiveArgumentData | ContainerData)[];
		originalNodes?: (ActiveArgumentData | ContainerData)[];
		type?: string;
		parentNodeId?: string;
		availableOperators?: string[];
		startDrag?: (e: any) => void;
		onChanged?: (detail: any) => void;
		onInUseChanged?: () => void;
		onContextmenuUsed?: () => void;
		onUpdateQuery?: () => void;
		onDeleteSubNode?: (detail: { id: string }) => void;
		onChildrenStartDrag?: (e?: any) => void;
	}

	let {
		setNotInUseIfNotValid = true,
		setNotInUseIfNotValidAndENUM = true,
		parentNode = undefined,
		node = undefined,
		prefix = '',
		isNot = $bindable(false),
		activeArgumentData = $bindable(),
		group,
		activeArgumentsDataGrouped = [],
		nodes = $bindable([]),
		originalNodes = [],
		type = '',
		parentNodeId = '',
		availableOperators = [],
		startDrag = () => {},
		onChanged,
		onInUseChanged,
		onContextmenuUsed,
		onUpdateQuery,
		onDeleteSubNode,
		onChildrenStartDrag
	}: Props = $props();

	const { activeArgumentsDataGrouped_Store } = getContext(
		`${prefix}QMSWraperContext`
	) as QMSWraperContext;
	const { finalGqlArgObj_Store } = getContext(`${prefix}QMSWraperContext`) as QMSWraperContext;
	//
	let idColNameOfSelectedRow: string | undefined;
	//
	setContext(
		'choosenDisplayInterface',
		writable(activeArgumentData.chosenDisplayInterface || activeArgumentData.dd_displayInterface)
	);
	let showDescription: boolean = false;
	let labelEl: HTMLLabelElement | undefined = $state();
	let shadowEl: HTMLDivElement | undefined = $state();
	let shadowHeight: number = $state(20);
	let shadowWidth: number = $state(20);

	let labelElClone: Node | undefined = $state();

	$effect(() => {
		if (labelEl) {
			shadowHeight = labelEl.clientHeight;
			shadowWidth = labelEl.clientWidth;
		}
	});

	$effect(() => {
		if (shadowHeight && shadowEl) {
			if (shadowEl.style.height == '0px' || shadowEl.style.height == '') {
				shadowEl.style.height = `${shadowHeight + 18}px`;
				shadowEl.style.width = `${shadowWidth}px`;

				if (labelEl) {
					labelElClone = labelEl.cloneNode(true);
					// Casting to Element to access classList
					(labelElClone as Element).classList.remove('dnd-item');
					(labelElClone as Element).classList.add('border-2', 'border-accent');
					shadowEl.appendChild(labelElClone);
				}
			}
		}
	});
	let get_valueToDisplay = (): string | undefined => {
		let value: string | undefined;
		if (getPreciseType(activeArgumentData.chd_dispatchValue) == 'number') {
			value = String(activeArgumentData.chd_dispatchValue);
		}
		if (activeArgumentData.dd_displayInterface == 'ENUM') {
			let chd_dispatchValue = activeArgumentData.chd_dispatchValue;
			// check if array
			if (Array.isArray(chd_dispatchValue) && chd_dispatchValue.length > 0) {
				value = chd_dispatchValue.join(', ');
			} else if (typeof chd_dispatchValue === 'string' && chd_dispatchValue.length > 0) {
				value = chd_dispatchValue;
			} else {
				value = undefined;
			}
		} else {
			if (Array.isArray(activeArgumentData.chd_dispatchValue)) {
				value = activeArgumentData.chd_dispatchValue.join(', ');
			} else if (typeof activeArgumentData.chd_dispatchValue == 'string') {
				value = string_transformerREVERSE(
					((activeArgumentData.chd_dispatchValue as string) ||
						(activeArgumentData.defaultValue as string)) as any
				) as string;
			}
		}

		if (activeArgumentData.chd_dispatchValue && activeArgumentData.dd_displayInterface == 'geo') {
			value = '[map]';
		}

		return value;
	};
	const CPItemContext = getContext(`${prefix}CPItemContext`) as any;
	const CPItem = CPItemContext?.CPItem;
	let expandedVersion: boolean = $state(false);
	let valueToDisplay: string | undefined = $state(undefined);
	$effect(() => {
		if (true || activeArgumentData?.inUse) {
			valueToDisplay = get_valueToDisplay();
		}
		// if (valueToDisplay !== undefined ) {
		if (!CPItemContext) {
			expandedVersion = false;
		} else {
			expandedVersion = true;
		}
	});
	const outermostQMSWraperContext = getContext(
		`${prefix}OutermostQMSWraperContext`
	) as QMSWraperContext;
	const { mergedChildren_QMSWraperCtxData_Store } = outermostQMSWraperContext;

	const handleChanged = (detail: Partial<ActiveArgumentData>): void => {
		// Create a new object instead of mutating the bindable prop
		// This ensures Svelte 5 reactivity works correctly
		activeArgumentData = { ...activeArgumentData, ...detail };

		const isValid: boolean = argumentCanRunQuery(activeArgumentData);
		const isInUse: boolean | undefined = activeArgumentData.inUse;
		const isENUM: boolean = activeArgumentData.dd_displayInterface == 'ENUM';
		if (!isInUse && isValid) {
			inUse_set(true);
		} else if (setNotInUseIfNotValidAndENUM && isInUse && isENUM && !isValid) {
			inUse_set(false);
		} else if (setNotInUseIfNotValid && isInUse && !isValid) {
			inUse_set(false);
		}
		onChanged?.(detail);
		updateActiveArgument();
		//finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
	};
	const handleClickOutside = (): void => {
		//
		//expandedVersion = false; //!!! this is causing the expanded version to disappear when you click outside of it,but sometimes,is not desirable like when another modal with choises opens up and if you click on anything that upper modal disappears.
	};

	const updateActiveArgument = (): void => {
		if (!CPItemContext) {
			activeArgumentsDataGrouped_Store.update_activeArgument(
				activeArgumentData,
				group.group_name
			);
			finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
		}
		//update the activeArgumentsDataGrouped_StoreForCPItem and related
		if (CPItem) {
			const QMSWraperCtxData_StoreForCPItem = $mergedChildren_QMSWraperCtxData_Store.find(
				(currCtx: any) => {
					return currCtx.stepsOfFields.join() == CPItem.stepsOfFieldsThisAppliesTo.join();
				}
			);
			const activeArgumentsDataGrouped_StoreForCPItem =
				QMSWraperCtxData_StoreForCPItem.activeArgumentsDataGrouped_Store;
			activeArgumentsDataGrouped_StoreForCPItem.update_activeArgument(
				activeArgumentData,
				group.group_name
			);
			QMSWraperCtxData_StoreForCPItem.finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj(); //!!!is not enough to rerun query it seems
		}
	};
	const inUse_set = (inUse: boolean): void => {
		activeArgumentData.inUse = inUse;
		updateActiveArgument();

		onInUseChanged?.();
		//finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
	};
	const inUse_toggle = (): void => {
		inUse_set(!activeArgumentData.inUse);
	};
	let showModal: boolean = $state(false);
	const mutationVersion = getContext('mutationVersion') as Writable<any>;
	const showInputField = getContext('showInputField') as Writable<any>;

	let activeArgumentsContext = getContext(`${prefix}activeArgumentsContext`);
	let MainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as QMSMainWraperContext;
	const schemaData = MainWraperContext?.schemaData;
	// const nodeRootType = getRootType(null, activeArgumentData.dd_rootName, schemaData); // schemaData might be null here if context is missing, careful
	let showSelectModal: boolean = $state(false);
	const OutermostQMSWraperContext = getContext(
		`${prefix}OutermostQMSWraperContext`
	) as QMSWraperContext;

	const { QMSFieldToQMSGetMany_Store } = OutermostQMSWraperContext;
	let selectedQMS = $state();
	$effect(() => {
		if ($QMSFieldToQMSGetMany_Store.length > 0) {
			selectedQMS = QMSFieldToQMSGetMany_Store.getObj({
				nodeOrField: node
			})?.getMany?.selectedQMS;
		}
	});
	const nodeContext_forDynamicData = getContext(`${prefix}nodeContext_forDynamicData`) as any;
	let selectedRowsColValues = nodeContext_forDynamicData?.selectedRowsColValues;
</script>

<SelectModal
	onDeleteSubNode={(detail) => {
		onDeleteSubNode?.(detail);
		//
	}}
	bind:showSelectModal
	{onUpdateQuery}
		bind:nodes={nodes as any}
	{onChanged}
	onChildrenStartDrag={startDrag}
	{originalNodes}
	{type}
	{node}
		parentNode={parentNode as any}
	{parentNodeId}
	{availableOperators}
	{group}
/>
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
					<!-- {#if group.group_name == 'root'}
						{activeArgumentData.stepsOfFields?.join(' > ')}
					{:else}
						{activeArgumentData.stepsOfFields?.slice(1)?.join(' > ')}
					{/if} -->
					{activeArgumentData.stepsOfFields[activeArgumentData.stepsOfFields.length - 1]}
				</p>
			</div>

			<div class="mb-6 flex space-x-4">
				{#if parentNode?.inputFields?.some((inputField) => {
					return inputField.dd_displayName == '_not';
				})}
					<div class="form-control">
						<label class="label w-min cursor-pointer py-0">
							<span class="label-text pr-1">Not</span>
							<input
								type="checkbox"
								class="toggle toggle-sm"
								bind:checked={isNot}
								onchange={() => {
									onContextmenuUsed?.();
								}}
							/>
						</label>
					</div>
				{/if}

				<div class="form-control mr-1">
					<label class="label w-min cursor-pointer py-0">
						<span class="label-text pr-1">active</span>
						<input
							type="checkbox"
							class="toggle toggle-xs"
							checked={activeArgumentData?.inUse}
							onchangecapture={(e) => {
								e.stopPropagation();
								inUse_toggle();
							}}
						/>
					</label>
				</div>
				<button
					class="btn flex-1 btn-xs btn-warning"
					aria-label="Delete argument"
					onclick={() => {
						activeArgumentsDataGrouped_Store.delete_activeArgument(
							activeArgumentData,
							group.group_name
						);
						finalGqlArgObj_Store.regenerate_groupsAndfinalGqlArgObj();
					}}
				>
					<i class="bi bi-trash-fill"></i>
				</button>
				{#if !CPItemContext}
					<AddNodeToControlPanel {node} />
				{/if}
				{#if CPItemContext}
					<GroupDescriptionAndControls hasGroup_argsNode={undefined} />
				{/if}
			</div>

			<div class="px-2">
				<AutoInterface
					alwaysOn_interfacePicker
					typeInfo={activeArgumentData}
					onChanged={(detail: any) => {
						handleChanged(detail);
					}}
				/>
			</div>
			<Description QMSInfo={activeArgumentData} {parentNode} {node} />
			<div class="mt-2 w-full overflow-x-auto">
				<Type
					index={0}
					type={activeArgumentData}
					template="default"
					depth={0}
					oncolAddRequest={(e) => {}}
				/>
			</div>
		</div>
	</Modal>{/if}

<!-- svelte-ignore a11y_label_has_associated_control -->
<label
	use:clickOutside
	onclick_outside={handleClickOutside}
	class="   rounded-box {group.group_isRoot ? ' w-min min-w-fit' : 'w-min-fit '}  {!expandedVersion
		? ' pr-1 '
		: ' '} 
	{expandedVersion ? ' pr-2 ' : ' '}
	{$mutationVersion ? ' pr-2 pb-2 ' : ' '} 
		{!expandedVersion && !$mutationVersion ? ' md:max-w-[25vw]' : ' '} 
		 dnd-item my-1 flex
		 {activeArgumentData?.inUse && !$mutationVersion
		? activeArgumentData.canRunQuery
			? 'bg-base-200/75 ring  ring-[1px] ring-primary/25 '
			: 'bg-error/0 ring  ring-[1px] ring-primary/100'
		: 'bg-base-200/50'} 
		{$mutationVersion ? 'min-w-[80vw] p-1 md:min-w-[50vw]' : 'pr-[1px]'}
		"
	bind:this={labelEl}
>
	<div class="grow">
		<div class="  flex {$mutationVersion ? 'flex-col' : ''}  space-x-0">
			<input
				type="checkbox"
				class="checkbox hidden input-primary"
				onchange={(e) => {
					if (e.target === e.currentTarget) {
						//leave this here,will prevent the click to go trough
					}
				}}
			/>
			<div
				class="   flex grow flex-nowrap text-xs select-none
											"
			>
				<button
					class=" {activeArgumentData.inUse
						? activeArgumentData.canRunQuery
							? 'outline outline-1  outline-success/30 '
							: 'outline outline-2 outline-error'
						: ' '} 
						{activeArgumentData.inUse ? 'font-semibold' : 'font-normal outline-0'}
						{$mutationVersion ? 'mb-1 ml-1' : ''}
						
						btn h-full min-h-min rounded-box py-0 pl-1 text-xs text-base-content normal-case btn-ghost btn-xs
						{isNot ? ' bg-gradient-to-r from-secondary/30 outline-dashed' : 'bg-error/0'} {selectedQMS
						? 'text-secondary'
						: ''}"
					onclick={() => {
						showModal = true;
					}}
					oncontextmenu={(e) => {
						if (e.target === e.currentTarget) {
							e.stopPropagation();
							e.preventDefault();
							showSelectModal = !showSelectModal;
							expandedVersion = !expandedVersion;
						}
					}}
				>
					<!-- {#if group.group_name == 'root'}
						{activeArgumentData.stepsOfFields?.join(' > ') + ':'}
					{:else}
						{activeArgumentData.stepsOfFields?.slice(1)?.join(' > ') + ':'}
					{/if} -->
					{activeArgumentData.stepsOfFields[activeArgumentData.stepsOfFields.length - 1]}
					{#if activeArgumentData.dd_NON_NULL}
						<sup>
							<i class="bi bi-asterisk text-primary"></i>
						</sup>
					{/if}
					<!-- {#if selectedRowsColValuesProcessed}
						: {Object.values(selectedRowsColValuesProcessed[0])[0]}
					{/if} -->
				</button>

				<div
					class="flex max-w-[65vw] flex-nowrap overflow-x-auto
								"
				>
					{#if !expandedVersion && !$mutationVersion && !$showInputField}
						<button
							class="btn mx-2 shrink-0 pt-[1px] text-xs font-light text-base-content normal-case btn-ghost btn-xs"
							onclick={(e) => {
								if (e.target === e.currentTarget) {
									e.stopPropagation();
									e.preventDefault();
									expandedVersion = true;
								}
							}}
						>
							{valueToDisplay}
						</button>
					{/if}
				</div>
			</div>
			{#if expandedVersion || $mutationVersion || $showInputField}
				{#if $selectedRowsColValues?.length > 0}
					<SelectedRowsDisplay />
				{:else}
					<div class="pl-1">
						<AutoInterface
							typeInfo={activeArgumentData}
							onChanged={(detail: any) => {
								handleChanged(detail);
							}}
						/>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</label>

{#if activeArgumentData[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
	<div
		class=" visible absolute top-0 left-0 ml-8 h-0 w-11/12"
		id="shadowEl"
		bind:this={shadowEl}
	></div>
{/if}
