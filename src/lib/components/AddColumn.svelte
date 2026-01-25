<script lang="ts">
	import _ from 'lodash';

	import TypeList from '$lib/components/TypeList.svelte';
	import {
		generateTitleFromStepsOfFields,
		stepsOfFieldsToQueryFragmentObject
	} from '$lib/utils/usefulFunctions';
	import { setContext, getContext } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import Type from './Type.svelte';

	/**
	 * Props for AddColumn component.
	 */
	interface Props {
		prefix?: string;
		column_stepsOfFields: any;
		addColumnFromInput?: any;
		dd_relatedRoot: any;
		QMSName: any;
		QMS_info: any;
		onNewColumnAddRequest?: (detail: any) => void;
	}

	let {
		prefix = '',
		column_stepsOfFields = $bindable(),
		addColumnFromInput,
		dd_relatedRoot,
		QMSName,
		QMS_info,
		onNewColumnAddRequest
	}: Props = $props();
	//stepsOfFieldsOBJ
	setContext(`${prefix}stepsOfFieldsOBJ`, writable({}));
	const stepsOfFieldsOBJ = getContext(`${prefix}stepsOfFieldsOBJ`) as Writable<any>;
	stepsOfFieldsOBJ.subscribe((value) => {});
	setContext(`${prefix}stepsOfFieldsOBJFull`, writable({}));
	const stepsOfFieldsOBJFull = getContext(`${prefix}stepsOfFieldsOBJFull`) as Writable<any>;
	//activeArgumentsDataGrouped_Store
	setContext(`${prefix}activeArgumentsDataGrouped_Store`, writable({}));
	const activeArgumentsDataGrouped_Store = getContext(
		`${prefix}activeArgumentsDataGrouped_Store`
	) as Writable<any>;
	activeArgumentsDataGrouped_Store.subscribe((value) => {});

	const tableColsData_Store = (getContext(`${prefix}QMSWraperContext`) as any).tableColsData_Store;
	tableColsData_Store.subscribe((cols: any) => {
		$stepsOfFieldsOBJFull = _.merge(
			{},
			...cols.map((col: any) => {
				return col.stepsOfFieldsOBJ;
			})
		);
	});
	stepsOfFieldsOBJFull.subscribe((stepsOfFieldsOBJFull) => {});
	setContext(`${prefix}StepsOfFieldsSelected`, writable(new Set([])));
	const StepsOfFieldsSelected = getContext(`${prefix}StepsOfFieldsSelected`) as Writable<any>;
	StepsOfFieldsSelected.subscribe((value: any) => {});
</script>

<div class="dropdown grow">
	<!-- svelte-ignore a11y_label_has_associated_control -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<label tabindex="0" class="bi bi-node-plus-fill btn w-full p-1 text-lg btn-xs"></label>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		tabindex="0"
		class="dropdown-content ==w-max menu z-[9999] max-w-screen rounded-box bg-base-100 p-2 text-sm shadow-2xl"
	>
		<div
			class="max-h-[70vh] max-w-xs overflow-auto overscroll-contain sm:max-h-[80vh] sm:max-w-md md:max-h-[80vh] md:max-w-xl lg:max-w-2xl"
		>
			<div
				class="flex w-full min-w-max flex-col space-y-1 overflow-x-auto text-sm font-normal normal-case"
			>
				<input
					type="text"
					class="input input-sm input-bordered input-accent m-2"
					placeholder="(> or .) producer>films>title "
					bind:value={column_stepsOfFields}
					onkeypress={addColumnFromInput}
				/>
				<div class="bg-black= sticky left-0 mx-auto text-center">
					<button
						class="btn w-min btn-xs btn-primary"
						onclick={() => {
							let stepsOfFields: string[] = [];
							let tableColData = {
								title: `col-${Math.floor(Math.random() * 200)},${generateTitleFromStepsOfFields(
									stepsOfFields
								)},stepsOfFieldsOBJ `,
								stepsOfFields: stepsOfFields,
								stepsOfFieldsOBJ: $stepsOfFieldsOBJ,
								activeArgumentsDataGrouped: $activeArgumentsDataGrouped_Store
							};
							onNewColumnAddRequest?.(tableColData);
							$stepsOfFieldsOBJ = {};
						}}
					>
						add
					</button>
				</div>

				{#if dd_relatedRoot?.fields}
					<Type
						type={QMS_info}
						template="columnAddDisplay"
						depth={0}
						isOnMainList={true}
						index={0}
						oncolAddRequest={onNewColumnAddRequest}
					/>
					<!-- <TypeList
						types={dd_relatedRoot.fields}
						template="columnAddDisplay"
						stepsOfFields={[QMSName]}
						depth={0}
					/> -->
					<!-- {#each dd_relatedRoot.fields as type, index (index)}
							<Type
								{index}
								{type}
								template="columnAddDisplay"
								stepsOfFields={[QMSName]}
								depth={0}
							/>
						{/each} -->
				{/if}
			</div>
		</div>
	</div>
</div>
