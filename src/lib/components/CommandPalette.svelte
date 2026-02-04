<script lang="ts">
	import { goto } from '$app/navigation';
	import { appContext } from '$lib/stores/appContextStore';
	import Fuse from 'fuse.js';
	import { get } from 'svelte/store';
	import { logger } from '$lib/utils/logger';

	/**
	 * CommandPalette Component
	 * Provides a global search and navigation interface (Cmd+K).
	 */

	let dialog: HTMLDialogElement;
	let show = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);
	let inputElement: HTMLInputElement;

	interface CommandItem {
		title: string;
		url?: string;
		type: 'page' | 'query' | 'mutation' | 'action';
		description?: string;
		action?: () => void;
	}

	let items = $derived.by(() => {
		const list: CommandItem[] = [
			{ title: 'Home', url: '/', type: 'page', description: 'Go to Home Page' },
			{ title: 'Endpoints', url: '/endpoints', type: 'page', description: 'Go to Endpoint Picker' }
		];

		const context = $appContext;
		if (context.endpointInfo && context.schemaData) {
			const endpointInfo = get(context.endpointInfo);
			const schemaData = get(context.schemaData);
			const endpointId = endpointInfo?.id;

			if (endpointId) {
				list.push(
					{
						title: 'Explorer',
						url: `/endpoints/${endpointId}/explorer`,
						type: 'page',
						description: 'Go to Explorer'
					},
					{
						title: 'History',
						url: `/endpoints/${endpointId}/history`,
						type: 'page',
						description: 'Go to History'
					},
					{
						title: 'Favorites',
						url: `/endpoints/${endpointId}/favorites`,
						type: 'page',
						description: 'Go to Favorites'
					},
					{
						title: 'Recent',
						url: `/endpoints/${endpointId}/recent`,
						type: 'page',
						description: 'Go to Recent Queries'
					},
					{
						title: 'Mutations',
						url: `/endpoints/${endpointId}/mutations`,
						type: 'page',
						description: 'Go to Mutations List'
					},
					{
						title: 'Queries',
						url: `/endpoints/${endpointId}/queries`,
						type: 'page',
						description: 'Go to Queries List'
					}
				);

				if (schemaData.isReady) {
					schemaData.queryFields.forEach((f) => {
						list.push({
							title: f.name,
							url: `/endpoints/${endpointId}/queries/${f.name}`,
							type: 'query',
							description: f.description || 'Query'
						});
					});
					schemaData.mutationFields.forEach((f) => {
						list.push({
							title: f.name,
							url: `/endpoints/${endpointId}/mutations/${f.name}`,
							type: 'mutation',
							description: f.description || 'Mutation'
						});
					});
				}
			}
		}
		return list;
	});

	let fuse = $derived(
		new Fuse(items, {
			keys: ['title', 'description', 'type'],
			threshold: 0.4
		})
	);

	let results = $derived(
		query
			? fuse
					.search(query)
					.map((r) => r.item)
					.slice(0, 50)
			: items.slice(0, 20)
	);

	function open() {
		show = true;
		query = '';
		selectedIndex = 0;
		dialog.showModal();
		logger.debug('Command Palette opened');
	}

	function close() {
		show = false;
		dialog.close();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			if (show) close();
			else open();
		}

		if (!show) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + results.length) % results.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			execute(results[selectedIndex]);
		} else if (e.key === 'Escape') {
			// Dialog handles escape natively usually, but we might want to ensure state sync
			close();
		}
	}

	function execute(item: CommandItem) {
		if (!item) return;
		logger.debug('Command Palette executing:', item.title);
		if (item.action) {
			item.action();
		} else if (item.url) {
			goto(item.url);
		}
		close();
	}

	$effect(() => {
		if (show) {
			// ensure input focus when opened
			// Need to wait for render
			setTimeout(() => inputElement?.focus(), 10);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class="modal"
	onclose={() => (show = false)}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
>
	<div class="modal-box flex max-h-[80vh] flex-col overflow-hidden p-0">
		<div class="border-b border-base-300 p-4">
			<input
				bind:this={inputElement}
				type="text"
				placeholder="Type a command or search..."
				class="input w-full input-ghost text-lg focus:bg-transparent focus:outline-none"
				bind:value={query}
				role="combobox"
				aria-autocomplete="list"
				aria-expanded="true"
				aria-controls="command-palette-results"
			/>
		</div>
		<div class="flex-1 overflow-y-auto p-2">
			{#if results.length === 0}
				<div class="p-4 text-center text-base-content/50">No results found.</div>
			{:else}
				<ul id="command-palette-results" class="menu w-full p-0" role="listbox">
					{#each results as item, index}
						<li role="option" aria-selected={index === selectedIndex}>
							<button
								class="flex flex-col items-start gap-1 py-3 {index === selectedIndex
									? 'active'
									: ''}"
								onclick={() => execute(item)}
								onmouseenter={() => (selectedIndex = index)}
							>
								<div class="flex w-full items-center gap-2">
									<span class="flex-1 truncate font-bold">{item.title}</span>
									<span class="badge badge-ghost badge-sm">{item.type}</span>
								</div>
								{#if item.description}
									<span class="w-full truncate text-left text-xs opacity-70"
										>{item.description}</span
									>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<div class="flex justify-between border-t border-base-300 p-2 text-xs text-base-content/50">
			<span>
				<kbd class="kbd kbd-xs">↑</kbd> <kbd class="kbd kbd-xs">↓</kbd> to navigate
			</span>
			<span>
				<kbd class="kbd kbd-xs">↵</kbd> to select
			</span>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={close}>close</button>
	</form>
</dialog>
