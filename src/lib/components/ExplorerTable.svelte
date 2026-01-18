<script lang="ts">
	import { run, stopPropagation } from 'svelte/legacy';

	import { writable } from 'svelte/store';
	import { createSvelteTable, flexRender, getCoreRowModel } from '@tanstack/svelte-table';
	import type { ColumnDef, TableOptions } from '@tanstack/table-core/src/types';
	import { formatData, getTableCellData } from '$lib/utils/usefulFunctions';
	import { getColumnVisibility, createTableOptions, getColumnFlags } from '$lib/utils/tableUtils';
	import ColumnInfo from './ColumnInfo.svelte';
	import { getContext } from 'svelte';

	interface Props {
		prefix?: string;
		enableMultiRowSelectionState?: boolean;
		enableRowSelectionState?: boolean;
		infiniteHandler: any;
		infiniteId: any;
		data?: any;
		columns?: any;
		rowSelectionState?: any;
		idColName: any;
		requiredColNames: any;
		onRowSelectionChange?: (detail: any) => void;
		onHideColumn?: (detail: { column: string }) => void;
		onRowClicked?: (detail: any) => void;
		onDeleteRow?: (detail: any) => void;
		onDuplicateRow?: (detail: any) => void;
	}

	let {
		prefix = '',
		enableMultiRowSelectionState = true,
		enableRowSelectionState = true,
		infiniteHandler,
		infiniteId,
		data = [],
		columns = [],
		rowSelectionState = $bindable(),
		idColName,
		requiredColNames,
		onRowSelectionChange,
		onHideColumn,
		onRowClicked,
		onDeleteRow,
		onDuplicateRow
	}: Props = $props();

	if (rowSelectionState === undefined) {
		rowSelectionState = {};
	}

	let loadMore = false;


	let columnVisibility = getColumnVisibility(columns);

	const setRowSelection = (updater) => {
		if (updater instanceof Function) {
			rowSelectionState = updater(rowSelectionState);
		} else {
			rowSelectionState = updater;
		}
		options.update((old) => ({
			...old,
			state: {
				...old.state,
				rowSelection: rowSelectionState
			}
		}));

		onRowSelectionChange?.({ ...$table.getSelectedRowModel(), rowSelectionState });
	};


	const optionsObj = createTableOptions(
		data,
		columns,
		rowSelectionState,
		columnVisibility,
		enableMultiRowSelectionState,
		enableRowSelectionState,
		getCoreRowModel,
		setRowSelection,
		idColName
	);

	const options = writable(optionsObj);

	const rerender = () => {
		options.update((options) => ({
			...options,
			data: data
		}));
	};
	const table = createSvelteTable(options);
	run(() => {
		if (data) {
			rerender();
		}
	});
	run(() => {
	});
</script>

<div
	class="  w-[90vw] min-h-min h-min max-h-[70vh] max-w-full overscroll-contain overflow-y-auto rounded-box"
>
	<table class="table table-compact w-full rounded-none">
		<thead class="sticky top-0 z-20 bg-base-300">
			{#each $table.getHeaderGroups() as headerGroup}
				<tr class="sticky top-0 z-20">
					{#if enableRowSelectionState}
						<th>
							<label>
								<input
									type="checkbox"
									class="checkbox"
									onclick={() => {
										$table.toggleAllRowsSelected();
									}}
								/>
							</label>
						</th>
					{/if}
					<th>#</th>
					{#each headerGroup.headers as header}
						{@const columnFlags = getColumnFlags(header.column.columnDef.header, idColName, requiredColNames)}
						<th class="normal-case">
							<div class="dropdown dropdown-end">
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<label tabindex="0" class="cursor-pointer">
									<div class="flex space-x-2 hover:text-primary rounded-box">
										<div
											class="{columnFlags.isIdColumn
												? ' underline decoration-dotted font-black text-primary'
												: ''} {columnFlags.isRequired
												? ' font-black text-primary'
												: ''} "
										>
											{#if !header.isPlaceholder}
												{@const SvelteComponent = flexRender(header.column.columnDef.header, header.getContext())}
												<SvelteComponent
												/>
											{/if}
										</div>
										<div class="bi bi-chevron-down"></div>
									</div>
								</label>
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<div
									tabindex="0"
									class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-max text-sm shadow-2xl"
								>
									<div
										class="flex flex-col overflow-x-auto text-sm font-normal normal-case w-full space-y-2"
									>
										<div class="w-full p-2 rounded-box flex flex-col space-y-2">
											<div
												class="w-full pr-2 hover:text-primary cursor-pointer max-w-xs md:max-w-sm overflow-x-auto"
											>
												<!-- {columnsData[index].stepsOfFields.join(' > ')} -->
											</div>
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<div
												class="w-full pr-2 hover:text-primary cursor-pointer"
												onclick={() => {
													onHideColumn?.({ column: header.column.columnDef.header });
												}}
											>
												hide field
											</div>
										</div>
									</div>
								</div>
							</div>
						</th>
					{/each}
					<th>Actions</th>
				</tr>
			{/each}
		</thead>
		<tbody>
			{#each $table.getRowModel().rows as row, i (row.id)}
				<tr
					class="bg-base-100 hover:bg-base-300 cursor-pointer hover z-0"
					onclick={() => {
						onRowClicked?.(row.original);
						//goto(`${$page.url.origin}/queries/${$page.params.queryName}/${row.id}`);
					}}
				>
					{#if enableRowSelectionState}
						<th class="z-0" onclick={stopPropagation(() => {})}>
							<label>
								<input
									checked={row.getIsSelected()}
									name="rows"
									type={row.getCanMultiSelect() ? 'checkbox' : 'radio'}
									class={row.getCanMultiSelect() ? 'checkbox' : 'radio'}
									onchange={(e) => {
										const toggleSelectedHandler = row.getToggleSelectedHandler();
										toggleSelectedHandler(e);

									}}
								/>
							</label>
						</th>
					{/if}

					<td>{parseInt(row.index) + 1}</td>

					{#each row.getVisibleCells() as cell}
						<td class="break-no">
							{cell.renderValue()}
							<!-- <svelte:component this={flexRender(cell.column.columnDef.cell, cell.getContext())} /> -->
						</td>
					{/each}

					<td class="break-no space-x-2">
						{#if onDuplicateRow}
							<div class="tooltip" data-tip="Duplicate">
								<button
									class="btn btn-sm btn-square btn-secondary"
									onclick={(event) => {
										event.stopPropagation();
										onDuplicateRow(row.original);
									}}
								>
									<i class="bi bi-files"></i>
								</button>
							</div>
						{/if}
						{#if onDeleteRow}
							<div class="tooltip" data-tip="Delete">
								<button
									class="btn btn-sm btn-square btn-error"
									onclick={(event) => {
										event.stopPropagation();
										onDeleteRow(row.original);
									}}
								>
									<i class="bi bi-trash"></i>
								</button>
							</div>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="h-4"></div>
</div>
