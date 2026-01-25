<script lang="ts">
	import { run } from 'svelte/legacy';
	import Modal from './Modal.svelte';
	import ExplorerTable from './ExplorerTable.svelte';
	import { getContext } from 'svelte';

	interface Props {
		prefix?: string;
		node: any;
		showSelectQMSModal: any;
	}

	let { prefix = '', node, showSelectQMSModal = $bindable() }: Props = $props();

	const nodeContext_forDynamicData = getContext(`${prefix}nodeContext_forDynamicData`) as any;
	//let selectedQMS = nodeContext_forDynamicData.selectedQMS;
	let QMSRows = nodeContext_forDynamicData.QMSRows;
	let columns = [
		{
			accessorFn: (row: any) => row.dd_displayName,
			header: 'dd_displayName',
			footer: 'dd_displayName',
			enableHiding: true
		},
		{
			accessorFn: (row: any) => row.dd_rootName,
			header: 'dd_rootName',
			footer: 'dd_rootName',
			enableHiding: true
		},
		{
			accessorFn: (row: any) => (row.dd_kindList_NON_NULL ? '!' : ''),
			header: 'L',
			footer: 'L',
			enableHiding: true
		},
		{
			accessorFn: (row: any) => (row.dd_kindList ? 'list' : ''),
			header: 'LL',
			footer: 'LL',
			enableHiding: true
		},
		{
			accessorFn: (row: any) => (row.dd_kindEl_NON_NULL ? '!' : ''),
			header: 'E',
			footer: 'E',
			enableHiding: true
		},
		{
			accessorFn: (row: any) => row.dd_kindEl,
			header: 'EE',
			footer: 'EE',
			enableHiding: true
		},

		{
			accessorFn: (row: any) =>
				row.args
					?.map(
						(arg: any) =>
							`${arg.dd_displayName} (${arg.dd_kindList ? 'list of ' : ''}${arg.dd_kindEl})`
					)
					.join('; '),
			header: 'Arguments',
			footer: 'Arguments',
			enableHiding: true
		},
		{
			accessorFn: (row: any) => row.description?.replaceAll(',', ';'),
			header: 'description',
			footer: 'description',
			enableHiding: true
		}
	];
	const OutermostQMSWraperContext = getContext(`${prefix}OutermostQMSWraperContext`) as any;
	const { QMSFieldToQMSGetMany_Store } = OutermostQMSWraperContext;
	let getManyData = $state<any>();
	let selectedQMS = $state<any>();
	let rowSelectionState = $state<any>();
	run(() => {
		if ($QMSFieldToQMSGetMany_Store.length > 0) {
			getManyData = QMSFieldToQMSGetMany_Store.getObj({
				nodeOrField: node
			})?.getMany;
		}
	});
	run(() => {
		if (getManyData) {
			selectedQMS = getManyData.selectedQMS;
			rowSelectionState = getManyData.rowSelectionState;
		}
	});
</script>

{#if showSelectQMSModal}
	<!-- 
		on:apply={() => {
			showSelectQMSModal = false;
		}} -->
	<Modal
		showApplyBtn={false}
		onCancel={() => {
			showSelectQMSModal = false;
		}}
	>
		<div class="flex flex-col">
			<!-- <div class="w-full text-lg text-center  mb-2 ">
				<p class="badge badge-info font-bold">
					{groupDisplayTitle}
				</p>
			</div> -->

			<div>
				<!-- {#if QMSRows?.length > 1} -->
				<!-- content here -->
				<ExplorerTable
					enableMultiRowSelectionState={false}
					bind:rowSelectionState
					data={$QMSRows}
					{columns}
					onRowSelectionChange={(detail: any) => {
						////
						const objToAdd = {
							nodeOrField: node,
							getMany: {
								selectedQMS: detail.rows.map((row: any) => row.original)[0],
								rowSelectionState: detail.rowSelectionState
							},
							id: Math.random().toString(36).substr(2, 9)
						};
						QMSFieldToQMSGetMany_Store.addOrReplaceKeepingOldId(objToAdd);
						////
						//	$selectedQMS = detail.rows.map((row) => row.original)[0];

						showSelectQMSModal = false;
					}}
				/>
				<!-- {/if} -->
			</div>
		</div>
	</Modal>
{/if}
