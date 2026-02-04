<script lang="ts">
	import { pinnedResponseStore } from '$lib/stores/pinnedResponseStore';
	import CodeEditor from '$lib/components/fields/CodeEditor.svelte';
	import { fade, fly } from 'svelte/transition';

	/**
	 * PinnedResponseViewer component.
	 * Displays the currently pinned response in a floating, collapsible panel.
	 */

	let isExpanded = $state(true);
	let pinnedResponse = $state<any>(null);

	// Subscribe to store
	$effect(() => {
		const unsubscribe = pinnedResponseStore.subscribe((value) => {
			pinnedResponse = value;
			if (value) {
				isExpanded = true; // Auto-expand when new response is pinned
			}
		});
		return unsubscribe;
	});

	const toggleExpand = () => {
		isExpanded = !isExpanded;
	};

	const handleClose = () => {
		pinnedResponseStore.clear();
	};

	const formatTimestamp = (ts: number) => {
		return new Date(ts).toLocaleTimeString();
	};
</script>

{#if pinnedResponse}
	<div
		transition:fly={{ y: 200, duration: 300 }}
		class="fixed right-4 bottom-0 z-50 w-[500px] max-w-[90vw] overflow-hidden rounded-t-lg bg-base-100 shadow-2xl ring-1 ring-base-300"
	>
		<!-- Header -->
		<div class="flex items-center justify-between bg-primary px-4 py-2 text-primary-content">
			<div class="flex items-center gap-2">
				<button
					class="btn btn-circle btn-ghost btn-xs"
					onclick={toggleExpand}
					aria-label={isExpanded ? 'Collapse' : 'Expand'}
				>
					<i class="bi {isExpanded ? 'bi-chevron-down' : 'bi-chevron-up'}"></i>
				</button>
				<div class="flex flex-col leading-tight">
					<span class="font-bold">Pinned: {pinnedResponse.queryName}</span>
					<span class="text-xs opacity-80">{formatTimestamp(pinnedResponse.timestamp)}</span>
				</div>
			</div>
			<button
				class="btn btn-circle btn-ghost btn-sm"
				onclick={handleClose}
				aria-label="Close Pinned Response"
			>
				<i class="bi bi-x-lg"></i>
			</button>
		</div>

		<!-- Content -->
		{#if isExpanded}
			<div
				transition:fade={{ duration: 150 }}
				class="h-[400px] max-h-[60vh] overflow-hidden border-t border-base-300 bg-base-200 p-0"
			>
				<CodeEditor rawValue={pinnedResponse.response} language="json" readonly={true} />
			</div>
		{/if}
	</div>
{/if}
