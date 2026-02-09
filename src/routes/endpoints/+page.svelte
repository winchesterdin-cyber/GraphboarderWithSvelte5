<script lang="ts">
	import EndpointForm from '$lib/components/EndpointForm.svelte';
	import EndpointPicker from '$lib/components/EndpointPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { endpoints, localStorageEndpoints, addEndpoint } from '$lib/stores/endpointsStore';
	import { get } from 'svelte/store';
	import { addToast } from '$lib/stores/toastStore';
	import type { AvailableEndpoint } from '$lib/types';
	import { prepareEndpointImport } from '$lib/utils/endpointImport';
	import { logger } from '$lib/utils/logger';

	let showAddModal = $state(false);
	let showImportUrlModal = $state(false);
	let editingEndpoint = $state<AvailableEndpoint | null>(null);
	let isDuplicateMode = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let importUrl = $state('');
	let importUrlError = $state('');
	let isImportingUrl = $state(false);
	// When enabled, URL imports will avoid overwriting any existing endpoints.
	let skipExistingOnImport = $state(false);

	const handleEditEndpoint = (endpoint: AvailableEndpoint) => {
		editingEndpoint = endpoint;
		isDuplicateMode = false;
		showAddModal = true;
	};

	const handleDuplicateEndpoint = (endpoint: AvailableEndpoint) => {
		editingEndpoint = endpoint;
		isDuplicateMode = true;
		showAddModal = true;
	};

	const openImportUrlModal = () => {
		logger.info('Opened import URL modal');
		showImportUrlModal = true;
	};

	const handleExport = () => {
		const data = get(localStorageEndpoints);
		logger.info('Exporting endpoints', { count: data.length });
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

	/**
	 * Applies a parsed endpoints payload and reports the outcome via toast + logs.
	 * Duplicate IDs can be skipped to protect existing user configurations.
	 */
	const applyImportedEndpoints = (
		payload: unknown,
		source: 'file' | 'url',
		options: { skipExisting: boolean }
	) => {
		const existingIds = new Set(get(endpoints).map((endpoint) => endpoint.id.toString()));
		const importSummary = prepareEndpointImport(payload, {
			existingIds,
			skipExisting: options.skipExisting
		});
		const {
			endpoints: importedEndpoints,
			skippedInvalid,
			skippedDuplicates,
			skippedExisting,
			total
		} = importSummary;
		importedEndpoints.forEach((endpoint) => addEndpoint(endpoint));

		const added = importedEndpoints.length;
		const skipped = skippedInvalid + skippedDuplicates + skippedExisting;
		if (added === 0) {
			logger.warn('Import completed with no valid endpoints', {
				skippedInvalid,
				skippedDuplicates,
				skippedExisting,
				total,
				source
			});
			addToast('No valid endpoints found in the import', 'warning');
		} else {
			logger.info('Import completed', {
				added,
				skippedInvalid,
				skippedDuplicates,
				skippedExisting,
				total,
				source
			});
			addToast(`Imported ${added} endpoints${skipped ? ` (${skipped} skipped)` : ''}`, 'success');
		}

		if (skippedExisting > 0) {
			logger.warn('Skipped existing endpoints during import', { skippedExisting, source });
		}
	};

	const handleImport = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		logger.info('Importing endpoints from file', { name: file.name, size: file.size });

		try {
			const text = await file.text();
			const data = JSON.parse(text);
			applyImportedEndpoints(data, 'file', { skipExisting: false });
		} catch (e: any) {
			logger.error('Import failed', e);
			addToast(`Import failed: ${e.message}`, 'error');
		}
		target.value = '';
	};

	/**
	 * Validates and normalizes the URL entered for remote endpoint imports.
	 * We keep this separate so we can surface validation feedback in the modal.
	 */
	const validateImportUrl = (value: string) => {
		if (!value) return 'Enter a URL to import.';

		try {
			const parsed = new URL(value);
			if (!['http:', 'https:'].includes(parsed.protocol)) {
				return 'URL must start with http:// or https://';
			}
		} catch {
			return 'Enter a valid URL.';
		}

		return '';
	};

	const resetImportUrlModal = () => {
		showImportUrlModal = false;
		importUrl = '';
		importUrlError = '';
		isImportingUrl = false;
		skipExistingOnImport = false;
	};

	const resolveImportErrorMessage = (error: unknown) => {
		if (error instanceof DOMException && error.name === 'AbortError') {
			return 'Import timed out. Please try again.';
		}

		if (error instanceof Error) {
			return error.message;
		}

		return 'Unexpected error during import.';
	};

	/**
	 * Fetches endpoint JSON from a user-provided URL with a timeout so slow networks are surfaced.
	 */
	const handleImportFromUrl = async () => {
		const trimmedUrl = importUrl.trim();
		const validationMessage = validateImportUrl(trimmedUrl);
		if (validationMessage) {
			importUrlError = validationMessage;
			logger.warn('Import URL validation failed', { error: validationMessage });
			addToast(validationMessage, 'warning');
			return;
		}

		importUrlError = '';
		isImportingUrl = true;
		logger.info('Importing endpoints from URL', {
			url: trimmedUrl,
			skipExisting: skipExistingOnImport
		});

		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => controller.abort(), 10000);

		try {
			const response = await fetch(trimmedUrl, {
				signal: controller.signal,
				headers: {
					Accept: 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`Request failed (${response.status})`);
			}

			const payload = await response.json();
			applyImportedEndpoints(payload, 'url', { skipExisting: skipExistingOnImport });
			resetImportUrlModal();
		} catch (error) {
			const message = resolveImportErrorMessage(error);
			logger.error('Import from URL failed', error);
			addToast(`Import failed: ${message}`, 'error');
			importUrlError = message;
		} finally {
			window.clearTimeout(timeoutId);
			isImportingUrl = false;
		}
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
			<button class="btn gap-2 btn-outline" onclick={openImportUrlModal}>
				<i class="bi bi-link-45deg"></i> Import URL
			</button>
			<button class="btn gap-2 btn-outline" onclick={handleExport}>
				<i class="bi bi-download"></i> Export
			</button>
			<button
				class="btn btn-primary"
				onclick={() => {
					editingEndpoint = null;
					isDuplicateMode = false;
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
			isDuplicateMode = false;
			showAddModal = true;
		}}
		onEditEndpoint={handleEditEndpoint}
		onDuplicateEndpoint={handleDuplicateEndpoint}
	/>

	<Modal
		bind:show={showAddModal}
		modalIdentifier="add-endpoint-modal"
		onCancel={() => {
			showAddModal = false;
			editingEndpoint = null;
			isDuplicateMode = false;
		}}
	>
		<EndpointForm
			endpointToEdit={editingEndpoint}
			isDuplicate={isDuplicateMode}
			onHide={() => {
				showAddModal = false;
				editingEndpoint = null;
				isDuplicateMode = false;
			}}
		/>
	</Modal>

	<Modal
		bind:show={showImportUrlModal}
		modalIdentifier="import-url-modal"
		showApplyBtn={false}
		onCancel={resetImportUrlModal}
	>
		<div class="space-y-4">
			<div>
				<h2 class="text-xl font-semibold">Import Endpoints from URL</h2>
				<p class="mt-1 text-sm text-base-content/70">
					Provide a JSON URL that returns an array of endpoints exported from Graphboarder.
				</p>
			</div>
			<label class="form-control w-full">
				<span class="label-text mb-1 font-medium">Import URL</span>
				<input
					type="url"
					class={`input-bordered input w-full ${importUrlError ? 'input-error' : ''}`}
					placeholder="https://example.com/endpoints.json"
					bind:value={importUrl}
				/>
				{#if importUrlError}
					<span class="mt-2 text-sm text-error">{importUrlError}</span>
				{/if}
			</label>
			<label class="label cursor-pointer justify-start gap-3">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={skipExistingOnImport} />
				<span class="label-text">Skip endpoints that already exist in your list</span>
			</label>
			<div
				class="rounded-lg border border-base-200 bg-base-200/40 p-3 text-sm text-base-content/70"
			>
				<i class="bi bi-info-circle mr-2"></i>
				Imports may take a few seconds on slow networks. The request will timeout after 10 seconds.
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={resetImportUrlModal} disabled={isImportingUrl}>
					Cancel
				</button>
				<button
					class="btn btn-primary"
					onclick={handleImportFromUrl}
					disabled={!importUrl.trim() || isImportingUrl}
				>
					{#if isImportingUrl}
						<span class="loading loading-sm loading-spinner"></span>
						Importing...
					{:else}
						Import Endpoints
					{/if}
				</button>
			</div>
		</div>
	</Modal>
</div>
