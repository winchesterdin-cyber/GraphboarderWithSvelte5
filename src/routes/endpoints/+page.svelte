<script lang="ts">
	import AddEndpointToLocalStorage from '$lib/components/AddEndpointToLocalStorage.svelte';
	import EndpointPicker from '$lib/components/EndpointPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { endpoints } from '$lib/stores/endpointsStore';

	let showAddModal = $state(false);
</script>

<div class="p-8 max-w-7xl mx-auto">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-bold">Select an Endpoint</h1>
		<button class="btn btn-primary" onclick={() => (showAddModal = true)}>
			<i class="bi bi-plus-lg mr-2"></i> Add Endpoint
		</button>
	</div>

	<EndpointPicker endpoints={$endpoints} />

	<Modal
		bind:show={showAddModal}
		modalIdentifier="add-endpoint-modal"
		onCancel={() => (showAddModal = false)}
	>
		<AddEndpointToLocalStorage onHide={() => (showAddModal = false)} />
	</Modal>
</div>
