<script lang="ts">
	/**
	 * History page component.
	 * Displays a list of executed queries/mutations for the current endpoint.
	 * Allows searching, filtering, exporting, importing, and restoring history items.
	 */
	import { page } from '$app/stores';
	import { historyQueries } from '$lib/stores/historyQueriesStore';
	import { downloadJSON } from '$lib/utils/downloadUtils';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toastStore';
	import { logger } from '$lib/utils/logger';

	let endpointId = $derived($page.params.endpointid);

	let searchTerm = $state('');
	let filterType = $state('all');
	let filterStatus = $state('all');

	let history = $derived(
		$historyQueries
			.filter((q) => {
				const isEndpoint = q.endpointId === endpointId;
				const matchesSearch = q.queryName.toLowerCase().includes(searchTerm.toLowerCase());
				const matchesType = filterType === 'all' || q.type === filterType;
				const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
				return isEndpoint && matchesSearch && matchesType && matchesStatus;
			})
			.sort((a, b) => b.timestamp - a.timestamp)
	);

	const handleClear = () => {
		if (confirm('Are you sure you want to clear ALL history for ALL endpoints?')) {
			logger.info('User cleared all history');
			historyQueries.clear();
			addToast('History cleared', 'success');
		}
	};

	const handleExport = () => {
		if (history.length === 0) {
			addToast('No history to export.', 'info');
			return;
		}
		logger.info('User exported history', { count: history.length, endpointId });
		// Export without ID for portability (IDs regenerated on import)
		const exportData = history.map(({ id, ...rest }) => rest);
		downloadJSON(exportData, `history-${endpointId}.json`);
		addToast('History exported', 'success');
	};

	let fileInput = $state<HTMLInputElement | null>(null);

	const handleImportClick = () => {
		fileInput?.click();
	};

	const handleFileChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const json = JSON.parse(event.target?.result as string);
				if (Array.isArray(json)) {
					logger.info('User imported history', { count: json.length });
					historyQueries.importHistory(json);
					addToast(`Imported ${json.length} history items`, 'success');
				} else {
					addToast('Invalid file format: Expected an array', 'error');
				}
			} catch (err) {
				logger.error('Failed to parse history import file', err);
				addToast('Failed to parse JSON file', 'error');
			}
			target.value = '';
		};
		reader.readAsText(file);
	};

	const restoreQuery = async (q: any) => {
		const url = `/endpoints/${endpointId}/${q.type === 'query' ? 'queries' : 'mutations'}/${q.queryName}?historyId=${q.id}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(url);
	};

	const handleDelete = (id: string) => {
		if (confirm('Remove this history item?')) {
			historyQueries.remove(id);
			addToast('History item removed', 'success');
		}
	};
</script>

<div class="p-4">
	<div class="mb-4 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">History</h1>
			<div class="flex gap-2">
				<button class="btn btn-outline btn-sm" onclick={handleExport}>
					<i class="bi bi-download"></i> Export
				</button>
				<button class="btn btn-outline btn-sm" onclick={handleImportClick}>
					<i class="bi bi-upload"></i> Import
				</button>
				<button class="btn btn-outline btn-sm btn-error" onclick={handleClear}>
					<i class="bi bi-trash"></i> Clear All
				</button>
				<input
					type="file"
					bind:this={fileInput}
					onchange={handleFileChange}
					accept=".json"
					class="hidden"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2 md:flex-row">
			<input
				type="text"
				placeholder="Search by name..."
				class="input-bordered input input-sm w-full md:w-1/3"
				bind:value={searchTerm}
			/>
			<select class="select-bordered select select-sm" bind:value={filterType}>
				<option value="all">All Types</option>
				<option value="query">Query</option>
				<option value="mutation">Mutation</option>
			</select>
			<select class="select-bordered select select-sm" bind:value={filterStatus}>
				<option value="all">All Statuses</option>
				<option value="success">Success</option>
				<option value="error">Error</option>
			</select>
		</div>
	</div>

	{#if history.length === 0}
		<div class="alert alert-info">
			<i class="bi bi-info-circle"></i>
			<span>No history for this endpoint. Run some queries!</span>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead>
					<tr>
						<th>Status</th>
						<th>Name</th>
						<th>Executed At</th>
						<th>Duration</th>
						<th class="text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each history as item (item.id)}
						<tr class="hover">
							<td>
								{#if item.status === 'success'}
									<span class="badge badge-sm badge-success">OK</span>
								{:else}
									<span class="badge badge-sm badge-error">ERR</span>
								{/if}
							</td>
							<td class="font-medium">
								<button
									class="link font-bold link-hover"
									onclick={async () => await restoreQuery(item)}
								>
									{item.queryName}
								</button>
								<span class="ml-1 text-xs opacity-50">({item.type})</span>
							</td>
							<td>{new Date(item.timestamp).toLocaleString()}</td>
							<td>{item.duration} ms</td>
							<td class="text-right">
								<button
									class="btn btn-ghost btn-xs"
									onclick={async () => await restoreQuery(item)}
									title="Restore State"
									aria-label="Restore query"
								>
									<i class="bi bi-arrow-counterclockwise text-lg"></i>
								</button>
								<button
									class="btn btn-ghost btn-xs text-error"
									onclick={() => handleDelete(item.id)}
									title="Delete history item"
									aria-label="Delete history item"
								>
									<i class="bi bi-trash text-lg"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
