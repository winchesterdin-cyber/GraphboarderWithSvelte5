<script lang="ts">
	import { getContext, setContext } from 'svelte';
	import ActiveArgumentsGroupWraper from '$lib/components/ActiveArgumentsGroupWraper.svelte';
	import type { QMSMainWraperContext } from '$lib/types';

	interface Props {
		isControlPanelChild?: any;
		stepsOfFieldsThisAppliesTo?: any;
		prefix?: string;
		QMSarguments?: any;
		activeArgumentsDataGrouped_Store?: any;
		QMS_info?: any;
		onUpdateQuery?: () => void;
	}

	let {
		isControlPanelChild,
		stepsOfFieldsThisAppliesTo,
		prefix = '',
		QMSarguments,
		activeArgumentsDataGrouped_Store = $bindable(),
		QMS_info = $bindable(),
		onUpdateQuery
	}: Props = $props();

	const activeArgumentsContext = { stepsOfFieldsThisAppliesTo, isControlPanelChild };
	setContext(`${prefix}activeArgumentsContext`, activeArgumentsContext);
	let mainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as QMSMainWraperContext;
	const endpointInfo = mainWraperContext?.endpointInfo;
	const schemaData = mainWraperContext?.schemaData;
	let QMSWraperContext = getContext(`${prefix}QMSWraperContext`) as any;

	// Set defaults if not provided
	if (!activeArgumentsDataGrouped_Store) {
		activeArgumentsDataGrouped_Store = QMSWraperContext.activeArgumentsDataGrouped_Store;
	}
	if (!QMS_info) {
		QMS_info = QMSWraperContext.QMS_info;
	}

	// Use initialGqlArgObj from context if QMSarguments is missing
	if (!QMSarguments && QMSWraperContext.initialGqlArgObj) {
		QMSarguments = QMSWraperContext.initialGqlArgObj;
	}

	let activeArgumentsDataGrouped: any[] = [];

	const update_activeArgumentsDataGrouped = (groupNewData: any) => {
		activeArgumentsDataGrouped_Store.update_groups(groupNewData);
	};
	if ($activeArgumentsDataGrouped_Store.length == 0) {
		activeArgumentsDataGrouped_Store.set_groups(QMS_info, schemaData, QMSarguments, endpointInfo);
	}
	let showDescription = null;
</script>

{#if $activeArgumentsDataGrouped_Store.length == 0}
	<div class="p-2">
		<div class="alert alert-info shadow-lg">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 flex-shrink-0 stroke-current"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
				<span>No arguments available.</span>
			</div>
		</div>
	</div>
{/if}

<div class="">
	{#each $activeArgumentsDataGrouped_Store as _, i}
		<ActiveArgumentsGroupWraper
			{onUpdateQuery}
			{update_activeArgumentsDataGrouped}
			bind:group={$activeArgumentsDataGrouped_Store[i]}
			argsInfo={QMS_info?.args}
			{activeArgumentsDataGrouped}
		/>
	{/each}
</div>
