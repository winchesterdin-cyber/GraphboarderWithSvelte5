<script lang="ts">
	import { clickOutside } from '$lib/actions/clickOutside';
	import TabContainer from '$lib/components/TabContainer.svelte';
	import { getContext } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		forceVisibleSidebar?: boolean;
		portalSelector: any;
		links: any;
		prefix?: string;
	}

	let { forceVisibleSidebar = $bindable(), portalSelector, links, prefix = '' }: Props = $props();

	if (forceVisibleSidebar === undefined) {
		forceVisibleSidebar = false;
	}

	let QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSMainWraperContext?.endpointInfo;
</script>

<!-- on:click_outside={() => {
		if (forceVisibleSidebar) {
			forceVisibleSidebar = false;
		}
	}} -->

<div
	class="h-screen w-full {forceVisibleSidebar
		? 'visible '
		: ' invisible'} fixed left-0 z-50 flex md:visible md:static md:z-0"
	use:clickOutside
>
	<div class="invisible md:visible">
		<TabContainer {endpointInfo} />
	</div>
</div>
{#if forceVisibleSidebar}
	<div
		class=" fixed top-0 z-50 h-screen w-screen bg-base-100/50 md:hidden"
		in:fade|global={{ duration: 300, opacity: 1 }}
		out:fade|global={{ duration: 300, opacity: 1 }}
	></div>
	<div
		class="fixed top-0 z-50 md:hidden"
		in:fly|global={{ x: -300, duration: 300, opacity: 1 }}
		out:fly|global={{ x: -350, duration: 300, opacity: 1 }}
	>
		<TabContainer
			{endpointInfo}
			onHideSidebar={() => {
				if (forceVisibleSidebar) {
					forceVisibleSidebar = false;
				}
			}}
		/>
	</div>
{/if}
