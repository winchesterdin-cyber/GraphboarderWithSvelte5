<script lang="ts">
	import {
		generateArgData,
		generateContainerData
	} from '$lib/stores/QMSHandling/activeArgumentsDataGrouped_Store';
	import { getRootType } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	import type { QMSMainWraperContext as QMSMainWraperContextType } from '$lib/types';

	interface Props {
		expand: any;
		showExpand: any;
		index: any;
		type: any;
		template: string;
		stepsOfFields?: any;
		predefinedFirstSteps?: any;
		groupName?: any;
		onArgAddRequest?: (detail: any) => void;
		onContainerAddRequest?: (detail: any) => void;
		prefix?: string;
	}

	let {
		expand,
		showExpand,
		index,
		type,
		template,
		stepsOfFields = $bindable(),
		predefinedFirstSteps,
		groupName,
		onArgAddRequest,
		onContainerAddRequest,
		prefix = ''
	}: Props = $props();

	if (stepsOfFields.length == 0 && predefinedFirstSteps) {
		stepsOfFields = [...predefinedFirstSteps];
	}

	let QMSMainWraperContext = getContext<QMSMainWraperContextType>(`${prefix}QMSMainWraperContext`);
	const schemaData = QMSMainWraperContext?.schemaData;

	let {
		dd_kindsArray,
		dd_namesArray,
		dd_rootName,
		dd_displayName,
		dd_kindList,
		dd_kindEl,
		dd_NON_NULL,
		dd_canExpand,
		dd_shouldExpand,
		dd_filterOperators
	} = type;
	const addFilter = () => {
		onArgAddRequest?.(generateArgData(stepsOfFields, type, schemaData));
	};
	const addContainer = () => {
		onContainerAddRequest?.(generateContainerData(stepsOfFields, type));
	};
</script>

{#if template == 'default'}
	<div class="flex space-x-2">
		<div class="flex w-1/3 space-x-2">
			{#if dd_canExpand}
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

		<div class="w-1/2">
			<div class="flex">
				<div class="rounded bg-secondary p-1">{dd_kindsArray.join(' of ')}</div>

				{#if !dd_canExpand}
					<div class="btn rounded bg-base-200 p-1 btn-xs">
						{#if dd_displayName == dd_namesArray[dd_namesArray.length - 1]}{:else}
							{dd_namesArray[dd_namesArray.length - 1]}
						{/if}
					</div>
				{/if}
				{#if dd_canExpand}
					<div class="btn rounded bg-base-200 px-2 py-1 btn-xs">
						{#if dd_namesArray[0] !== dd_displayName}
							({dd_namesArray[0]})
						{:else if dd_namesArray[1] && dd_namesArray[1] !== dd_displayName}
							({dd_namesArray[1]})
						{:else}
							same
						{/if}
					</div>
				{/if}
			</div>

			<div class="flex"></div>
		</div>
		<div class="w-1/8 text-center text-xs"></div>
	</div>
{:else if template == 'changeArguments'}
	<!-- svelte-ignore a11y_label_has_associated_control -->
	<button
		type="button"
		class=" flex w-full min-w-max cursor-pointer rounded-box px-2 py-2 text-base duration-100 select-none hover:text-primary active:font-black"
		onclick={() => {
			/////
			if (dd_kindEl == 'INPUT_OBJECT') {
				addContainer();
			} else {
				addFilter();
			}

			///////
			// // if (dd_canExpand && !allInputFieldsAreScalar && !enumValues) {
			// //		if (dd_shouldExpand) {
			// if (dd_kindList && dd_shouldExpand) {
			// 	addContainer();
			// } else if (dd_kindEl == 'INPUT_OBJECT') {
			// 	addContainer();
			// } else if (
			// 	getRootType(null, dd_rootName, schemaData)?.dd_baseFilterOperators ||
			// 	getRootType(null, dd_rootName, schemaData)?.dd_nonBaseFilterOperators
			// ) {
			// 	addContainer();
			// } else {
			// 	//expand();
			// 	addFilter();
			// }
			// // } else {
			// // 	addFilter();
			// // }
		}}
	>
		<div class=" w-full min-w-max pr-2 {dd_NON_NULL && 'underline underline-offset-0'}">
			{dd_displayName}
		</div>

		<div class="w-10">
			{#if dd_kindEl == 'INPUT_OBJECT'}
				{#if dd_kindList}
					<div class="bi bi-card-list mx-auto w-min"></div>
				{:else}
					<div class="bi bi-box mx-auto w-min"></div>
				{/if}
				{#if showExpand}
					<div class="bi bi-chevron-down mx-auto w-min"></div>{/if}
			{/if}
		</div>

		<!-- {#if dd_shouldExpand} -->
		<!-- {#if true} -->
		<!-- <div class="w-10  ">
			{#if dd_kindList && dd_shouldExpand}
				<div class="bi bi-card-list mx-auto w-min" />
			{:else if dd_kindEl == 'INPUT_OBJECT'}
				<div class="bi bi-box mx-auto w-min" />
			{:else if showExpand}
				<div class="bi bi-chevron-down mx-auto w-min" />
			{/if}
		</div> -->
		<!-- {:else} -->
		<!-- <div class="w-10  ">
				<div class="bi bi-plus mx-auto   w-min " />
			</div> -->
		<!-- {/if} -->
	</button>
{/if}
