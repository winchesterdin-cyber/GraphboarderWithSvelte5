<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	interface Props {
		endpoints: any[];
	}

	let { endpoints }: Props = $props();

	const handleEndpointClick = (endpoint) => {
		goto(`${base}/endpoints/${endpoint.id}`);
	};
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each endpoints as endpoint}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border border-base-200"
			onclick={() => handleEndpointClick(endpoint)}
		>
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title truncate" title={endpoint.id}>{endpoint.id}</h2>
					{#if endpoint.isMantained}
						<div class="badge badge-success gap-2">Maintained</div>
					{:else}
						<div class="badge badge-warning gap-2">Unmaintained</div>
					{/if}
				</div>
				<p class="text-sm opacity-70 truncate" title={endpoint.url}>{endpoint.url}</p>
				{#if endpoint.description}
					<p class="text-sm mt-2 line-clamp-2">{endpoint.description}</p>
				{/if}
			</div>
		</div>
	{/each}
</div>
