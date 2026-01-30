<script lang="ts">
	import { page } from '$app/stores';
	import TabItem from '$lib/components/TabItem.svelte';
	import { getQMSLinks } from '$lib/utils/usefulFunctions';
	import { getContext, onMount } from 'svelte';
	import { recentQueries } from '$lib/stores/recentQueriesStore';
	import { favoriteQueries } from '$lib/stores/favoriteQueriesStore';
	import { historyQueries } from '$lib/stores/historyQueriesStore';
	import type { QMSMainWraperContext } from '$lib/types';

	interface LinkItem {
		title: string;
		url: string;
	}

	interface Link {
		title: string;
		url: string;
		urlIsRoute: boolean;
		icon: string;
		isSelected: boolean;
		hasFill: boolean;
		items: LinkItem[];
		target?: string;
	}

	interface Props {
		endpointInfo: any;
		onHideSidebar?: () => void;
		prefix?: string;
	}

	let { endpointInfo, onHideSidebar, prefix = '' }: Props = $props();

	let QMSContext = getContext<QMSMainWraperContext>(`${prefix}QMSMainWraperContext`);
	const schemaData = QMSContext?.schemaData;
	let endpointid = $derived($page.params.endpointid);

	let links = $derived<Link[]>([
		{
			title: 'Home',
			url: '/',
			urlIsRoute: true,
			icon: 'bi-house',
			isSelected: false,
			hasFill: true,
			items: []
		},
		{
			title: 'Queries',
			url: `/endpoints/${endpointid}/queries`,
			urlIsRoute: false,
			icon: 'bi bi-asterisk',
			isSelected: false,
			hasFill: false,
			items: getQMSLinks('query', `/endpoints/${endpointid}/queries`, endpointInfo, schemaData)
		},
		{
			title: 'Recent',
			url: `/endpoints/${endpointid}/recent`,
			urlIsRoute: false,
			icon: 'bi bi-clock-history',
			isSelected: false,
			hasFill: false,
			items: $recentQueries
				.filter((q) => q.endpointId === endpointid)
				.map((q) => ({
					title: q.name,
					url: `/endpoints/${endpointid}/${q.type == 'query' ? 'queries' : 'mutations'}/${q.name}`
				}))
		},
		{
			title: 'History',
			url: `/endpoints/${endpointid}/history`,
			urlIsRoute: false,
			icon: 'bi bi-clock',
			isSelected: false,
			hasFill: false,
			items: $historyQueries
				.filter((q) => q.endpointId === endpointid)
				.sort((a, b) => b.timestamp - a.timestamp)
				.map((q) => ({
					title: `${new Date(q.timestamp).toLocaleTimeString()} - ${q.queryName} (${q.status})`,
					url: `/endpoints/${endpointid}/${q.type == 'query' ? 'queries' : 'mutations'}/${q.queryName}?historyId=${q.id}`
				}))
		},
		{
			title: 'Favorites',
			url: `/endpoints/${endpointid}/favorites`,
			urlIsRoute: false,
			icon: 'bi bi-star',
			isSelected: false,
			hasFill: false,
			items: $favoriteQueries
				.filter((q) => q.endpointId === endpointid)
				.map((q) => ({
					title: q.name,
					url: `/endpoints/${endpointid}/${q.type == 'query' ? 'queries' : 'mutations'}/${q.name}`
				}))
		},
		{
			title: 'Mutations',
			url: `/endpoints/${endpointid}/mutations`,
			urlIsRoute: false,
			icon: 'bi bi-pen',
			isSelected: false,
			hasFill: true,
			items: getQMSLinks('mutation', `/endpoints/${endpointid}/mutations`, endpointInfo, schemaData)
		},
		{
			title: 'Explorer',
			url: `/endpoints/${endpointid}/explorer`,
			urlIsRoute: false,
			icon: 'bi bi-compass',
			isSelected: false,
			hasFill: true,
			items: []
		}
	]);

	let itemsToShow = $state<LinkItem[]>([]);

	const get_itemsToShow = () => {
		const currentLink = links.find((link) => {
			return $page.url.pathname == link.url || $page.url.pathname.startsWith(`${link.url}/`);
		});
		itemsToShow = currentLink?.items ?? [];
	};

	let isHistoryTab = $derived($page.url.pathname.includes('/history'));

	/**
	 * Clears the query history after user confirmation.
	 */
	const clearHistory = () => {
		if (confirm('Are you sure you want to clear all history?')) {
			historyQueries.clear();
		}
	};

	onMount(() => {
		get_itemsToShow();
	});

	$effect(() => {
		if ($page.url.pathname) {
			get_itemsToShow();
		}
	});
</script>

<div class="flex h-screen overscroll-contain">
	<div class="w-16">
		<div class="h-[50px] bg-primary">
			<a href="/" class="block h-full w-full">
				<img src="/logo.svg" alt="GraphQL Explorer Logo" class="h-full w-full" />
			</a>
		</div>
		<ul
			class="w-16xxx border-opacity-5 flex h-full flex-col justify-start overscroll-contain border-t-[1px] border-base-content bg-base-300 pt-1 pb-[25vh]"
		>
			{#each links as link}
				<TabItem
					title={link.title}
					url={link.url}
					icon={link.icon}
					hasFill={link.hasFill}
					urlIsRoute={link.urlIsRoute}
					target={link.target}
				/>
			{/each}
		</ul>
	</div>

	{#if itemsToShow.length > 0}
		<div class="">
			<div class="flex h-[50px] items-center justify-between bg-accent px-4">
				{#if isHistoryTab}
					<span class="font-bold text-accent-content">History</span>
					<button
						class="btn btn-xs btn-error text-white"
						onclick={clearHistory}
						title="Clear all history"
					>
						<i class="bi bi-trash"></i> Clear
					</button>
				{/if}
			</div>
			<ul
				class="h-full w-[60vw] grow space-y-1 overflow-x-auto overflow-y-auto overscroll-contain bg-base-100 px-4 py-4 pb-[25vh] md:w-full"
			>
				{#each itemsToShow as item}
					<li class="md:w-[10vw] md:min-w-[170px]">
						<a
							href={item.url}
							class="break-allxxx block h-full w-full truncate rounded px-2 py-2 text-sm leading-tight text-base-content hover:bg-info/50 ... {$page
								.url.pathname == item.url || $page.url.pathname.startsWith(`${item.url}/`)
								? 'bg-info/50 font-bold '
								: 'bg-info/5'}"
							title={item.title}
							onclick={() => {
								onHideSidebar?.();
							}}>{item.title}</a
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<button
		type="button"
		aria-label="Close sidebar"
		class="h-screen w-[100vw] cursor-default appearance-none border-none bg-transparent md:hidden"
		onclick={() => {
			onHideSidebar?.();
		}}
	></button>
</div>
