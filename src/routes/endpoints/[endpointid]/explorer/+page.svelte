<script lang="ts">
	import Type from '$lib/components/Type.svelte';
	import Page from '$lib/components/Page.svelte';
	import { sortingFunctionMutipleColumnsGivenArray } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	import ExplorerTable from '$lib/components/ExplorerTable.svelte';
	import EditTableBaseNameModal from '$lib/components/EditTableBaseNameModal.svelte';
	import { addToast } from '$lib/stores/toastStore';
	import type { QMSMainWraperContext } from '$lib/types/index';

	const prefix = '';

	let qmsMainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as QMSMainWraperContext;
	const schemaData = qmsMainWraperContext?.schemaData;

	// Keep explorer data reactive to schema loading.
	let rootTypes = $derived($schemaData.rootTypes);
	let queries = $derived($schemaData.queryFields);
	let mutations = $derived($schemaData.mutationFields);
	let whatToShow = $state<any[]>([]);
	let whatToShowLastUsed = $state();
	let sortingInputValue = $state('');
	let sortingArray = $derived(sortingInputValue.split(' '));
	let caseSensitive = $state(false);

	const filterByWord = () => {
		if (sortingArray.length == 1 && sortingArray[0] == '') {
			return;
		}

		const positiveWords: string[] = [];
		const negativeWords: string[] = [];
		sortingArray.forEach((word) => {
			if (word.startsWith('-') || word.startsWith('!')) {
				const processedWord = word.slice(1);
				negativeWords.push(processedWord);
			} else {
				let processedWord;
				if (word.startsWith('+')) {
					processedWord = word.slice(1);
				} else {
					processedWord = word;
				}
				positiveWords.push(processedWord);
			}
		});

		whatToShow = whatToShow.filter((type) => {
			return (
				positiveWords.find((word) => {
					if (caseSensitive) {
						return type.dd_displayName.includes(word);
					}
					return type.dd_displayName.toLowerCase().includes(word.toLowerCase());
				}) &&
				!negativeWords.find((word) => {
					if (caseSensitive) {
						return type.dd_displayName.includes(word);
					}
					return type.dd_displayName.toLowerCase().includes(word.toLowerCase());
				})
			);
		});
	};
	const showRootTypes = () => {
		whatToShow = rootTypes?.sort((a: any, b: any) => {
			let ea = a.dd_rootName;
			let eb = b.dd_rootName;
			// let ga = a.dd_displayName;
			// let gb = b.dd_displayName;
			return sortingFunctionMutipleColumnsGivenArray([
				[ea, eb]
				// [ga, gb]
			]);
		});
		whatToShowLastUsed = showRootTypes;
		filterByWord();
	};

	const showQueries = () => {
		if (queries) {
			whatToShow = queries?.sort((a: any, b: any) => {
				let ea = a.dd_rootName;
				let eb = b.dd_rootName;
				let ga = a.dd_displayName;
				let gb = b.dd_displayName;
				return sortingFunctionMutipleColumnsGivenArray([
					[ea, eb],
					[ga, gb]
				]);
			});
		} else {
			whatToShow = [];
		}
		whatToShowLastUsed = showQueries;
		filterByWord();
	};

	const showMutations = () => {
		if (mutations) {
			whatToShow = mutations?.sort((a: any, b: any) => {
				let ea = a.dd_rootName;
				let eb = b.dd_rootName;
				let fa = a.dd_displayName.substring(6);
				let fb = b.dd_displayName.substring(6);
				let ga = a.dd_displayName;
				let gb = b.dd_displayName;
				return sortingFunctionMutipleColumnsGivenArray([
					[ea, eb],
					[fa, fb],
					[ga, gb]
				]);
			});
		} else {
			whatToShow = [];
		}
		whatToShowLastUsed = showMutations;
		filterByWord();
	};

	const showAll = () => {
		if (mutations) {
			whatToShow = [...rootTypes, ...queries, ...mutations]?.sort((a: any, b: any) => {
				let ea = a.dd_rootName;
				let eb = b.dd_rootName;
				let fa = a.dd_displayName.substring(6);
				let fb = b.dd_displayName.substring(6);
				let ga = a.dd_displayName;
				let gb = b.dd_displayName;
				return sortingFunctionMutipleColumnsGivenArray([
					[ea, eb],
					[fa, fb],
					[ga, gb]
				]);
			});
		} else {
			whatToShow = [];
		}
		whatToShowLastUsed = showAll;
		filterByWord();
	};
	const showQueriesAndMutations = () => {
		if (mutations) {
			whatToShow = [...queries, ...mutations]?.sort((a: any, b: any) => {
				let ea = a.dd_rootName;
				let eb = b.dd_rootName;
				let fa = a.dd_displayName.substring(6);
				let fb = b.dd_displayName.substring(6);
				let ga = a.dd_displayName;
				let gb = b.dd_displayName;
				return sortingFunctionMutipleColumnsGivenArray([
					[ea, eb],
					[fa, fb],
					[ga, gb]
				]);
			});
		} else {
			whatToShow = [];
		}
		whatToShowLastUsed = showQueriesAndMutations;
		filterByWord();
	};
	const queryFieldByName = (name: string) => {
		return $schemaData.queryFields.filter((item: any) => {
			return item.name == name;
		})[0];
	};
	const mutationFieldByName = (name: string) => {
		return $schemaData.mutationFields.filter((item: any) => {
			return item.name == name;
		})[0];
	};
	let columns = $state<any[]>([]);

	$effect(() => {
		if (whatToShow.length > 0) {
			columns = [
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
				},
				{
					accessorFn: (row: any) => row?.tableBaseName,
					header: 'tableBaseName',
					footer: 'tableBaseName',
					enableHiding: true
				}
			];
		}
	});
	let showExplorer = $state(false);
	let showTable = $state(false);
	const toggleExplorer = () => {
		showExplorer = !showExplorer;
	};
	const toggleTable = () => {
		showTable = !showTable;
	};
	let csvData = $state<string>('');
	let selectedRowsOriginal = $state<any[]>([]);

	let showEditModal = $state(false);
	let editModalInitialValue = $state('');

	const handleEdit = () => {
		if (!selectedRowsOriginal || selectedRowsOriginal.length === 0) {
			addToast('No rows selected', 'warning');
			return;
		}

		if (selectedRowsOriginal.length === 1) {
			editModalInitialValue = selectedRowsOriginal[0].tableBaseName || '';
		} else {
			editModalInitialValue = 'tableName';
		}
		showEditModal = true;
	};

	const confirmEdit = (newValue: string) => {
		selectedRowsOriginal.forEach((row) => {
			row.tableBaseName = newValue;
		});
		whatToShow = [...whatToShow]; // trigger reactivity
	};
