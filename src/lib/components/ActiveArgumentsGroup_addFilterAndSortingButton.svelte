<script lang="ts">
	import { getContext, setContext } from 'svelte';
	import Arg from '$lib/components/Arg.svelte';
	import { getQMSWraperCtxDataGivenControlPanelItem } from '$lib/utils/usefulFunctions';
	import type { QMSMainWraperContext as QMSMainWraperContextType } from '$lib/types';

	interface Props {
		group: any;
		argsInfo: any;
		update_activeArgumentsDataGrouped: any;
		activeArgumentsDataGrouped: any;
		prefix?: string;
		node: any;
		onUpdateQuery?: () => void;
	}

	let {
		group = $bindable(),
		argsInfo,
		update_activeArgumentsDataGrouped,
		activeArgumentsDataGrouped,
		prefix = '',
		node,
		onUpdateQuery
	}: Props = $props();

	let showDescription = $state();
	// notice - fade in works fine but don't add svelte's fade-out (known issue)
	let dragDisabled = true;
	const hasGroup_argsNode = group.group_argsNode;
	/////start
	const OutermostQMSWraperContext = getContext(`${prefix}OutermostQMSWraperContext`);
	let pathIsInCP = false;
	const nodeContext = getContext<any>(`${prefix}nodeContext`);
	if (nodeContext) {
		pathIsInCP = nodeContext?.pathIsInCP;
	}
	let nodeIsInCP = false;
	const CPItemContext = getContext<any>(`${prefix}CPItemContext`);
	if (CPItemContext?.CPItem.nodeId == node.id) {
		setContext(`${prefix}nodeContext`, { pathIsInCP: true });
		nodeIsInCP = true;
	}
	const isCPChild = CPItemContext ? true : false;
	const visibleInCP = pathIsInCP || nodeIsInCP;
	const visible = visibleInCP || !CPItemContext || node.isMain;
	let correctQMSWraperContext;
	if (isCPChild) {
		correctQMSWraperContext = getQMSWraperCtxDataGivenControlPanelItem(
			CPItemContext?.CPItem,
			OutermostQMSWraperContext as any
		);
	} else {
		correctQMSWraperContext = getContext(`${prefix}QMSWraperContext`);
	}
	const { finalGqlArgObj_Store, QMS_info, activeArgumentsDataGrouped_Store } =
		correctQMSWraperContext;
	/////end
	let rootArgs = argsInfo.filter((arg: any) => {
		return arg.dd_isRootArg;
	});

	let groupArgsPossibilities = group.group_isRoot
		? rootArgs
		: group.dd_relatedRoot.inputFields || group.inputFields || group.args;
	let predefinedFirstSteps = group.group_isRoot ? [] : [group.group_name];
	let QMSMainWraperContext = getContext<QMSMainWraperContextType>(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSMainWraperContext?.endpointInfo;
</script>

<div class="rounded-box bg-base-100">
	<div class="flex font-bold">
		<div class=" ">
			<div class="dropdown dropdown-start">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<label
					tabindex="0"
					class="bi bi-plus-circle btn mr-2 overscroll-contain p-1 text-lg btn-ghost btn-sm"
				></label>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					tabindex="0"
					class="dropdown-content menu max-h-52 w-max max-w-xs overflow-y-auto overscroll-contain rounded-box bg-base-100 p-2 text-sm shadow shadow-2xl sm:max-h-72 sm:max-w-md md:max-h-90 md:max-w-xl lg:max-w-2xl"
				>
					<div
						class="flex w-full min-w-max flex-col overflow-x-auto overscroll-contain text-sm font-normal normal-case"
					>
						{#if hasGroup_argsNode}
							<button
								class="btn sticky top-0 mt-4 text-base font-thin normal-case btn-xs btn-primary"
								onclick={() => {
									let randomNr = Math.random();
									group.group_argsNode[`${randomNr}`] = {
										id: randomNr,
										operator: '_or',
										not: false,
										isMain: false,
										items: []
									};
									group.group_argsNode['mainContainer'].items.push({ id: randomNr });
								}}
							>
								or / and / bonded
							</button>
						{/if}
						{#each groupArgsPossibilities as arg, index}
							<Arg
								{index}
								type={arg}
								template="changeArguments"
								{predefinedFirstSteps}
								groupName={group.group_name}
								onArgAddRequest={(detail: any) => {
									let newArgData = detail;
									activeArgumentsDataGrouped_Store.add_activeArgument(
										newArgData,
										group.group_name,
										undefined,
										endpointInfo
									);
								}}
							/>
						{/each}
					</div>
				</div>
			</div>
		</div>
		{#if !group.group_isRoot}
			{group.group_name}
		{/if}
		{#if group.dd_kindList}
			(list)
		{/if}
		{#if group?.dd_relatedRoot?.dd_filterOperators}
			{`(${group?.dd_relatedRoot?.dd_filterOperators?.join(',')})`}
		{/if}
		{#if group.group_name !== 'root'}
			<i
				role="button"
				tabindex="0"
				class="bi bi-info-circle cursor-pointer px-2 text-secondary"
				title={group.description}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						if (showDescription == group.description) {
							showDescription = '';
						} else {
							showDescription = group.description;
						}
					}
				}}
				onclick={() => {
					if (showDescription == group.description) {
						showDescription = '';
					} else {
						showDescription = group.description;
					}
				}}
			></i>
			{#if showDescription == group.description && group.description}
				<p class="text-xs font-light text-secondary select-none">
					({group.description})
				</p>
			{/if}{/if}
	</div>
</div>
