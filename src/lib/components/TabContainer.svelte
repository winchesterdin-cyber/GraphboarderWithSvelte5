<script lang="ts">
	import { page } from '$app/stores';
	import TabItem from '$lib/components/TabItem.svelte';
	import { getQMSLinks } from '$lib/utils/usefulFunctions';
	import { getContext, onMount } from 'svelte';

	interface Props {
		endpointInfo: any;
		onHideSidebar?: () => void;
		prefix?: string;
	}

	let { endpointInfo, onHideSidebar, prefix = '' }: Props = $props();

	let QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	const schemaData = QMSMainWraperContext?.schemaData;
	let endpointid = $page.params.endpointid;
	let links = [
		{
			title: 'Home',
			url: '/',
			urlIsRoute: true,
			icon: 'bi-house',
			isSelected: false,
			hasFill: true,
			items: []
		},
		// {
		// 	title: 'Endpoints',
		// 	url: `/endpoints/`,
		// 	//target: '_blank',
		// 	urlIsRoute: false,
		// 	icon: 'bi bi-list',
		// 	isSelected: false,
		// 	hasFill: false,
		// 	items: []
		// },
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
	];

	let itemsToShow = $state([]);

	const get_itemsToShow = () => {
		return (itemsToShow =
			links.filter((link) => {
				return $page.url.pathname == link.url || $page.url.pathname.startsWith(`${link.url}/`);
			})[0]?.items ?? []);
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
			<div class="h-[50px] bg-accent">{''}</div>
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
