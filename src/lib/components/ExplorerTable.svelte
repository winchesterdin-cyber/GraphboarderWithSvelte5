<script lang="ts">
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
	$effect(() => {
		if (data) {
			rerender();
		}
	});
</script>

<div
	class="  h-min max-h-[70vh] min-h-min w-[90vw] max-w-full overflow-y-auto overscroll-contain rounded-box"
>
	<table class="table-compact table w-full rounded-none">
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
						{@const columnFlags = getColumnFlags(
							header.column.columnDef.header,
							idColName,
							requiredColNames
						)}
						<th class="normal-case">
							<div class="dropdown dropdown-end">
								<div role="button" tabindex="0" class="cursor-pointer">
									<div class="flex space-x-2 rounded-box hover:text-primary">
										<div
											class="{columnFlags.isIdColumn
												? ' font-black text-primary underline decoration-dotted'
												: ''} {columnFlags.isRequired ? ' font-black text-primary' : ''} "
										>
											{#if !header.isPlaceholder}
												{@const SvelteComponent = flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
												<SvelteComponent />
											{/if}
										</div>
										<div class="bi bi-chevron-down"></div>
									</div>
								</div>
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<div
									tabindex="0"
									class="dropdown-content menu w-max rounded-box bg-base-100 p-2 text-sm shadow shadow-2xl"
								>
									<div
										class="flex w-full flex-col space-y-2 overflow-x-auto text-sm font-normal normal-case"
									>
										<div class="flex w-full flex-col space-y-2 rounded-box p-2">
											<div
												class="w-full max-w-xs cursor-pointer overflow-x-auto pr-2 hover:text-primary md:max-w-sm"
											>
												<!-- {columnsData[index].stepsOfFields.join(' > ')} -->
											</div>
											<button
												type="button"
												class="w-full cursor-pointer pr-2 text-left hover:text-primary"
												onclick={() => {
													onHideColumn?.({ column: header.column.columnDef.header });
												}}
											>
												hide field
											</button>
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
					tabindex="0"
					class="hover z-0 cursor-pointer bg-base-100 hover:bg-base-300"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							onRowClicked?.(row.original);
						}
					}}
					onclick={() => {
						onRowClicked?.(row.original);
						//goto(`${$page.url.origin}/queries/${$page.params.queryName}/${row.id}`);
					}}
				>
					{#if enableRowSelectionState}
						<th
							class="z-0"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
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
									type="button"
									aria-label="Duplicate"
									class="btn btn-square btn-sm btn-secondary"
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
									type="button"
									aria-label="Delete"
									class="btn btn-square btn-sm btn-error"
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
