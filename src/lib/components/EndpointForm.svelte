<script lang="ts">
	import { addEndpoint, removeEndpoint } from '$lib/stores/endpointsStore';
	import { localEndpoints } from '$lib/stores/testData/testEndpoints';
	import { addToast } from '$lib/stores/toastStore';
	import type { AvailableEndpoint } from '$lib/types';

	interface Props {
		onEndpointAdded?: () => void;
		onHide?: () => void;
		endpointToEdit?: AvailableEndpoint | null;
	}

	let { onEndpointAdded, onHide, endpointToEdit = null }: Props = $props();

	let id = $state('');
	let url = $state('');
	let headers = $state('');

	let idError = $state('');
	let urlError = $state('');
	let headersError = $state('');
	let generalError = $state('');

	// Effect to populate form when endpointToEdit changes
	$effect(() => {
		if (endpointToEdit) {
			id = endpointToEdit.id;
			url = endpointToEdit.url;
			headers = endpointToEdit.headers ? JSON.stringify(endpointToEdit.headers, null, 2) : '';
		} else {
			// Only reset if we are switching from edit to add, usually this component is remounted
			// but if the modal stays open and props change, we might want to reset.
			// However, usually the parent controls the modal visibility.
		}
	});

	const placeholderHeaders = '{"Authorization": "Bearer token"}';

	const validateId = () => {
		idError = '';
		if (!id.trim()) {
			idError = 'ID is required';
			return false;
		}

		// If editing and ID hasn't changed, it's valid
		if (endpointToEdit && id === endpointToEdit.id) {
			return true;
		}

		if (localEndpoints.some((e) => e.id === id)) {
			idError = `Cannot overwrite built-in endpoint '${id}'.`;
			return false;
		}
		return true;
	};

	const validateUrl = () => {
		urlError = '';
		if (!url.trim()) {
			urlError = 'URL is required';
			return false;
		}
		try {
			new URL(url);
			return true;
		} catch {
			urlError = 'Invalid URL format (must start with http:// or https://)';
			return false;
		}
	};

	const validateHeaders = () => {
		headersError = '';
		if (!headers.trim()) return true;
		try {
			JSON.parse(headers);
			return true;
		} catch (e) {
			headersError = 'Invalid JSON format for headers';
			return false;
		}
	};

	const handleSave = () => {
		generalError = '';

		const isIdValid = validateId();
		const isUrlValid = validateUrl();
		const isHeadersValid = validateHeaders();

		if (!isIdValid || !isUrlValid || !isHeadersValid) {
			return;
		}

		try {
			let headersObj = {};
			if (headers.trim()) {
				headersObj = JSON.parse(headers);
			}

			const newEndpoint: AvailableEndpoint = {
				id,
				url,
				headers: headersObj,
				isMaintained: false,
				description: endpointToEdit?.description || 'User added endpoint'
			};

			// If we are editing and the ID changed, remove the old one first
			if (endpointToEdit && endpointToEdit.id !== id) {
				removeEndpoint(endpointToEdit.id);
			}

			addEndpoint(newEndpoint);

			const action = endpointToEdit ? 'updated' : 'added';
			addToast(`Endpoint ${action} successfully!`, 'success');

			onEndpointAdded?.();
			onHide?.();
		} catch (e: any) {
			generalError = e.message;
			addToast('Failed to save endpoint', 'error');
		}
	};
</script>

<div class="w-full">
	<h2 class="text-2xl font-bold mb-4">
		{endpointToEdit ? 'Edit Endpoint' : 'Add new Endpoint'}
	</h2>
	<p class="mb-4 text-base-content/70">
		{endpointToEdit ? 'Update your endpoint configuration' : "Save endpoint to your browser's Local Storage"}
	</p>

	<div class="form-control w-full mb-4">
		<label class="label" for="endpoint-id">
			<span class="label-text">ID (Unique Name)</span>
		</label>
		<input
			type="text"
			id="endpoint-id"
			bind:value={id}
			oninput={() => { idError = ''; }}
			onblur={validateId}
			placeholder="my-endpoint"
			class="input input-bordered w-full"
			class:input-error={!!idError}
		/>
		{#if idError}
			<div class="label">
				<span class="label-text-alt text-error">{idError}</span>
			</div>
		{/if}
	</div>

	<div class="form-control w-full mb-4">
		<label class="label" for="endpoint-url">
			<span class="label-text">URL</span>
		</label>
		<input
			type="text"
			id="endpoint-url"
			bind:value={url}
			oninput={() => { urlError = ''; }}
			onblur={validateUrl}
			placeholder="https://example.com/graphql"
			class="input input-bordered w-full"
			class:input-error={!!urlError}
		/>
		{#if urlError}
			<div class="label">
				<span class="label-text-alt text-error">{urlError}</span>
			</div>
		{/if}
	</div>

	<div class="form-control w-full mb-4">
		<label class="label" for="endpoint-headers">
			<span class="label-text">Headers (JSON)</span>
		</label>
		<textarea
			id="endpoint-headers"
			bind:value={headers}
			oninput={() => { headersError = ''; }}
			onblur={validateHeaders}
			class="textarea textarea-bordered h-24"
			class:textarea-error={!!headersError}
			placeholder={placeholderHeaders}
		></textarea>
		{#if headersError}
			<div class="label">
				<span class="label-text-alt text-error">{headersError}</span>
			</div>
		{/if}
	</div>

	{#if generalError}
		<div class="alert alert-error mb-4">
			<span>{generalError}</span>
		</div>
	{/if}

	<div class="flex justify-end gap-2">
		<button
			class="btn btn-ghost"
			onclick={() => {
				onHide?.();
			}}>Cancel</button
		>
		<button class="btn btn-primary" onclick={handleSave} disabled={!id || !url}>Save</button>
	</div>
</div>
