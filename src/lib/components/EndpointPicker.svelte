<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	interface Props {
		endpoints: any[];
		onAddEndpoint?: () => void;
	}

	let { endpoints, onAddEndpoint }: Props = $props();

	let searchTerm = $state('');

	let filteredEndpoints = $derived(
		endpoints.filter((endpoint) => {
			const term = searchTerm.toLowerCase();
			return (
				endpoint.id.toLowerCase().includes(term) ||
				endpoint.url.toLowerCase().includes(term) ||
				(endpoint.description && endpoint.description.toLowerCase().includes(term))
			);
		})
	);

	const handleEndpointClick = (endpoint) => {
		goto(`${base}/endpoints/${endpoint.id}`);
	};
</script>

<div class="mb-6 flex gap-4 items-center">
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
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredEndpoints as endpoint}
			<button
				class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer border border-base-200 text-start w-full"
				onclick={() => handleEndpointClick(endpoint)}
			>
				<div class="card-body">
					<div class="flex items-start justify-between gap-2 w-full">
						<h2 class="card-title truncate flex-1" title={endpoint.id}>
							<i class="bi bi-hdd-network text-primary"></i>
							{endpoint.id}
						</h2>
						{#if endpoint.isMantained}
							<div class="badge badge-success badge-sm shrink-0">Maintained</div>
						{:else}
							<div class="badge badge-warning badge-sm shrink-0">Unmaintained</div>
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
			</button>
		{/each}
	</div>
{/if}
