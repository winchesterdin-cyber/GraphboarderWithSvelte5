<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import CodeEditor from '$lib/components/fields/CodeEditor.svelte';
	import { browser } from '$app/environment';

	interface Props {
		show?: boolean;
	}

	let { show = $bindable(false) }: Props = $props();

	let storageKeys = [
		'localStorageEndpoints',
		'favoriteEndpointIds',
		'historyQueries',
		'favoriteQueries',
		'envVars'
	];
	let selectedKey = $state('');
	let selectedValue = $state('');
	let viewMode = $state(false);

	let storageItems: Record<string, string> = $state({});

	const loadStorage = () => {
		if (!browser) return;
		const items: Record<string, string> = {};
		storageKeys.forEach((key) => {
			const val = localStorage.getItem(key);
			if (val) items[key] = val;
		});
		storageItems = items;
	};

	$effect(() => {
		if (show) {
			loadStorage();
			viewMode = false;
			selectedKey = '';
		}
	});

	const handleDelete = (key: string) => {
		if (confirm(`Are you sure you want to delete ${key}? This cannot be undone.`)) {
			localStorage.removeItem(key);
			loadStorage();
			if (selectedKey === key) {
				viewMode = false;
				selectedKey = '';
			}
		}
	};

	const handleView = (key: string) => {
		selectedKey = key;
		selectedValue = storageItems[key];
		try {
			selectedValue = JSON.stringify(JSON.parse(selectedValue), null, 2);
		} catch (e) {
			// keep raw if not json
		}
		viewMode = true;
	};

	const handleBack = () => {
		viewMode = false;
		selectedKey = '';
	};
</script>

<Modal bind:show modalIdentifier="local-storage-manager" showApplyBtn={false}>
	<h3 class="mb-4 text-lg font-bold">Local Storage Manager</h3>

	{#if !viewMode}
		{#if Object.keys(storageItems).length === 0}
			<p class="text-gray-500">No managed keys found in Local Storage.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="table w-full">
					<thead>
						<tr>
							<th>Key</th>
							<th>Size (chars)</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(storageItems) as [key, value]}
							<tr>
								<td>{key}</td>
								<td>{value.length}</td>
								<td class="flex gap-2">
									<button class="btn btn-xs btn-info" onclick={() => handleView(key)}>View</button>
									<button class="btn btn-xs btn-error" onclick={() => handleDelete(key)}
										>Delete</button
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		<div class="flex h-full flex-col gap-2">
			<div class="flex items-center justify-between">
				<h4 class="font-bold">{selectedKey}</h4>
				<button class="btn btn-xs" onclick={handleBack}>Back</button>
			</div>
			<div class="h-64 rounded border">
				<CodeEditor rawValue={selectedValue} language="json" readonly={true} />
			</div>
		</div>
	{/if}
</Modal>
