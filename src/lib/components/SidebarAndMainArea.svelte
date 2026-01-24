<script lang="ts">
	import { clickOutside } from '$lib/actions/clickOutside';
	import Page from '$lib/Page.svelte';

	let { title, sidebar, main } = $props();

	let forceVisibleSidebar = $state(false);
</script>

<div class="flex w-full">
	<div
		class="h-[100vh] w-[30vh] {forceVisibleSidebar
			? 'visible '
			: ' invisible'} fixed top-0 left-0 z-50 overflow-y-auto bg-base-200 lg:visible lg:static lg:z-0"
		use:clickOutside
		onclick={() => {
			forceVisibleSidebar = false;
		}}
		onclick_outside={() => {
			forceVisibleSidebar = false;
		}}
	>
		{@render sidebar?.()}
	</div>

	<Page MenuItem={true}>
		<div class="navbar w-full bg-base-300">
			<div class="flex-none lg:hidden">
				<label
					for="my-drawer-3"
					class="btn btn-square btn-ghost"
					onclick={() => {
						forceVisibleSidebar = !forceVisibleSidebar;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="inline-block h-6 w-6 stroke-current"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/></svg
					>
				</label>
			</div>
			<div class="mx-2 flex-1 px-2">{title}</div>
			<div class="block flex-none">
				<ul class="flex">
					<li>
						<button class="btn btn-sm"><i class="bi bi-plus-square text-xl"></i> </button>
					</li>
				</ul>
			</div>
		</div>
		{@render main?.()}
	</Page>
</div>
