<script lang="ts">
	import EndpointForm from '$lib/components/EndpointForm.svelte';
	import EndpointPicker from '$lib/components/EndpointPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { endpoints, localStorageEndpoints, addEndpoint } from '$lib/stores/endpointsStore';
	import { get } from 'svelte/store';
	import { addToast } from '$lib/stores/toastStore';
	import type { AvailableEndpoint } from '$lib/types';

	let showAddModal = $state(false);
	let editingEndpoint = $state<AvailableEndpoint | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const handleEditEndpoint = (endpoint: AvailableEndpoint) => {
		editingEndpoint = endpoint;
		showAddModal = true;
	};

	const handleExport = () => {
		const data = get(localStorageEndpoints);
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'user_endpoints.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		addToast('Endpoints exported', 'success');
	};

	const handleImport = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text);
			if (!Array.isArray(data)) throw new Error('Invalid format: not an array');

			let count = 0;
			for (const ep of data) {
				if (ep.id && ep.url) {
					addEndpoint(ep);
					count++;
				}
			}
			addToast(`Imported ${count} endpoints`, 'success');
		} catch (e: any) {
			addToast(`Import failed: ${e.message}`, 'error');
		}
		target.value = '';
	};
</script>

<div class="mx-auto max-w-7xl p-8">
	<div class="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
		<h1 class="text-3xl font-bold">Select an Endpoint</h1>
		<div class="flex flex-wrap gap-2">
			<input
				type="file"
				accept=".json"
				class="hidden"
				bind:this={fileInput}
				onchange={handleImport}
			/>
			<button class="btn gap-2 btn-outline" onclick={() => fileInput?.click()}>
				<i class="bi bi-upload"></i> Import
			</button>
			<button class="btn gap-2 btn-outline" onclick={handleExport}>
				<i class="bi bi-download"></i> Export
			</button>
			<button
				class="btn btn-primary"
				onclick={() => {
					editingEndpoint = null;
					showAddModal = true;
				}}
			>
				<i class="bi bi-plus-lg mr-2"></i> Add Endpoint
			</button>
		</div>
	</div>

	<EndpointPicker
		endpoints={$endpoints}
		onAddEndpoint={() => {
			editingEndpoint = null;
			showAddModal = true;
		}}
		onEditEndpoint={handleEditEndpoint}
	/>

	<Modal
		bind:show={showAddModal}
		modalIdentifier="add-endpoint-modal"
		onCancel={() => {
			showAddModal = false;
			editingEndpoint = null;
		}}
	>
		<EndpointForm
			endpointToEdit={editingEndpoint}
			onHide={() => {
				showAddModal = false;
				editingEndpoint = null;
			}}
		/>
	</Modal>
</div>
