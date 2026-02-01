<script lang="ts">
	import { page } from '$app/stores';
	import { historyQueries } from '$lib/stores/historyQueriesStore';
	import { downloadJSON } from '$lib/utils/downloadUtils';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toastStore';

	let endpointId = $derived($page.params.endpointid);

	let history = $derived(
		$historyQueries
			.filter((q) => q.endpointId === endpointId)
			.sort((a, b) => b.timestamp - a.timestamp)
	);

	const handleClear = () => {
		if (confirm('Are you sure you want to clear ALL history for ALL endpoints?')) {
			historyQueries.clear();
			addToast('History cleared', 'success');
		}
	};

	const handleExport = () => {
		if (history.length === 0) {
			addToast('No history to export.', 'info');
			return;
		}
		// Export without ID for portability (IDs regenerated on import)
		const exportData = history.map(({ id, ...rest }) => rest);
		downloadJSON(exportData, `history-${endpointId}.json`);
		addToast('History exported', 'success');
	};

	let fileInput: HTMLInputElement;

	const handleImportClick = () => {
		fileInput.click();
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
					historyQueries.importHistory(json);
					addToast(`Imported ${json.length} history items`, 'success');
				} else {
					addToast('Invalid file format: Expected an array', 'error');
				}
			} catch (err) {
				console.error(err);
				addToast('Failed to parse JSON file', 'error');
			}
			target.value = '';
		};
		reader.readAsText(file);
	};

	const restoreQuery = (q: any) => {
		const url = `/endpoints/${endpointId}/${q.type === 'query' ? 'queries' : 'mutations'}/${q.queryName}?historyId=${q.id}`;
		void goto(url);
	};
</script>

<div class="p-4">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">History</h1>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={handleExport}>
				<i class="bi bi-download"></i> Export
			</button>
			<button class="btn btn-outline btn-sm" onclick={handleImportClick}>
				<i class="bi bi-upload"></i> Import
			</button>
			<button class="btn btn-outline btn-error btn-sm" onclick={handleClear}>
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
									<span class="badge badge-success badge-sm">OK</span>
								{:else}
									<span class="badge badge-error badge-sm">ERR</span>
								{/if}
							</td>
							<td class="font-medium">
								<button class="link link-hover font-bold" onclick={() => restoreQuery(item)}>
									{item.queryName}
								</button>
								<span class="ml-1 text-xs opacity-50">({item.type})</span>
							</td>
							<td>{new Date(item.timestamp).toLocaleString()}</td>
							<td>{item.duration} ms</td>
							<td class="text-right">
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => restoreQuery(item)}
									title="Restore State"
									aria-label="Restore query"
								>
									<i class="bi bi-arrow-counterclockwise text-lg"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
