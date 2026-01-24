<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	//import { cubicInOut } from 'svelte/easing';
	import { browser } from '$app/environment';

	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showTabs } from '$lib/stores/showTabs';
	interface Props {
		backPath?: any;
		CustomId?: any;
		MenuItem?: any;
		RememberScroll?: boolean;
		title?: any;
		children?: import('svelte').Snippet;
	}

	let {
		backPath,
		CustomId = 'page',
		MenuItem,
		RememberScroll = false,
		title,
		children
	}: Props = $props();
	//showTabs.set(true); // must change this line !!!!!!!!!!!!!!

	let hasPreviousPage = $state(false);
	if (browser) {
		hasPreviousPage = window.history.length == 1 ? false : true;
	}

	let backButtonClick = () => {
		if (browser) {
			if (hasPreviousPage) {
				window.history.back();
			} else {
				let path = backPath ? backPath : '/';
				goto(`${path}`, { replaceState: true });
			}
		}
	};

	/// scroll logic start b
	const storeScroll = () => {
		let mainEl = document.getElementById(CustomId);

		localStorage.setItem(CustomId, mainEl.scrollTop.toString());
	};
	const revertLastScroll = () => {
		let mainEl = document.getElementById(CustomId);

		let lastScroll = localStorage.getItem(CustomId);
		if (lastScroll) {
			mainEl.scrollTop = lastScroll;
		}
	};

	onDestroy(() => {
		if (browser) {
			if (!MenuItem) {
				showTabs.set(true);
			}
			if (RememberScroll) {
				let mainEl = document.getElementById(CustomId);
				if (mainEl) {
					localStorage.setItem(CustomId, mainEl.scrollTop.toString());
				}
			}
		}
	});
	onMount(() => {
		if (!MenuItem) {
			showTabs.set(false);
		}
		if (RememberScroll) {
			let mainEl = document.getElementById(CustomId);
			if (mainEl) {
				let lastScroll = localStorage.getItem(CustomId);
				if (lastScroll) {
					mainEl.scrollTop = lastScroll;
				}
			}
		}
	});

	/// scroll logic end
</script>

{#if MenuItem}
	<main
		in:fade|global={{ duration: 350, delay: 200 }}
		out:fade|global={{ duration: 200 }}
		id={CustomId}
		class=" overflow-y-scrollxxx z-0 h-screen w-full overflow-hidden"
	>
		{@render children?.()}
	</main>
{:else}
	<main
		in:scale|global={{ x: 200, duration: 300, opacity: 1, start: 0.97 }}
		out:scale|global={{ x: 300, duration: 300, opacity: 0, start: 0.97 }}
		id={CustomId}
		class="  fixed top-0 z-40 h-full w-full overflow-y-scroll bg-base-100 pb-96"
	>
		<div class="navbar sticky top-0 z-50 mb-2 w-full bg-base-100 text-base-content shadow-md">
			<div class="flex-none">
				<button class="btn btn-square btn-ghost" onclick={backButtonClick}>
					{#if hasPreviousPage}
						<i class="bi bi-chevron-left text-3xl font-black text-success"></i>
					{:else if backPath}
						<i class="bi bi-box-arrow-left text-3xl font-black text-success"></i>
					{:else}
						<i class="bi bi-house text-3xl font-black text-success"></i>
					{/if}
				</button>
			</div>
			<div class="mx-2 flex-1 px-2">
				<span class="  text-lg font-bold"> {title} </span>
			</div>
		</div>
		<div class="w-full p-2 md:w-[70vw]">
			{@render children?.()}
		</div>
	</main>
{/if}
