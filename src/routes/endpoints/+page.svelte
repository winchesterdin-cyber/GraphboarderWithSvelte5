<script>
	import AddEndpointToLocalStorage from '$lib/components/AddEndpointToLocalStorage.svelte';
	import { localEndpoints } from '$lib/stores/testData/testEndpoints';
	import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import EndpointPicker from '$lib/components/EndpointPicker.svelte';

	let endpoints = $state([]);
	let loaded = $state(false);

	const loadEndpoints = () => {
		if (browser) {
			let endpointsFromLocalStorage = JSON.parse(localStorage.getItem('endpoints') || '[]');
			//merge with localEndpoints
			//if id is same, use localEndpoints (because they are updated with code changes, local storage is not)
			let mergedEndpoints = [
				...localEndpoints,
				...endpointsFromLocalStorage.filter(
					(e) => !localEndpoints.find((le) => le.id === e.id)
				)
			];
			endpoints = getSortedAndOrderedEndpoints(mergedEndpoints);
			loaded = true;
		}
	};

	onMount(() => {
		loadEndpoints();
	});
</script>

<div class="p-4">
	{#if loaded}
		<EndpointPicker {endpoints} />
	{:else}
		<div class="flex justify-center items-center h-full">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{/if}

	<AddEndpointToLocalStorage on:endpointAdded={loadEndpoints} />
</div>
