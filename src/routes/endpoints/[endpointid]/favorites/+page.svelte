<script lang="ts">
	import { page } from '$app/stores';
	import { favoriteQueries } from '$lib/stores/favoriteQueriesStore';
	import { downloadJSON } from '$lib/utils/downloadUtils';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toastStore';

	let endpointId = $derived($page.params.endpointid);

	// Filter favorites for current endpoint
	let favorites = $derived($favoriteQueries.filter((q) => q.endpointId === endpointId));

	let groupedFavorites = $derived.by(() => {
		const groups: Record<string, typeof favorites> = {};
		favorites.forEach((f) => {
			const key = f.folder || 'Uncategorized';
			if (!groups[key]) groups[key] = [];
			groups[key].push(f);
		});
		return groups;
	});

	let sortedFolders = $derived(
		Object.keys(groupedFavorites).sort((a, b) => {
			if (a === 'Uncategorized') return -1;
			if (b === 'Uncategorized') return 1;
			return a.localeCompare(b);
		})
	);

	const handleDelete = (id: string) => {
		if (confirm('Are you sure you want to delete this favorite?')) {
			favoriteQueries.remove(id);
			addToast('Favorite deleted', 'success');
		}
	};

	const handleExport = () => {
		if (favorites.length === 0) {
			addToast('No favorites to export.', 'info');
			return;
		}
		// Export without ID and timestamp for cleaner portability
		// The store import expects Omit<FavoriteQuery, 'id' | 'timestamp'>
		const exportData = favorites.map(({ id, timestamp, ...rest }) => rest);
		downloadJSON(exportData, `favorites-${endpointId}.json`);
		addToast('Favorites exported', 'success');
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
					favoriteQueries.importFavorites(json);
					addToast(`Imported ${json.length} favorites`, 'success');
				} else {
					addToast('Invalid file format: Expected an array', 'error');
				}
			} catch (err) {
				console.error(err);
				addToast('Failed to parse JSON file', 'error');
			}
			// Reset input
			target.value = '';
		};
		reader.readAsText(file);
	};

	const navigateToQuery = async (q: any) => {
		const url = `/endpoints/${endpointId}/${q.type === 'query' ? 'queries' : 'mutations'}/${q.name}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(url);
	};
</script>

<div class="p-4">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Favorites</h1>
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={handleExport}>
				<i class="bi bi-download"></i> Export
			</button>
			<button class="btn btn-outline btn-sm" onclick={handleImportClick}>
				<i class="bi bi-upload"></i> Import
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

	{#if favorites.length === 0}
		<div class="alert alert-info">
			<i class="bi bi-info-circle"></i>
			<span>No favorites saved for this endpoint yet. Save queries from the execution view.</span>
		</div>
	{:else}
		{#each sortedFolders as folder (folder)}
			<details
				class="collapse collapse-arrow border-base-300 bg-base-100 rounded-box mb-2 border"
				open
			>
				<summary class="collapse-title text-xl font-medium">
					{folder}
					<span class="badge badge-sm badge-outline ml-2">{groupedFavorites[folder].length}</span>
				</summary>
				<div class="collapse-content">
					<div class="overflow-x-auto">
						<table class="table w-full">
							<thead>
								<tr>
									<th>Name</th>
									<th>Type</th>
									<th>Saved At</th>
									<th class="text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each groupedFavorites[folder] as fav (fav.id)}
									<tr class="hover">
										<td class="font-medium">
											<button
												class="link font-bold text-primary link-hover"
												onclick={async () => await navigateToQuery(fav)}
											>
												{fav.name}
											</button>
										</td>
										<td>
											<span
												class="badge {fav.type === 'query'
													? 'badge-primary'
													: 'badge-secondary'}"
											>
												{fav.type}
											</span>
										</td>
										<td>{new Date(fav.timestamp).toLocaleString()}</td>
										<td class="space-x-1 text-right">
											<button
												class="btn btn-ghost btn-xs"
												onclick={async () => await navigateToQuery(fav)}
												title="Run"
												aria-label="Run query"
											>
												<i class="bi bi-play-fill text-lg"></i>
											</button>
											<button
												class="btn text-error btn-ghost btn-xs"
												onclick={() => handleDelete(fav.id)}
												title="Delete"
												aria-label="Delete favorite"
											>
												<i class="bi bi-trash"></i>
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</details>
		{/each}
	{/if}
</div>
