<script lang="ts">
	import type { EndpointInfoStore } from '$lib/types';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { headerPresetsStore, type HeaderPreset } from '$lib/stores/headerPresetsStore';
	import { logger } from '$lib/utils/logger';
	import { v4 as uuid } from '@lukeed/uuid';

	interface Props {
		endpointInfo: EndpointInfoStore;
		onClose: () => void;
	}

	let { endpointInfo, onClose }: Props = $props();

	let headersString = $state('{}');
	let error = $state<string | null>(null);
	let presetName = $state('');

	onMount(() => {
		const currentHeaders = get(endpointInfo)?.headers || {};
		headersString = JSON.stringify(currentHeaders, null, 2);
	});

	const save = () => {
		try {
			const headers = JSON.parse(headersString);
			endpointInfo.update((info) => ({
				...info,
				headers
			}));
			error = null;
			logger.info('Headers updated manually');
			onClose();
		} catch (e) {
			error = (e as Error).message;
			logger.warn('Failed to parse headers JSON', e);
		}
	};

	const savePreset = () => {
		if (!presetName) return;
		try {
			const headers = JSON.parse(headersString);
			const id = uuid();
			headerPresetsStore.addPreset({
				id,
				name: presetName,
				headers
			});
			logger.info(`Preset saved: ${presetName}`);
			presetName = '';
		} catch (e) {
			error = 'Invalid JSON, cannot save preset.';
			logger.warn('Failed to save preset due to invalid JSON', e);
		}
	};

	const loadPreset = (preset: HeaderPreset) => {
		headersString = JSON.stringify(preset.headers, null, 2);
		logger.info(`Preset loaded: ${preset.name}`);
	};

	const deletePreset = (id: string) => {
		headerPresetsStore.removePreset(id);
	};
</script>

<div class="flex flex-col gap-4">
	<h3 class="text-lg font-bold">Edit Headers</h3>
	<p class="text-sm text-gray-500">
		Modify headers for the current session. These headers will be used for all subsequent requests.
	</p>

	<!-- Presets Section -->
	<div class="rounded border bg-base-200 p-2">
		<h4 class="mb-2 text-sm font-bold">Presets</h4>
		<div class="mb-2 flex flex-wrap gap-2">
			{#each $headerPresetsStore as preset}
				<div class="badge badge-neutral gap-2 p-3">
					<button class="hover:underline" onclick={() => loadPreset(preset)}>{preset.name}</button>
					<button
						class="btn btn-circle btn-ghost btn-xs"
						onclick={() => deletePreset(preset.id)}
						aria-label="Delete preset">✕</button
					>
				</div>
			{/each}
			{#if $headerPresetsStore.length === 0}
				<span class="text-xs italic text-gray-500">No presets saved.</span>
			{/if}
		</div>
		<div class="flex gap-2">
			<input
				type="text"
				class="input input-bordered input-sm grow"
				placeholder="New preset name..."
				bind:value={presetName}
			/>
			<button
				class="btn btn-secondary btn-sm"
				onclick={savePreset}
				disabled={!presetName}
				aria-label="Save Preset">Save Current as Preset</button
			>
		</div>
	</div>

	<textarea
		class="textarea textarea-bordered h-64 font-mono text-sm"
		bind:value={headersString}
		placeholder={'{ "Authorization": "Bearer ..." }'}
	></textarea>
	{#if error}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{/if}
	<div class="flex justify-end gap-2">
		<button class="btn btn-ghost" onclick={onClose}>Cancel</button>
		<button class="btn btn-primary" onclick={save}>Save Headers</button>
	</div>
</div>
