<script lang="ts">
	import { writable } from 'svelte/store';
	import { createSvelteTable, flexRender, getCoreRowModel } from '@tanstack/svelte-table';
	import type { ColumnDef, TableOptions } from '@tanstack/table-core/src/types';
	import { formatData, getPreciseType, getTableCellData } from '$lib/utils/usefulFunctions';
	import ColumnInfo from './ColumnInfo.svelte';
	import { getContext } from 'svelte';
	import InfiniteLoading from 'svelte-infinite-loading';

	interface Props {
		prefix?: string;
		enableMultiRowSelectionState?: boolean;
		enableRowSelectionState?: boolean;
		infiniteHandler: any;
		infiniteId: any;
		data: any;
		cols?: any;
		rowSelectionState?: any;
		onRowSelectionChange?: (detail: any) => void;
		onHideColumn?: (detail: { column: string }) => void;
		onRowClicked?: (detail: any) => void;
	}

	let {
		prefix = '',
		enableMultiRowSelectionState = true,
		enableRowSelectionState = true,
		infiniteHandler,
		infiniteId,
		data,
		cols = [],
		rowSelectionState = $bindable(),
		onRowSelectionChange,
		onHideColumn,
		onRowClicked
	}: Props = $props();

	if (rowSelectionState === undefined) {
		rowSelectionState = {};
	}
	let loadMore = $state(false);
	let QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	let QMSWraperContext = getContext(`${prefix}QMSWraperContext`);
	let idColName = QMSWraperContext?.idColName;
	const { paginationOptions } = getContext(`${prefix}QMSWraperContext`);

	const getColumnVisibility = (cols) => {
		let columnVisibility = {};
		cols.forEach((col) => {
			col.hidden ? (columnVisibility[col.title] = false) : (columnVisibility[col.title] = true);
		});
		return columnVisibility;
	};
	let columnVisibility = getColumnVisibility(cols);
	const getColumns = (cols) => {
		let columns = cols.map((col) => {
			return {
				...col,
				accessorFn: (row) => getTableCellData(row, col),
				header: col.title,
				footer: col.title,
				enableHiding: true
			};
		});
		return columns;
	};

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

		onRowSelectionChange?.({ ...$table.getSelectedRowModel() });
	};

	const options = writable<TableOptions<Person>>({
		data: data,
		columns: getColumns(cols),
		getCoreRowModel: getCoreRowModel(),
		enableMultiRowSelection: enableMultiRowSelectionState,
		enableRowSelection: enableRowSelectionState,
		onRowSelectionChange: setRowSelection,
		enableHiding: true,
		initialState: { rowSelection: rowSelectionState },
		state: { columnVisibility, rowSelection: rowSelectionState },
		getRowId: (row) => row?.[idColName]
	});

	const table = createSvelteTable(options);

	$effect(() => {
		const columns = getColumns(cols);

		options.update((options) => ({
			...options,
			data: data,
			columns: columns
		}));
	});

	const downloadJSON = () => {
		if (!data || data.length === 0) return;
		const jsonString = JSON.stringify(data, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `export-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};
</script>

<div class=" h-[80vh] overflow-y-auto overscroll-contain rounded-box pb-32">
	{#if data && data.length > 0}
		<div class="mb-2 flex justify-end px-2">
			<button class="btn btn-ghost btn-sm gap-2" onclick={downloadJSON} aria-label="Export JSON">
				<i class="bi bi-filetype-json"></i> Export JSON
			</button>
		</div>
	{/if}
	<table class="table-compact table static w-full rounded-none table-zebra">
		<thead class="sticky top-0 z-20 bg-base-300">
			{#each $table.getHeaderGroups() as headerGroup}
				<tr class="sticky top-0 z-20">
					{#if enableRowSelectionState}
						<th>
							<label>
								<input type="checkbox" class="checkbox" />
							</label>
						</th>
					{/if}
					<th>#</th>
					{#each headerGroup.headers as header}
						<th class="normal-case">
							<div class="dropdown dropdown-end">
								<div role="button" tabindex="0" class="cursor-pointer">
									<div class="flex space-x-2 rounded-box hover:text-primary">
										<div
											class={idColName == header.column.columnDef.header
												? ' underline decoration-dotted'
												: ''}
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
												<ColumnInfo stepsOfFields={header.column.columnDef.stepsOfFields} />
												<!-- {colsData[index].stepsOfFields.join(' > ')} -->
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
						<td class="break-no" title={cell.renderValue()}>
							<!-- {cell.renderValue()} -->
							{formatData(cell.renderValue(), 40, true)}
							{#if getPreciseType(cell.renderValue()) == 'array'}
								<sup>{cell.renderValue().length}</sup>
							{/if}
							<!-- <svelte:component this={flexRender(cell.column.columnDef.cell, cell.getContext())} /> -->
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if $paginationOptions?.infiniteScroll && !loadMore && data?.length > 0}
		<!-- content here -->
		<button
			class="btn sticky left-0 mt-4 w-full btn-primary"
			onclick={() => {
				loadMore = true;
			}}
		>
			Load more
		</button>
		<div class="sticky left-0 mt-4 text-center text-xs text-gray-500">
			For now pagination works for 'limit' over 20 if set using 'filters',works for any 'limit' if
			set by 'pagination store'.
		</div>
	{/if}
	{#if $paginationOptions?.infiniteScroll && data?.length > 0 && loadMore}
		<InfiniteLoading oninfinite={infiniteHandler} identifier={infiniteId} distance={100} />
	{/if}
	<div class="h-4"></div>
</div>
