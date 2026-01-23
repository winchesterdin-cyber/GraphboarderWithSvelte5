<script lang="ts">
	import Type from '$lib/components/Type.svelte';
	import Page from '$lib/components/Page.svelte';
	import { sortingFunctionMutipleColumnsGivenArray } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	import ExplorerTable from '$lib/components/ExplorerTable.svelte';
	import EditTableBaseNameModal from '$lib/components/EditTableBaseNameModal.svelte';
	import { addToast } from '$lib/stores/toastStore';

	interface Props {
		prefix?: string;
	}

	let { prefix = '' } = $props();

	let QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	const schemaData = QMSMainWraperContext?.schemaData;

	let rootTypes = $schemaData.rootTypes;
	let queries = $schemaData.queryFields;
	let mutations = $schemaData.mutationFields;
	let whatToShow = $state([]);
	let whatToShowLastUsed = $state();
	let sortingInputValue = $state('');
	let sortingArray = $derived(sortingInputValue.split(' '));
	let caseSensitive = $state(false);

	const filterByWord = () => {
		if (sortingArray.length == 1 && sortingArray[0] == '') {
			return;
		}

		const positiveWords = [];
		const negativeWords = [];
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
		whatToShow = rootTypes?.sort((a, b) => {
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
			whatToShow = queries?.sort((a, b) => {
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
			whatToShow = mutations?.sort((a, b) => {
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
			whatToShow = [...rootTypes, ...queries, ...mutations]?.sort((a, b) => {
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
			whatToShow = [...queries, ...mutations]?.sort((a, b) => {
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
	const queryFieldByName = (name) => {
		return $schemaData.queryFields.filter((item) => {
			return item.name == name;
		})[0];
	};
	const mutationFieldByName = (name) => {
		return $schemaData.mutationFields.filter((item) => {
			return item.name == name;
		})[0];
	};
	let columns = $state([]);

	$effect(() => {
		if (whatToShow.length > 0) {
			columns = [
				{
					accessorFn: (row) => row.dd_displayName,
					header: 'dd_displayName',
					footer: 'dd_displayName',
					enableHiding: true
				},
				{
					accessorFn: (row) => row.dd_rootName,
					header: 'dd_rootName',
					footer: 'dd_rootName',
					enableHiding: true
				},
				{
					accessorFn: (row) => (row.dd_kindList_NON_NULL ? '!' : ''),
					header: 'L',
					footer: 'L',
					enableHiding: true
				},
				{
					accessorFn: (row) => (row.dd_kindList ? 'list' : ''),
					header: 'LL',
					footer: 'LL',
					enableHiding: true
				},
				{
					accessorFn: (row) => (row.dd_kindEl_NON_NULL ? '!' : ''),
					header: 'E',
					footer: 'E',
					enableHiding: true
				},
				{
					accessorFn: (row) => row.dd_kindEl,
					header: 'EE',
					footer: 'EE',
					enableHiding: true
				},

				{
					accessorFn: (row) =>
						row.args
							?.map(
								(arg) =>
									`${arg.dd_displayName} (${arg.dd_kindList ? 'list of ' : ''}${arg.dd_kindEl})`
							)
							.join('; '),
					header: 'Arguments',
					footer: 'Arguments',
					enableHiding: true
				},
				{
					accessorFn: (row) => row.description?.replaceAll(',', ';'),
					header: 'description',
					footer: 'description',
					enableHiding: true
				},
				{
					accessorFn: (row) => row?.tableBaseName,
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
	<section class="h-screen pb-20 w-screen overflow-auto ml-4">
		<div class="sticky top-0 bg-base-300 z-10 p-3 shadow-md space-y-3 rounded-b-box mb-4">
			<!-- Row 1: Filter and View Toggles -->
			<div class="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
				<div class="join w-full md:w-auto">
					<input
						class="input input-sm input-bordered join-item flex-grow md:w-64"
						placeholder="Filter (e.g. +user -id)"
						bind:value={sortingInputValue}
						onkeydown={(e) => e.key === 'Enter' && filterByWord()}
					/>
					<button class="btn btn-sm btn-primary join-item" onclick={filterByWord} title="Filter">
						<i class="bi bi-funnel"></i>
					</button>
					<button
						class="btn btn-sm join-item"
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
						class="btn btn-sm join-item"
						class:btn-neutral={showExplorer}
						onclick={toggleExplorer}
					>
						<i class="bi bi-list-nested"></i> Explorer
					</button>
					<button
						class="btn btn-sm join-item"
						class:btn-neutral={showTable}
						onclick={toggleTable}
					>
						<i class="bi bi-table"></i> Table
					</button>
				</div>
			</div>

			<!-- Row 2: Scope and Actions -->
			<div
				class="flex flex-col md:flex-row gap-3 justify-between items-center overflow-x-auto"
			>
				<div class="join shadow-sm">
					<button
						class="btn btn-sm join-item"
						onclick={showRootTypes}
						class:btn-active={whatToShowLastUsed === showRootTypes}>Root</button
					>
					<button
						class="btn btn-sm join-item"
						onclick={showQueries}
						class:btn-active={whatToShowLastUsed === showQueries}>Queries</button
					>
					<button
						class="btn btn-sm join-item"
						onclick={showMutations}
						class:btn-active={whatToShowLastUsed === showMutations}>Mutations</button
					>
					<button
						class="btn btn-sm join-item"
						onclick={showQueriesAndMutations}
						class:btn-active={whatToShowLastUsed === showQueriesAndMutations}>Q&M</button
					>
					<button
						class="btn btn-sm join-item"
						onclick={showAll}
						class:btn-active={whatToShowLastUsed === showAll}>All</button
					>
				</div>

				<div class="join shadow-sm">
					<button
						class="btn btn-sm join-item"
						onclick={() => navigator.clipboard.writeText(csvData)}
						title="Copy CSV"
						disabled={!csvData}
					>
						<i class="bi bi-clipboard"></i> Copy CSV
					</button>
					<button class="btn btn-sm join-item" onclick={handleEdit} title="Edit Table Name">
						<i class="bi bi-pencil"></i> Edit
					</button>
					<button
						class="btn btn-sm join-item"
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
				onRowSelectionChange={(detail) => {
					selectedRowsOriginal = detail.rows.map((row) => row.original);
					let columnNames = [];
					let rowsData;
					rowsData = detail.rows.map((row, i) => {
						return row
							.getVisibleCells()
							.map((cell) => {
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
						<Type
							{index}
							{type}
							template="default"
							depth={0}
							on:colAddRequest={(e) => {
							}}
						/>
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
