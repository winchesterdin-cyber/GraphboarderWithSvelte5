<script lang="ts">
	import { addEndpoint } from '$lib/stores/endpointsStore';
	import { localEndpoints } from '$lib/stores/testData/testEndpoints';
	import { addToast } from '$lib/stores/toastStore';

	interface Props {
		onEndpointAdded?: () => void;
		onHide?: () => void;
	}

	let { onEndpointAdded, onHide }: Props = $props();

	let id = $state('');
	let url = $state('');
	let headers = $state('');

	let idError = $state('');
	let urlError = $state('');
	let headersError = $state('');
	let generalError = $state('');

	const placeholderHeaders = '{"Authorization": "Bearer token"}';

	const validateId = () => {
		idError = '';
		if (!id.trim()) {
			idError = 'ID is required';
			return false;
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

			const newEndpoint = {
				id,
				url,
				headers: headersObj,
				isMantained: false,
				description: 'User added endpoint'
			};

			addEndpoint(newEndpoint);
			addToast('Endpoint added successfully!', 'success');

			onEndpointAdded?.();
			onHide?.();
		} catch (e: any) {
			generalError = e.message;
			addToast('Failed to add endpoint', 'error');
		}
	};
</script>

<div class="w-full">
	<h2 class="text-2xl font-bold mb-4">Add new Endpoint</h2>
	<p class="mb-4 text-base-content/70">Save endpoint to your browser's Local Storage</p>

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
			<label class="label">
				<span class="label-text-alt text-error">{idError}</span>
			</label>
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
			<label class="label">
				<span class="label-text-alt text-error">{urlError}</span>
			</label>
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
			<label class="label">
				<span class="label-text-alt text-error">{headersError}</span>
			</label>
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
