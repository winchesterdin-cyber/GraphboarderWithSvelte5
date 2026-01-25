<script lang="ts">
	import {
		deleteValueAtPath,
		generateTitleFromStepsOfFields,
		getPreciseType,
		getRootType,
		getValueAtPath,
		setValueAtPath,
		stepsOfFieldsToQueryFragmentObject
	} from '$lib/utils/usefulFunctions';
	import _ from 'lodash';

	import { getContext } from 'svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ActiveArguments from '$lib/components/ActiveArguments.svelte';
	import { Create_activeArgumentsDataGrouped_Store } from '$lib/stores/QMSHandling/activeArgumentsDataGrouped_Store';
	import QMSWraper from '$lib/components/QMSWraper.svelte';
	import { get, type Writable } from 'svelte/store';
	import type { QMSWraperContext } from '$lib/types';

	interface Props {
		canExpand: any;
		expand: any;
		type: any;
		index: any;
		showExpand: any;
		template?: string;
		stepsOfFields: any;
		prefix?: string;
	}

	let {
		canExpand,
		expand,
		type,
		index,
		showExpand,
		template = 'default',
		stepsOfFields,
		prefix = ''
	}: Props = $props();

	let { dd_kindsArray, dd_namesArray, dd_displayName, dd_rootName, args } = type;
	let isSubset = (parentArray: any[], subsetArray: any[]) => {
		return subsetArray.every((el, index) => {
			return parentArray[index] === el;
		});
	};

	const wraperContext = getContext(`${prefix}QMSWraperContext`) as any;
	let mainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as any;
	const schemaData = mainWraperContext?.schemaData;
	const tableColsData_Store = wraperContext?.tableColsData_Store;
	const stepsOfFieldsOBJ = getContext(`${prefix}stepsOfFieldsOBJ`) as Writable<any>;
	const stepsOfFieldsOBJFull = getContext(`${prefix}stepsOfFieldsOBJFull`) as Writable<any>;

	const stepsOFieldsAsQueryFragmentObject = stepsOfFieldsToQueryFragmentObject(
		stepsOfFields,
		false
	);
	//getValueAtPath
	let isSelected = $state(false);
	let hasSelected = $state(false);

	$effect(() => {
		if (!$stepsOfFieldsOBJ) {
			isSelected = false;
			hasSelected = false;
			return;
		}
		const valueAtPath = getValueAtPath($stepsOfFieldsOBJ, stepsOfFields);
		const typeAtPath = getPreciseType(valueAtPath);
		if (typeAtPath == 'undefined') {
			hasSelected = false;
			isSelected = false;
		} else if (typeAtPath == 'string') {
			hasSelected = true;
			isSelected = true;
		} else if (typeAtPath == 'object') {
			isSelected = false;
			hasSelected = true;
		}
	});
	///////
	let isUsedInSomeColumn = $derived.by(() => {
		if (!$stepsOfFieldsOBJFull) return false;
		const valueAtPath = getValueAtPath($stepsOfFieldsOBJFull, stepsOfFields);
		const typeAtPath = getPreciseType(valueAtPath);
		return typeAtPath != 'undefined';
	});

	let hasQMSarguments = $derived.by(() => {
		if (!$stepsOfFieldsOBJFull) return false;
		const valueAtPath = getValueAtPath($stepsOfFieldsOBJFull, stepsOfFields) as any;
		return valueAtPath?.QMSarguments;
	});

	let showModal = $state(false);
	let finalGqlArgObj_Store = $state();
	let finalGqlArgObj_StoreValue = $state();
	let paginationState_derived = $state();
	let paginationState_derivedValue = $state();
	let finalGqlArgObjValue;
	let activeArgumentsQMSWraperContext = $state<QMSWraperContext>();
	let QMSarguments;
	let canAcceptArguments = $derived(canExpand && args?.length > 0 && isUsedInSomeColumn);

	const mergedChildren_finalGqlArgObj_Store = wraperContext.mergedChildren_finalGqlArgObj_Store;
	const mergedChildren_QMSWraperCtxData_Store = wraperContext.mergedChildren_QMSWraperCtxData_Store;
	let activeArgumentsDataGrouped_Store = getContext(
		`${prefix}activeArgumentsDataGrouped_Store`
	) as Writable<any>;

	// //S//move to QMSWraper (outermost if possible)
	// $: if (finalGqlArgObj_StoreValue && finalGqlArgObj_StoreValue.final_canRunQuery) {
	// 	finalGqlArgObjValue = finalGqlArgObj_StoreValue.finalGqlArgObj;

	// 	QMSarguments = { ...finalGqlArgObjValue, ...paginationState_derivedValue };
	// }

	// $: if (QMSarguments || paginationState_derivedValue) {
	// 	mergedChildren_finalGqlArgObj_Store.update((value) => {
	// 		return setValueAtPath(value, [...stepsOfFields, 'QMSarguments'], QMSarguments);
	// 	});
	// }
	// //E//move to QMSWraper (outermost if possible)

	$effect(() => {
		if (activeArgumentsQMSWraperContext) {
			if (canAcceptArguments) {
				mergedChildren_QMSWraperCtxData_Store.addOrReplace({
					stepsOfFields,
					...activeArgumentsQMSWraperContext
				});
			}

			$activeArgumentsDataGrouped_Store = get(
				activeArgumentsQMSWraperContext.activeArgumentsDataGrouped_Store
			);

			finalGqlArgObj_Store = activeArgumentsQMSWraperContext.finalGqlArgObj_Store;
			finalGqlArgObj_StoreValue = finalGqlArgObj_Store;
			paginationState_derived = activeArgumentsQMSWraperContext.paginationState_derived;
			paginationState_derivedValue = paginationState_derived;
		}
	});

	let currentQMSWraperCtxData = $state();
	$effect(() => {
		if ($mergedChildren_QMSWraperCtxData_Store) {
			currentQMSWraperCtxData = mergedChildren_QMSWraperCtxData_Store.getObj(stepsOfFields);
		}
	});
	let currentQMSArguments = $derived(
		getValueAtPath($mergedChildren_finalGqlArgObj_Store, [...stepsOfFields, 'QMSarguments'])
	);
