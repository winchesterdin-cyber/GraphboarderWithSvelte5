<!--
	@component
	EndpointPicker

	A component that allows users to select from a list of available GraphQL endpoints.
	It provides features to:
	- Search endpoints by name or URL.
	- Sort endpoints by name.
	- Add new custom endpoints.
	- Edit or delete user-defined endpoints.
	- Visually distinguish between "Maintained" (built-in) and "User Defined" endpoints.
	- Check and display endpoint health status (New Feature).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		clearRecentEndpoints,
		recordRecentEndpoint,
		removeEndpoint,
		recentEndpoints,
		toggleEndpointFavorite
	} from '$lib/stores/endpointsStore';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { addToast } from '$lib/stores/toastStore';
	import type { AvailableEndpoint } from '$lib/types';
	import { checkEndpointHealth } from '$lib/utils/healthCheck';
	import { logger } from '$lib/utils/logger';

	interface Props {
		endpoints: AvailableEndpoint[];
		onAddEndpoint?: () => void;
		onEditEndpoint?: (endpoint: AvailableEndpoint) => void;
		onDuplicateEndpoint?: (endpoint: AvailableEndpoint) => void;
	}

	let { endpoints, onAddEndpoint, onEditEndpoint, onDuplicateEndpoint }: Props = $props();

	let searchTerm = $state('');
	let sortOption = $state<'name-asc' | 'name-desc'>('name-asc');
	let statusFilter = $state<'all' | 'online' | 'offline' | 'pending'>('all');
	let favoriteFilter = $state<'all' | 'favorites'>('all');
	let showDeleteModal = $state(false);
	let endpointToDelete = $state<AvailableEndpoint | null>(null);

	// Derived list used for the "Recent endpoints" quick-access badges.
	const recentEndpointList = $derived($recentEndpoints);

	// Health Check State
	let healthStatus = $state<Record<string, { healthy: boolean; latency?: number; error?: string }>>(
		{}
	);
	let isChecking = $state<Record<string, boolean>>({});

	/**
	 * Determines the current health status bucket for an endpoint.
	 * "pending" covers the initial load and any in-progress checks.
	 */
	const getEndpointStatus = (endpoint: AvailableEndpoint) => {
		if (isChecking[endpoint.id] || !healthStatus[endpoint.id]) {
			return 'pending';
		}

		return healthStatus[endpoint.id]?.healthy ? 'online' : 'offline';
	};

	const runHealthCheck = async (endpoint: AvailableEndpoint) => {
		if (isChecking[endpoint.id]) return;
		isChecking[endpoint.id] = true;
		healthStatus = { ...healthStatus }; // Trigger reactivity if needed, though Svelte 5 proxies should handle it

		const result = await checkEndpointHealth(endpoint.url, endpoint.headers);
		healthStatus[endpoint.id] = result;
		isChecking[endpoint.id] = false;
		healthStatus = { ...healthStatus };
	};

	$effect(() => {
		// Run check for any endpoint that hasn't been checked yet
		endpoints.forEach((ep) => {
			if (!healthStatus[ep.id] && !isChecking[ep.id]) {
				runHealthCheck(ep);
			}
		});
	});

	let filteredEndpoints = $derived(
		endpoints
			.filter((endpoint) => {
				const term = searchTerm.toLowerCase();
				const status = getEndpointStatus(endpoint);
				return (
					(statusFilter === 'all' || statusFilter === status) &&
					(favoriteFilter === 'all' || endpoint.isFavorite) &&
					(endpoint.id.toLowerCase().includes(term) ||
						endpoint.url.toLowerCase().includes(term) ||
						(endpoint.description && endpoint.description?.toLowerCase().includes(term)))
				);
			})
			.sort((a, b) => {
				if (a.isFavorite !== b.isFavorite) {
					return a.isFavorite ? -1 : 1;
				}

				if (sortOption === 'name-asc') {
					return a.id.localeCompare(b.id);
				} else {
					return b.id.localeCompare(a.id);
				}
			})
	);

	let statusCounts = $derived(() => {
		const counts = {
			online: 0,
			offline: 0,
			pending: 0
		};

		endpoints.forEach((endpoint) => {
			const status = getEndpointStatus(endpoint);
			counts[status] += 1;
		});

		return counts;
	});

	let favoriteCount = $derived(() => endpoints.filter((endpoint) => endpoint.isFavorite).length);

	const handleEndpointClick = (endpoint: AvailableEndpoint) => {
		recordRecentEndpoint(endpoint.id.toString());
		logger.info('Navigating to endpoint', { id: endpoint.id, url: endpoint.url });
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

	/**
	 * Toggles the favorite state for an endpoint, keeping the action from triggering navigation.
	 */
	const handleFavoriteToggle = (endpoint: AvailableEndpoint, event: Event) => {
		event.stopPropagation();
		toggleEndpointFavorite(endpoint.id);
		addToast(`${endpoint.isFavorite ? 'Removed from' : 'Added to'} favorites`, 'info');
	};

	/**
	 * Clears recent endpoints and notifies the user.
	 */
	const handleClearRecents = () => {
		clearRecentEndpoints();
		addToast('Recent endpoints cleared', 'success');
	};
</script>

<div class="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
	<div class="flex w-full flex-col gap-2 md:w-auto">
		{#if recentEndpointList.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-semibold text-base-content/60 uppercase">Recent</span>
				{#each recentEndpointList as { endpoint, entry }}
					<button
						class="badge badge-outline"
						onclick={() => handleEndpointClick(endpoint)}
						title={`Last visited ${new Date(entry.lastVisited).toLocaleString()}`}
					>
						<i class="bi bi-clock-history"></i>
						{endpoint.id}
					</button>
				{/each}
				<button class="btn btn-ghost btn-xs" onclick={handleClearRecents}>Clear</button>
			</div>
		{/if}
	</div>
	<div class="flex w-full flex-1 gap-4 md:w-auto">
		<div class="relative w-full max-w-md">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<i class="bi bi-search text-base-content/50"></i>
			</div>
			<input
				type="text"
				bind:value={searchTerm}
				placeholder="Search endpoints..."
				class="input-bordered input w-full pl-10"
			/>
		</div>
		{#if endpoints.length > 0 && filteredEndpoints.length === 0}
			<button class="btn btn-ghost" onclick={() => (searchTerm = '')}>Clear Search</button>
		{/if}
	</div>

	<div class="flex w-full items-center justify-end gap-2 md:w-auto">
		<button
			class="btn gap-2 btn-ghost btn-sm"
			onclick={() => {
				logger.info('Refreshing endpoint health checks', { count: endpoints.length });
				healthStatus = {};
				endpoints.forEach((ep) => runHealthCheck(ep));
			}}
			title="Re-check connection status for all endpoints"
		>
			<i class="bi bi-arrow-clockwise"></i> Refresh Status
		</button>
		<select bind:value={statusFilter} class="select-bordered select" data-testid="status-filter">
			<option value="all">All Statuses</option>
			<option value="online">Online</option>
			<option value="offline">Offline</option>
			<option value="pending">Pending</option>
		</select>
		<select bind:value={sortOption} class="select-bordered select" data-testid="sort-filter">
			<option value="name-asc">Name (A-Z)</option>
			<option value="name-desc">Name (Z-A)</option>
		</select>
	</div>
</div>

<div class="mb-6 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
	<span class="font-semibold tracking-wide uppercase">Status Summary</span>
	<button
		class="badge gap-2 border-0 badge-success"
		onclick={() => (statusFilter = 'online')}
		title="Show only online endpoints"
	>
		Online {statusCounts.online}
	</button>
	<button
		class="badge gap-2 border-0 badge-error"
		onclick={() => (statusFilter = 'offline')}
		title="Show only offline endpoints"
	>
		Offline {statusCounts.offline}
	</button>
	<button
		class="badge gap-2 border-0 badge-ghost"
		onclick={() => (statusFilter = 'pending')}
		title="Show only pending endpoints"
	>
		Pending {statusCounts.pending}
	</button>
	<button
		class="badge gap-2 badge-outline"
		onclick={() => (statusFilter = 'all')}
		title="Clear status filter"
	>
		All {endpoints.length}
	</button>
	<button
		class={`badge gap-2 ${favoriteFilter === 'favorites' ? 'border-0 badge-warning' : 'badge-outline'}`}
		onclick={() => (favoriteFilter = favoriteFilter === 'favorites' ? 'all' : 'favorites')}
		title={favoriteFilter === 'favorites' ? 'Show all endpoints' : 'Show favorite endpoints'}
	>
		Favorites {favoriteCount}
	</button>
</div>

{#if endpoints.length === 0}
	<div class="rounded-lg border border-base-200 bg-base-100 p-10 text-center shadow-sm">
		<i class="bi bi-inbox mb-4 block text-4xl text-base-content/30"></i>
		<h3 class="text-lg font-semibold opacity-70">No Endpoints Found</h3>
		<p class="mt-2 mb-4 text-base-content/60">Add a new endpoint to get started.</p>
		{#if onAddEndpoint}
			<button class="btn btn-primary" onclick={onAddEndpoint}>
				<i class="bi bi-plus-lg mr-2"></i> Add Endpoint
			</button>
		{/if}
	</div>
{:else if filteredEndpoints.length === 0}
	<div class="p-10 text-center">
		<h3 class="text-lg font-semibold opacity-70">
			{favoriteFilter === 'favorites' ? 'No favorites yet' : 'No matching endpoints found'}
		</h3>
		<p class="mt-2 text-base-content/60">
			{favoriteFilter === 'favorites'
				? 'Star an endpoint to keep it at the top of your list.'
				: 'Try adjusting your search or status filters.'}
		</p>
		<div class="mt-2 flex flex-wrap justify-center gap-2">
			<button class="btn btn-ghost btn-sm" onclick={() => (searchTerm = '')}>Clear Search</button>
			<button class="btn btn-ghost btn-sm" onclick={() => (statusFilter = 'all')}>
				Clear Status Filter
			</button>
			<button class="btn btn-ghost btn-sm" onclick={() => (favoriteFilter = 'all')}>
				Clear Favorites Filter
			</button>
		</div>
	</div>
{:else}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredEndpoints as endpoint}
			<div
				class="group card relative w-full cursor-pointer border border-base-200 bg-base-100 text-start shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
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
					<div class="flex w-full items-start justify-between gap-2 pr-6">
						<h2 class="card-title flex-1 truncate" title={endpoint.id}>
							<i class="bi bi-hdd-network text-primary"></i>
							{endpoint.id}
						</h2>
						{#if endpoint.isMaintained}
							<div class="badge shrink-0 badge-sm badge-success">Maintained</div>
						{:else}
							<div class="badge shrink-0 badge-ghost badge-sm">User Defined</div>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-xs">
						<p
							class="w-full flex-1 truncate rounded bg-base-200 p-1 font-mono opacity-50"
							title={endpoint.url}
						>
							{endpoint.url}
						</p>
						<!-- Health Status Indicator -->
						<div
							class="tooltip tooltip-left"
							data-tip={isChecking[endpoint.id]
								? 'Checking...'
								: healthStatus[endpoint.id]?.healthy
									? `Online (${healthStatus[endpoint.id]?.latency}ms)`
									: `Offline: ${healthStatus[endpoint.id]?.error || 'Unknown error'}`}
						>
							{#if isChecking[endpoint.id]}
								<span class="loading loading-xs loading-spinner text-info"></span>
							{:else if healthStatus[endpoint.id]?.healthy}
								<div class="badge gap-1 badge-xs py-2 badge-success">
									<span class="h-2 w-2 rounded-full bg-white"></span>
									{healthStatus[endpoint.id]?.latency}ms
								</div>
							{:else if healthStatus[endpoint.id]}
								<div class="badge gap-1 badge-xs py-2 badge-error">
									<span class="h-2 w-2 rounded-full bg-white"></span>
									Offline
								</div>
							{:else}
								<div class="badge gap-1 badge-ghost badge-xs py-2">
									<span class="h-2 w-2 rounded-full bg-base-content/50"></span>
									Pending
								</div>
							{/if}
						</div>
					</div>
					{#if endpoint.description}
						<p class="mt-2 line-clamp-2 w-full text-sm text-base-content/80">
							{endpoint.description}
						</p>
					{/if}
				</div>

				<div class="absolute top-2 right-2 z-20 flex gap-1">
					<button
						class="btn btn-square text-warning opacity-100 btn-ghost transition-opacity btn-xs md:opacity-0 md:group-hover:opacity-100"
						onclick={(event) => handleFavoriteToggle(endpoint, event)}
						onkeydown={(e) => e.stopPropagation()}
						title={endpoint.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
					>
						<i class={endpoint.isFavorite ? 'bi bi-star-fill' : 'bi bi-star'}></i>
					</button>
					{#if onDuplicateEndpoint}
						<button
							class="btn btn-square text-primary opacity-100 btn-ghost transition-opacity btn-xs md:opacity-0 md:group-hover:opacity-100"
							onclick={(e) => {
								e.stopPropagation();
								onDuplicateEndpoint(endpoint);
							}}
							onkeydown={(e) => e.stopPropagation()}
							title="Duplicate Endpoint"
						>
							<i class="bi bi-copy"></i>
						</button>
					{/if}
					{#if !endpoint.isMaintained}
						{#if onEditEndpoint}
							<button
								class="btn btn-square text-info opacity-100 btn-ghost transition-opacity btn-xs md:opacity-0 md:group-hover:opacity-100"
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
							class="btn btn-square text-error opacity-100 btn-ghost transition-opacity btn-xs md:opacity-0 md:group-hover:opacity-100"
							onclick={(e) => confirmDelete(endpoint, e)}
							onkeydown={(e) => e.stopPropagation()}
							title="Delete Endpoint"
						>
							<i class="bi bi-trash"></i>
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<ConfirmationModal
	bind:show={showDeleteModal}
	onConfirm={handleDelete}
	onCancel={() => (showDeleteModal = false)}
/>
