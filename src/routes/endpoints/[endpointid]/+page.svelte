<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// This page is rendered when we are at /endpoints/[endpointid]
	// We want to redirect to the explorer by default.
	// Since this page is only mounted when the layout and MainWraper (introspection) are ready,
	// we can safely redirect.

	$effect(() => {
		if (browser) {
			const endpointid = $page.params.endpointid;
			if (endpointid) {
				console.debug('EndpointPage: Redirecting to explorer');
				goto(`/endpoints/${endpointid}/explorer`, { replaceState: true });
			}
		}
	});
</script>

<div class="flex h-full w-full items-center justify-center">
	<span class="loading loading-spinner loading-lg"></span>
	<span class="ml-2">Redirecting to Explorer...</span>
</div>
