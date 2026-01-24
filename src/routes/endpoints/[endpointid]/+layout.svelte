<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import MainWraper from '$lib/components/MainWraper.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { localEndpoints } from '$lib/stores/testData/testEndpoints';
	import { localStorageEndpoints } from '$lib/stores/endpointsStore';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { AvailableEndpoint } from '$lib/types';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	let endpointConfiguration = $state<AvailableEndpoint | undefined>();
	let endpointid = $state<string>('');
	let isLoading = $state(true);

	let forceVisibleSidebar = $state(false);

	$effect(() => {
		endpointid = $page.params.endpointid ?? '';
		console.debug('EndpointLayout: Resolving endpoint ID:', endpointid);

		if (endpointid) {
			// 1. Try exact match in localEndpoints (hardcoded)
			let found = localEndpoints.find((endpoint) => endpoint.id == endpointid);

			// 2. Try exact match in localStorageEndpoints
			if (!found && $localStorageEndpoints) {
				found = $localStorageEndpoints.find((endpoint) => endpoint.id == endpointid);
			}

			// 3. Legacy: Check for prefixes (if any legacy links still exist)
			if (!found) {
				if (endpointid.startsWith('localEndpoint--')) {
					found = localEndpoints.find((endpoint) => endpoint.id == endpointid.split('--')[1]);
				} else if (endpointid.startsWith('localstorageEndpoint--') && $localStorageEndpoints) {
					found = $localStorageEndpoints.find(
						(endpoint) => endpoint.id == endpointid.split('--')[1]
					);
				}
			}

			if (found) {
				console.debug('EndpointLayout: Found endpoint configuration:', found);
			} else {
				console.warn('EndpointLayout: Endpoint configuration not found for ID:', endpointid);
			}

			endpointConfiguration = found;

			// Redirect to explorer if we are on the root endpoint page
			// We do this here because +page.svelte (children) might not render if Introspection fails in MainWraper
			if (browser && endpointConfiguration) {
				const currentPath = $page.url.pathname;
				const targetPath = `/endpoints/${endpointid}`;
				// Handle trailing slash differences
				if (currentPath === targetPath || currentPath === targetPath + '/') {
					console.debug('EndpointLayout: Redirecting to explorer');
					goto(`${targetPath}/explorer`, { replaceState: true });
				}
			}
			isLoading = false;
		}
	});
</script>

{#if endpointid}
	{#if isLoading}
		<div class="flex h-screen w-full items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if endpointConfiguration}
		<MainWraper endpointInfoProvided={endpointConfiguration}>
			<main class="flex w-[100vw] overflow-hidden bg-base-300">
				<div class="  md:max-w-[300px]">
					<Sidebar bind:forceVisibleSidebar />
				</div>
				<div class="flex h-screen w-full grow flex-col md:w-[65vw]">
					<div class=" flex min-h-[50px] bg-base-100">
						<button
							type="button"
							aria-label="Open sidebar"
							class="btn btn-square btn-ghost md:hidden"
							onclick={() => {
								forceVisibleSidebar = true;
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
						</button>
						<div></div>
					</div>
					{@render children?.()}
				</div>
			</main>
		</MainWraper>
	{:else}
		<div class="flex h-screen w-full items-center justify-center">
			<div class="text-center">
				<h2 class="text-xl font-bold">Endpoint Not Found</h2>
				<p class="py-4">Could not find configuration for ID: {endpointid}</p>
				<a href="/endpoints" class="btn btn-primary">Back to Endpoints</a>
			</div>
		</div>
	{/if}
{/if}
