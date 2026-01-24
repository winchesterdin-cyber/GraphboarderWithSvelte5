<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { removeEndpoint } from '$lib/stores/endpointsStore';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { addToast } from '$lib/stores/toastStore';
	import type { AvailableEndpoint } from '$lib/types';

	interface Props {
		endpoints: AvailableEndpoint[];
		onAddEndpoint?: () => void;
		onEditEndpoint?: (endpoint: AvailableEndpoint) => void;
	}

	let { endpoints, onAddEndpoint, onEditEndpoint }: Props = $props();

	let searchTerm = $state('');
	let sortOption = $state<'name-asc' | 'name-desc'>('name-asc');
	let showDeleteModal = $state(false);
	let endpointToDelete = $state<AvailableEndpoint | null>(null);

	let filteredEndpoints = $derived(
		endpoints
			.filter((endpoint) => {
				const term = searchTerm.toLowerCase();
				return (
					endpoint.id.toLowerCase().includes(term) ||
					endpoint.url.toLowerCase().includes(term) ||
					(endpoint.description && endpoint.description?.toLowerCase().includes(term))
				);
			})
			.sort((a, b) => {
				if (sortOption === 'name-asc') {
					return a.id.localeCompare(b.id);
				} else {
					return b.id.localeCompare(a.id);
				}
			})
	);

	const handleEndpointClick = (endpoint: AvailableEndpoint) => {
		goto(`${base}/endpoints/${endpoint.id}`);
	};

	const confirmDelete = (endpoint: AvailableEndpoint, event: Event) => {
		event.stopPropagation();
		endpointToDelete = endpoint;
		showDeleteModal = true;
	};

	const handleDelete = () => {
		if (endpointToDelete) {
			removeEndpoint(endpointToDelete.id);
			addToast(`Endpoint '${endpointToDelete.id}' deleted`, 'success');
			showDeleteModal = false;
			endpointToDelete = null;
		}
	};
</script>

<div class="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
	<div class="flex gap-4 w-full md:w-auto flex-1">
		<div class="relative w-full max-w-md">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<i class="bi bi-search text-base-content/50"></i>
			</div>
			<input
				type="text"
				bind:value={searchTerm}
				placeholder="Search endpoints..."
				class="input input-bordered w-full pl-10"
			/>
		</div>
		{#if endpoints.length > 0 && filteredEndpoints.length === 0}
			<button class="btn btn-ghost" onclick={() => (searchTerm = '')}>Clear Search</button>
		{/if}
	</div>

	<div class="flex items-center gap-2 w-full md:w-auto justify-end">
		<select bind:value={sortOption} class="select select-bordered">
			<option value="name-asc">Name (A-Z)</option>
			<option value="name-desc">Name (Z-A)</option>
		</select>
	</div>
</div>

{#if endpoints.length === 0}
	<div class="text-center p-10 bg-base-100 rounded-lg border border-base-200 shadow-sm">
		<i class="bi bi-inbox text-4xl text-base-content/30 mb-4 block"></i>
		<h3 class="text-lg font-semibold opacity-70">No Endpoints Found</h3>
		<p class="text-base-content/60 mt-2 mb-4">Add a new endpoint to get started.</p>
		{#if onAddEndpoint}
			<button class="btn btn-primary" onclick={onAddEndpoint}>
				<i class="bi bi-plus-lg mr-2"></i> Add Endpoint
			</button>
		{/if}
	</div>
{:else if filteredEndpoints.length === 0}
	<div class="text-center p-10">
		<h3 class="text-lg font-semibold opacity-70">No matching endpoints found</h3>
		<p class="text-base-content/60 mt-2">Try adjusting your search terms.</p>
		<button class="btn btn-ghost btn-sm mt-2" onclick={() => (searchTerm = '')}>Clear Search</button>
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredEndpoints as endpoint}
			<div
				class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer border border-base-200 text-start w-full relative group"
				onclick={() => handleEndpointClick(endpoint)}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleEndpointClick(endpoint);
					}
				}}
			>
				<div class="card-body">
					<div class="flex items-start justify-between gap-2 w-full pr-6">
						<h2 class="card-title truncate flex-1" title={endpoint.id}>
							<i class="bi bi-hdd-network text-primary"></i>
							{endpoint.id}
						</h2>
						{#if endpoint.isMaintained}
							<div class="badge badge-success badge-sm shrink-0">Maintained</div>
						{:else}
							<div class="badge badge-ghost badge-sm shrink-0">User Defined</div>
						{/if}
					</div>
					<p
						class="text-xs opacity-50 truncate font-mono bg-base-200 p-1 rounded w-full"
						title={endpoint.url}
					>
						{endpoint.url}
					</p>
					{#if endpoint.description}
						<p class="text-sm mt-2 line-clamp-2 text-base-content/80 w-full">
							{endpoint.description}
						</p>
					{/if}
				</div>

				{#if !endpoint.isMaintained}
					<div class="absolute top-2 right-2 z-20 flex gap-1">
						{#if onEditEndpoint}
							<button
								class="btn btn-square btn-xs btn-ghost text-info opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
								onclick={(e) => {
									e.stopPropagation();
									onEditEndpoint(endpoint);
								}}
								onkeydown={(e) => e.stopPropagation()}
								title="Edit Endpoint"
							>
								<i class="bi bi-pencil"></i>
							</button>
						{/if}
						<button
							class="btn btn-square btn-xs btn-ghost text-error opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
							onclick={(e) => confirmDelete(endpoint, e)}
							onkeydown={(e) => e.stopPropagation()}
							title="Delete Endpoint"
						>
							<i class="bi bi-trash"></i>
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<ConfirmationModal
	bind:show={showDeleteModal}
	onConfirm={handleDelete}
	onCancel={() => (showDeleteModal = false)}
/>