</script>

{#if template == 'default'}
	<div class="flex w-full min-w-max space-x-2">
		<div class="flex w-1/3 w-full min-w-max space-x-2">
			{#if canExpand}
				<button type="button" class="btn rounded p-1 normal-case btn-xs" onclick={expand}>
					{showExpand ? '-' : '+'}
				</button>
			{:else}
				<button
					type="button"
					class="btn btn-disabled rounded p-1 normal-case btn-xs"
					onclick={expand}>+</button
				>
			{/if}
			<div class="rounded bg-secondary p-1">{index + 1}</div>
			<div class="btn font-light normal-case btn-xs btn-info">
				{dd_displayName}
			</div>
		</div>
		{#if !canExpand}
			<div class="btn rounded bg-base-200 p-1 btn-xs">
				{#if dd_displayName == dd_namesArray[dd_namesArray.length - 1]}
					{''}
				{:else}
					{dd_namesArray[dd_namesArray.length - 1]}
				{/if}
			</div>
		{/if}
		{#if canExpand}
			<div class="btn rounded px-2 py-1 normal-case btn-xs btn-accent">
				{#if dd_namesArray?.[1] && dd_namesArray?.[1] !== dd_displayName}
					{dd_namesArray?.[1]}
				{:else}
					{dd_namesArray?.[0]}
				{/if}
			</div>
		{/if}
		<div class="w-1/2">
			<div class="flex">
				<div class="rounded bg-secondary p-1">{dd_kindsArray?.join(' of ')}</div>
			</div>

			<div class="flex"></div>
		</div>
		<div class="w-1/8 text-center text-xs"></div>
	</div>
{:else if template == 'columnAddDisplay'}
	<div
		class="flex w-full min-w-max cursor-pointer rounded-box text-base select-none hover:text-primary"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->

		{#if canExpand}
			<div class="grid-col grid h-2 w-6 gap-[-10px] overflow-visible">
				<button
					type="button"
					aria-label={showExpand ? 'Collapse' : 'Expand'}
					class="mx-auto w-10 w-min pl-1 duration-100 {hasSelected
						? 'text-secondary'
						: ''} {showExpand ? 'bi-arrow-90deg-down mt-2 ' : 'bi-chevron-expand'}"
					onclick={expand}
				></button>
			</div>
		{/if}
		{#if !canExpand}
			<!-- {$StepsOfFieldsSelected.has(JSON.stringify(stepsOfFields))}
			{isSelected} -->
			<input
				type="checkbox"
				class=" checkbox mr-1 ml-1 self-center checkbox-xs input-accent"
				bind:checked={isSelected}
				onchange={() => {
					if (isSelected) {
						$stepsOfFieldsOBJ = _.merge($stepsOfFieldsOBJ, stepsOFieldsAsQueryFragmentObject);
						///
						//	$StepsOfFieldsSelected.add(JSON.stringify(stepsOfFields));
						//	$StepsOfFieldsSelected = $StepsOfFieldsSelected;
					} else {
						$stepsOfFieldsOBJ = deleteValueAtPath($stepsOfFieldsOBJ, stepsOfFields);

						///
						//	$StepsOfFieldsSelected.delete(JSON.stringify(stepsOfFields));
						//$StepsOfFieldsSelected = $StepsOfFieldsSelected;
					}
				}}
				name=""
				id=""
			/>
			<!-- <p class="badge badge-xs badge-accent">
				{JSON.stringify(stepsOfFields)}
			</p> -->
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			role="button"
			tabindex="0"
			class="text-md duration-100== w-full min-w-max pr-2"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					if (canExpand) {
						expand();
					} else {
						let tableColData = {
							title: `col-${Math.floor(Math.random() * 200)},${generateTitleFromStepsOfFields(
								stepsOfFields
							)} `,
							stepsOfFields: stepsOfFields,
							stepsOfFieldsOBJ: stepsOfFieldsToQueryFragmentObject(stepsOfFields, false)
						};
						tableColsData_Store.addColumn(tableColData);
					}
				}
			}}
			onclick={() => {
				if (canExpand) {
					expand();
				} else {
					let tableColData = {
						title: `col-${Math.floor(Math.random() * 200)},${generateTitleFromStepsOfFields(
							stepsOfFields
						)} `,
						stepsOfFields: stepsOfFields,
						stepsOfFieldsOBJ: stepsOfFieldsToQueryFragmentObject(stepsOfFields, false)
					};
					tableColsData_Store.addColumn(tableColData);
				}
			}}
		>
			{dd_displayName}
			{#if isUsedInSomeColumn}
				<sup class="text-xs text-accent">
					<i class="bi bi-check"></i>
				</sup>
			{/if}

			{#if canAcceptArguments}
				<button
					class="btn rounded px-2 normal-case btn-ghost btn-xs {hasQMSarguments
						? 'text-success'
						: ''} "
					onclick={(e) => {
						e.stopPropagation();
						showModal = true;
					}}
				>
					<icon class=" {currentQMSArguments ? 'bi-funnel-fill' : 'bi-funnel'} "></icon>

					<!-- activeArgumentsDataGrouped_StoreInitialValue={getValueAtPath(
							$mergedChildren_activeArgumentsDataGrouped_Store,
							[...stepsOfFields, 'activeArgumentsDataGrouped']
						)} -->

					<QMSWraper
						bind:QMSWraperContext={activeArgumentsQMSWraperContext}
						QMSName={type.dd_displayName}
						QMSType="query"
						QMS_info={type}
						QMSWraperContextGiven={currentQMSWraperCtxData}
					>
						{#if showModal}
							<Modal
								modalIdentifier={'activeArgumentsDataModal'}
								showApplyBtn={false}
								onCancel={(detail: any) => {
									if (detail.modalIdentifier == 'activeArgumentsDataModal') {
										showModal = false;
									}
								}}
								><div class="  w-full">
									<div class="mx-auto mt-2 w-full space-y-2 pb-2">
										<div class="w-2"></div>

										<ActiveArguments
											stepsOfFieldsThisAppliesTo={stepsOfFields}
											QMSarguments={getValueAtPath($mergedChildren_finalGqlArgObj_Store, [
												...stepsOfFields,
												'QMSarguments'
											])}
										/>

										<div class="w-2"></div>
									</div>
								</div>
							</Modal>
						{/if}
					</QMSWraper>
				</button>
			{/if}
		</div>
		<!-- {#if canExpand && args?.length > 0}
			<button class="btn btn-xs btn-ghost normal-case  rounded px-2 py-1">
				<icon class="bi-funnel" />
			</button>
		{/if} -->
	</div>
{/if}
