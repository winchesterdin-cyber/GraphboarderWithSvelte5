<script lang="ts">
	import Type from './Type.svelte';
	import { slide } from 'svelte/transition';
	import { getRootType } from '$lib/utils/usefulFunctions';
	import Arg from '$lib/components/Arg.svelte';
	import TypeInfoDisplay from '$lib/components/TypeInfoDisplay.svelte';
	import { expoIn, expoOut } from 'svelte/easing';
	import { getContext } from 'svelte';
	import type { QMSMainWraperContext } from '$lib/types';

	interface Props {
		template: any;
		index: any;
		type: any;
		stepsOfFields?: any;
		isOnMainList?: any;
		//stepsOfFields = [...stepsOfFields]; // so each tree will have it's own stepsOfFields
		depth?: number;
		showExpand?: boolean;
		prefix?: string;
		oncolAddRequest?: (detail: any) => void;
	}

	let {
		template,
		index,
		type,
		stepsOfFields = $bindable(),
		isOnMainList = !stepsOfFields,
		depth = 0,
		showExpand = $bindable(),
		prefix = '',
		oncolAddRequest
	}: Props = $props();

	if (showExpand === undefined) {
		showExpand = false;
	}

	// Now we can access the context and use type
	let mainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as QMSMainWraperContext;
	const OutermostQMSWraperContext = getContext(`${prefix}OutermostQMSWraperContext`) as any;
	const isForExplorer = OutermostQMSWraperContext?.extraInfo?.isForExplorer;
	const schemaData = mainWraperContext?.schemaData;

	// Destructure type properties
	let {
		dd_kindsArray,
		dd_namesArray,
		dd_rootName,
		dd_displayName,
		dd_kindEl,
		dd_kindEl_NON_NULL,
		dd_kindList,
		dd_kindList_NON_NULL,
		dd_NON_NULL
	} = type;

	// Update stepsOfFields
	if (!stepsOfFields) {
		stepsOfFields = [dd_displayName];
	} else {
		stepsOfFields = [...stepsOfFields, dd_displayName];
	}

	let inDuration = $state(300);
	let expandData: any = $state({});
	let canExpand = $derived(!dd_kindsArray?.includes('SCALAR') && dd_kindsArray.length > 0);

	const expand = () => {
		expandData = getRootType($schemaData.rootTypes, dd_rootName, schemaData);
		if (expandData) {
			// if (!showExpand) {
			// 	stepsOfFields.push(dd_displayName);
			// } else {
			// 	// does the trick if you hide one by one from last one
			// 	stepsOfFields.splice(-1);
			// }

			showExpand = !showExpand;
			let typeLen =
				expandData?.fields?.length ||
				expandData?.inputFields?.length ||
				expandData?.enumValues?.length;

			let argLen = 0;
			if (type?.args) {
				argLen = type?.args.length;
			}

			inDuration = (typeLen + argLen) * 100;
			inDuration = inDuration < 300 && inDuration > 200 ? inDuration : 300;
		}
	};

	$effect(() => {
		if (canExpand && isOnMainList && !isForExplorer && !showExpand) {
			expand();
		}
	});
</script>

{#if template == 'default'}
	<div class="pt-2 text-center text-xs"></div>
{/if}

<div
	class="  space-x-2 rounded-l-none rounded-r-sm pr-0 pb-0 pl-1 text-xs normal-case shadow-none {showExpand
		? ''
		: ''}"
>
	<TypeInfoDisplay {canExpand} {expand} {type} {index} {showExpand} {template} {stepsOfFields} />

	{#if showExpand}
		<div
			in:slide|global={{ duration: inDuration, easing: expoIn }}
			out:slide|global={{ duration: inDuration, easing: expoOut }}
		>
			<div class="mb-2== text-center text-xs"></div>

			{#if type?.args && template == 'default'}
				<div class="border-l-2 border-secondary bg-accent/5">
					<div class="">
						{#each type?.args as arg, index}
							<Arg {index} type={arg} {template} predefinedFirstSteps={[]} groupName="default" />
						{/each}
					</div>
				</div>
			{/if}

			<div class="border-l-2 bg-accent/5">
				<div class="w-min-max w-full">
					{#each expandData.fields || expandData.inputFields || expandData.enumValues as type, index (index)}
						<Type
							{index}
							{type}
							{template}
							{stepsOfFields}
							{depth}
							{oncolAddRequest}
							isOnMainList={false}
						/>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
{#if !showExpand || isOnMainList}
	<div class="mb-2 text-center text-xs"></div>
{/if}
