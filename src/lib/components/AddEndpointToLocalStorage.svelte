<script lang="ts">
	import { stringToJs } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';

	interface Props {
		onEndpointAdded?: () => void;
		onHide?: () => void;
	}

	let { onEndpointAdded, onHide }: Props = $props();

	let localStorageEndpoints = getContext('localStorageEndpoints');

	let id = $state('');
	let url = $state('');
	let headers = $state('');
	let error = $state('');

	const placeholderHeaders = '{"Authorization": "Bearer token"}';

	const handleSave = () => {
		try {
			let headersObj = {};
			if (headers) {
				headersObj = JSON.parse(headers);
			}

			const newEndpoint = {
				id,
				url,
				headers: headersObj,
				isMantained: false,
				description: 'User added endpoint'
			};

			let indexOfNewEndpointIdInLocalStorage;
			if ($localStorageEndpoints?.length > 0) {
				indexOfNewEndpointIdInLocalStorage = $localStorageEndpoints.findIndex(
					(endpoint) => endpoint.id == newEndpoint.id
				);
			} else {
				indexOfNewEndpointIdInLocalStorage = -1;
			}

			if (indexOfNewEndpointIdInLocalStorage > -1) {
				$localStorageEndpoints[indexOfNewEndpointIdInLocalStorage] = newEndpoint;
			} else {
				$localStorageEndpoints.push(newEndpoint);
			}
			localStorageEndpoints.set(getSortedAndOrderedEndpoints($localStorageEndpoints));

			onEndpointAdded?.();
			onHide?.();
		} catch (e) {
			error = 'Invalid Headers JSON: ' + e.message;
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
		<input type="text" id="endpoint-id" bind:value={id} placeholder="my-endpoint" class="input input-bordered w-full" />
	</div>

	<div class="form-control w-full mb-4">
		<label class="label" for="endpoint-url">
			<span class="label-text">URL</span>
		</label>
		<input type="text" id="endpoint-url" bind:value={url} placeholder="https://example.com/graphql" class="input input-bordered w-full" />
	</div>

	<div class="form-control w-full mb-4">
		<label class="label" for="endpoint-headers">
			<span class="label-text">Headers (JSON)</span>
		</label>
		<textarea id="endpoint-headers" bind:value={headers} class="textarea textarea-bordered h-24" placeholder={placeholderHeaders}></textarea>
	</div>

	{#if error}
		<div class="alert alert-error mb-4">
			<span>{error}</span>
		</div>
	{/if}

	<div class="flex justify-end gap-2">
		<button
			class="btn btn-ghost"
			onclick={() => {
				onHide?.();
			}}>Cancel</button
		>
		<button
			class="btn btn-primary"
			onclick={handleSave}
			disabled={!id || !url}
		>Save</button>
	</div>
</div>
