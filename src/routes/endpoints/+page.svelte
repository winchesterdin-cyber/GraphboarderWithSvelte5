<script lang="ts">
	import AddEndpointToLocalStorage from '$lib/components/AddEndpointToLocalStorage.svelte';
	import { localEndpoints } from '$lib/stores/testData/testEndpoints';
	import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import EndpointPicker from '$lib/components/EndpointPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let endpoints = $state([]);
	let loaded = $state(false);
	let showAddModal = $state(false);

	const loadEndpoints = () => {
		if (browser) {
			let endpointsFromLocalStorage = JSON.parse(localStorage.getItem('endpoints') || '[]');
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

<div class="p-8 max-w-7xl mx-auto">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-bold">Select an Endpoint</h1>
		<button class="btn btn-primary" onclick={() => (showAddModal = true)}>
			<i class="bi bi-plus-lg mr-2"></i> Add Endpoint
		</button>
	</div>

	{#if loaded}
		<EndpointPicker {endpoints} />
	{:else}
		<div class="flex justify-center items-center h-64">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{/if}

	<Modal
		bind:show={showAddModal}
		modalIdentifier="add-endpoint-modal"
		onCancel={() => (showAddModal = false)}
	>
		<AddEndpointToLocalStorage
			onEndpointAdded={loadEndpoints}
			onHide={() => (showAddModal = false)}
		/>
	</Modal>
</div>
