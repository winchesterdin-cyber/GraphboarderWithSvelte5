<script lang="ts">
	import { page } from '$app/stores';
	import { favoriteQueries, type FavoriteQuery } from '$lib/stores/favoriteQueriesStore';
	import { downloadJSON } from '$lib/utils/downloadUtils';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toastStore';
	import Modal from '$lib/components/Modal.svelte';

	let endpointId = $derived($page.params.endpointid ?? '');

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

	let existingFolders = $derived(
		Array.from(new Set(favorites.map((q) => q.folder).filter(Boolean))).sort()
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

	let showEditModal = $state(false);
	let editFavorite = $state<FavoriteQuery | null>(null);
	let editName = $state('');
	let editFolder = $state('');
	let showRenameFolderModal = $state(false);
	let renameFromFolder = $state('');
	let renameToFolder = $state('');

	const openEditModal = (favorite: FavoriteQuery) => {
		editFavorite = favorite;
		editName = favorite.name;
		editFolder = favorite.folder ?? '';
		showEditModal = true;
	};

	const closeEditModal = () => {
		showEditModal = false;
		editFavorite = null;
		editName = '';
		editFolder = '';
	};

	const handleUpdateFavorite = () => {
		if (!editFavorite) return;
		if (!editName.trim()) {
			addToast('Favorite name is required', 'error');
			return;
		}
		favoriteQueries.update(editFavorite.id, {
			name: editName,
			folder: editFolder
		});
		addToast('Favorite updated', 'success');
		closeEditModal();
	};

	const openRenameFolderModal = (folder: string) => {
		renameFromFolder = folder;
		renameToFolder = folder;
		showRenameFolderModal = true;
	};

	const closeRenameFolderModal = () => {
		showRenameFolderModal = false;
		renameFromFolder = '';
		renameToFolder = '';
	};

	const handleRenameFolder = () => {
		if (!renameFromFolder) return;
		if (renameFromFolder === 'Uncategorized') {
			addToast('Cannot rename the Uncategorized folder', 'error');
			return;
		}
		favoriteQueries.renameFolder(endpointId, renameFromFolder, renameToFolder);
		addToast(`Folder "${renameFromFolder}" updated`, 'success');
		closeRenameFolderModal();
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
				class="collapse-arrow collapse mb-2 rounded-box border border-base-300 bg-base-100"
				open
			>
				<summary class="collapse-title text-xl font-medium">
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span>{folder}</span>
							<span class="badge badge-outline badge-sm">{groupedFavorites[folder].length}</span>
						</div>
						{#if folder !== 'Uncategorized'}
							<button
								class="btn btn-ghost btn-xs"
								type="button"
								onclick={(event) => {
									event.stopPropagation();
									openRenameFolderModal(folder);
								}}
								title="Rename folder"
								aria-label="Rename folder"
							>
								<i class="bi bi-pencil-square"></i>
							</button>
						{/if}
					</div>
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
												class="badge {fav.type === 'query' ? 'badge-primary' : 'badge-secondary'}"
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
												class="btn btn-ghost btn-xs"
												onclick={() => openEditModal(fav)}
												title="Edit"
												aria-label="Edit favorite"
											>
												<i class="bi bi-pencil-square"></i>
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

<Modal bind:show={showEditModal} showApplyBtn={false} onCancel={closeEditModal}>
	<div class="space-y-4">
		<h2 class="text-lg font-semibold">Edit Favorite</h2>
		<div class="form-control">
			<label class="label" for="favorite-name">
				<span class="label-text">Name</span>
			</label>
			<input
				id="favorite-name"
				class="input-bordered input w-full"
				type="text"
				bind:value={editName}
				placeholder="Favorite name"
			/>
		</div>
		<div class="form-control">
			<label class="label" for="favorite-folder">
				<span class="label-text">Folder (optional)</span>
			</label>
			<input
				id="favorite-folder"
				class="input-bordered input w-full"
				type="text"
				list="favorite-folders"
				bind:value={editFolder}
				placeholder="Folder name"
			/>
			<datalist id="favorite-folders">
				{#each existingFolders as folder}
					<option value={folder}></option>
				{/each}
			</datalist>
			<p class="mt-1 text-xs text-base-content/60">
				Leave blank to move the favorite into "Uncategorized".
			</p>
		</div>
		<div class="flex justify-end gap-2">
			<button class="btn btn-ghost" onclick={closeEditModal}>Cancel</button>
			<button class="btn btn-primary" onclick={handleUpdateFavorite}>Save</button>
		</div>
	</div>
</Modal>

<Modal bind:show={showRenameFolderModal} showApplyBtn={false} onCancel={closeRenameFolderModal}>
	<div class="space-y-4">
		<h2 class="text-lg font-semibold">Rename Folder</h2>
		<div class="form-control">
			<label class="label" for="rename-from-folder">
				<span class="label-text">Current folder</span>
			</label>
			<input
				id="rename-from-folder"
				class="input-bordered input w-full"
				type="text"
				value={renameFromFolder}
				disabled
			/>
		</div>
		<div class="form-control">
			<label class="label" for="rename-to-folder">
				<span class="label-text">New folder name</span>
			</label>
			<input
				id="rename-to-folder"
				class="input-bordered input w-full"
				type="text"
				bind:value={renameToFolder}
				placeholder="Folder name (leave blank to clear)"
			/>
			<p class="mt-1 text-xs text-base-content/60">
				Leave blank to move favorites into "Uncategorized".
			</p>
		</div>
		<div class="flex justify-end gap-2">
			<button class="btn btn-ghost" onclick={closeRenameFolderModal}>Cancel</button>
			<button class="btn btn-primary" onclick={handleRenameFolder}>Save</button>
		</div>
	</div>
</Modal>