</script>

<Page MenuItem={true}>
	<section class="ml-4 h-screen w-screen overflow-auto pb-20">
		<div class="sticky top-0 z-10 mb-4 space-y-3 rounded-b-box bg-base-300 p-3 shadow-md">
			<!-- Row 1: Filter and View Toggles -->
			<div class="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
				<div class="join w-full md:w-auto">
					<input
						class="input-bordered input input-sm join-item flex-grow md:w-64"
						placeholder="Filter (e.g. +user -id)"
						bind:value={sortingInputValue}
						onkeydown={(e) => e.key === 'Enter' && filterByWord()}
					/>
					<button class="btn join-item btn-sm btn-primary" onclick={filterByWord} title="Filter">
						<i class="bi bi-funnel"></i>
					</button>
					<button
						class="btn join-item btn-sm"
						class:btn-active={caseSensitive}
						onclick={() => {
							caseSensitive = !caseSensitive;
						}}
						title={caseSensitive ? 'Case Sensitive: ON' : 'Case Sensitive: OFF'}
					>
						<span class="font-bold">Aa</span>
					</button>
				</div>

				<div class="join shadow-sm">
					<button
						class="btn join-item btn-sm"
						class:btn-neutral={showExplorer}
						onclick={toggleExplorer}
						data-testid="explorer-view-toggle"
					>
						<i class="bi bi-list-nested"></i> Explorer
					</button>
					<button class="btn join-item btn-sm" class:btn-neutral={showTable} onclick={toggleTable}>
						<i class="bi bi-table"></i> Table
					</button>
				</div>
			</div>

			<!-- Row 2: Scope and Actions -->
			<div class="flex flex-col items-center justify-between gap-3 overflow-x-auto md:flex-row">
				<div class="join shadow-sm">
					<button
						class="btn join-item btn-sm"
						onclick={showRootTypes}
						class:btn-active={whatToShowLastUsed === showRootTypes}>Root</button
					>
					<button
						class="btn join-item btn-sm"
						onclick={showQueries}
						class:btn-active={whatToShowLastUsed === showQueries}
						data-testid="explorer-scope-queries">Queries</button
					>
					<button
						class="btn join-item btn-sm"
						onclick={showMutations}
						class:btn-active={whatToShowLastUsed === showMutations}>Mutations</button
					>
					<button
						class="btn join-item btn-sm"
						onclick={showQueriesAndMutations}
						class:btn-active={whatToShowLastUsed === showQueriesAndMutations}>Q&M</button
					>
					<button
						class="btn join-item btn-sm"
						onclick={showAll}
						class:btn-active={whatToShowLastUsed === showAll}>All</button
					>
				</div>

				<div class="join shadow-sm">
					<button
						class="btn join-item btn-sm"
						onclick={() => navigator.clipboard.writeText(csvData)}
						title="Copy CSV"
						disabled={!csvData}
					>
						<i class="bi bi-clipboard"></i> Copy CSV
					</button>
					<button class="btn join-item btn-sm" onclick={handleEdit} title="Edit Table Name">
						<i class="bi bi-pencil"></i> Edit
					</button>
					<button
						class="btn join-item btn-sm"
						onclick={() => {
							whatToShow = whatToShow;
							showTable = false;
							setTimeout(() => {
								showTable = true;
							}, 200);
						}}
						title="Rerender Table"
					>
						<i class="bi bi-arrow-repeat"></i>
					</button>
				</div>
			</div>
		</div>

		{#if showTable && whatToShow.length > 0}
			<!-- content here -->
			<ExplorerTable
				data={whatToShow}
				{columns}
				onRowSelectionChange={(detail: any) => {
					selectedRowsOriginal = detail.rows.map((row: any) => row.original);
					let columnNames: string[] = [];
					let rowsData: string[];
					rowsData = detail.rows.map((row: any, i: number) => {
						return row
							.getVisibleCells()
							.map((cell: any) => {
								if (i == 0) {
									columnNames.push(cell.column.id);
								}
								return cell.getValue();
							})
							.join(`,`);
					});
					csvData = `${columnNames.join(`,`)}\n${rowsData.join(`\n`)}`;
				}}
			/>
		{/if}
		{#if showExplorer}
			<div class="">
				{#key whatToShow}
					{#each whatToShow as type, index (index)}
						<Type {index} {type} template="default" depth={0} />
					{/each}
				{/key}
			</div>{/if}
	</section>

	<EditTableBaseNameModal
		bind:show={showEditModal}
		initialValue={editModalInitialValue}
		onConfirm={confirmEdit}
		onCancel={() => (showEditModal = false)}
	/>
</Page>

<style>
</style>
