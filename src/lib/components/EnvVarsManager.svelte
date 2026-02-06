<script lang="ts">
	import { envVars } from '$lib/stores/envVarsStore';
	import { addToast } from '$lib/stores/toastStore';
	import { downloadJSON } from '$lib/utils/downloadUtils';
	import { logger } from '$lib/utils/logger';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let newKey = $state('');
	let newValue = $state('');
	let showValues = $state(false);
	let fileInput: HTMLInputElement;

	const handleAdd = () => {
		if (!newKey.trim() || !newValue.trim()) {
			addToast('Key and Value are required', 'error');
			return;
		}
		// Validate key format (simple alphanumeric + underscore)
		if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newKey)) {
			addToast('Key must contain only letters, numbers, and underscores', 'error');
			return;
		}

		envVars.setVar(newKey, newValue);
		addToast(`Variable ${newKey} added`, 'success');
		newKey = '';
		newValue = '';
	};

	const handleDelete = (key: string) => {
		if (confirm(`Delete variable ${key}?`)) {
			envVars.removeVar(key);
			addToast(`Variable ${key} deleted`, 'success');
		}
	};

	const handleExport = () => {
		if (Object.keys($envVars).length === 0) {
			addToast('No variables to export', 'info');
			return;
		}
		downloadJSON($envVars, 'env-vars.json');
		addToast('Environment variables exported', 'success');
	};

	const handleImportClick = () => {
		fileInput.click();
	};

	const handleFileChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const json = JSON.parse(event.target?.result as string);

				// Validate structure: Record<string, string>
				if (typeof json !== 'object' || json === null || Array.isArray(json)) {
					throw new Error('Invalid format: Expected a JSON object');
				}

				for (const [key, value] of Object.entries(json)) {
					if (typeof value !== 'string') {
						throw new Error(`Invalid value for key "${key}": Expected string`);
					}
				}

				if (
					confirm(
						`Import ${Object.keys(json).length} variables? Existing variables with same keys will be overwritten.`
					)
				) {
					envVars.importVars(json as Record<string, string>);
					addToast(`Imported ${Object.keys(json).length} variables`, 'success');
				}
			} catch (err: any) {
				logger.error('Failed to import env vars', err);
				addToast(err.message || 'Failed to parse JSON file', 'error');
			}
			// Reset input
			target.value = '';
		};
		reader.readAsText(file);
	};
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-bold">Environment Variables</h3>
		<div class="flex items-center gap-2">
			<button class="btn btn-xs btn-ghost" onclick={handleExport} title="Export Variables">
				<i class="bi bi-download"></i>
			</button>
			<button class="btn btn-xs btn-ghost" onclick={handleImportClick} title="Import Variables">
				<i class="bi bi-upload"></i>
			</button>
			<input
				type="file"
				bind:this={fileInput}
				onchange={handleFileChange}
				accept=".json"
				class="hidden"
			/>
			<div class="divider divider-horizontal mx-0"></div>
			<label class="label cursor-pointer p-0">
				<span class="label-text mr-2 text-xs">Show Values</span>
				<input type="checkbox" class="toggle toggle-xs" bind:checked={showValues} />
			</label>
		</div>
	</div>

	<p class="text-sm text-gray-500">
		Variables can be used in headers as <code>{`{{VARIABLE_NAME}}`}</code>. They are stored locally.
	</p>

	<div class="max-h-60 overflow-y-auto rounded border border-base-200 p-2">
		{#if Object.keys($envVars).length === 0}
			<div class="p-4 text-center opacity-50">No variables defined.</div>
		{:else}
			<table class="table-compact table w-full">
				<thead>
					<tr>
						<th>Key</th>
						<th>Value</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries($envVars) as [key, val]}
						<tr>
							<td class="font-mono">{key}</td>
							<td class="font-mono text-sm opacity-70">
								{#if showValues}
									{val}
								{:else}
									••••••••
								{/if}
							</td>
							<td>
								<button
									class="btn text-error btn-ghost btn-xs"
									onclick={() => handleDelete(key)}
									aria-label="Delete {key}"
								>
									<i class="bi bi-trash"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<div class="divider my-0"></div>

	<div class="form-control">
		<h4 class="mb-2 text-sm font-bold">Add New Variable</h4>
		<div class="flex flex-col gap-2 sm:flex-row">
			<input
				type="text"
				placeholder="Key (e.g. API_TOKEN)"
				class="input-bordered input input-sm w-full font-mono"
				bind:value={newKey}
			/>
			<input
				type={showValues ? 'text' : 'password'}
				placeholder="Value"
				class="input-bordered input input-sm w-full font-mono"
				bind:value={newValue}
			/>
			<button class="btn btn-sm btn-primary" onclick={handleAdd}>
				<i class="bi bi-plus-lg"></i> Add
			</button>
		</div>
	</div>

	<div class="mt-4 flex justify-end">
		<button class="btn" onclick={onClose}>Close</button>
	</div>
</div>
