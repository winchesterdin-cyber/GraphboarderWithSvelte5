<script lang="ts">
	import { clickOutside } from '$lib/actions/clickOutside';
	import TabContainer from '$lib/components/TabContainer.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { getContext } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import type { QMSMainWraperContext } from '$lib/types';
	import { downloadJSON } from '$lib/utils/usefulFunctions';

	interface Props {
		forceVisibleSidebar?: boolean;
		portalSelector?: any;
		links?: any;
		prefix?: string;
	}

	let {
		forceVisibleSidebar = $bindable(false),
		portalSelector = undefined,
		links = undefined,
		prefix = ''
	}: Props = $props();

	// if (forceVisibleSidebar === undefined) {
	// 	forceVisibleSidebar = false;
	// }

	let QMSContext = getContext<QMSMainWraperContext>(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSContext?.endpointInfo;
	const schemaData = QMSContext?.schemaData;

	/**
	 * Downloads the current schema as a JSON file.
	 */
	const downloadSchema = () => {
		if (schemaData && $schemaData.isReady && $schemaData.schema) {
			console.debug('Downloading schema...', $schemaData.schema);
			downloadJSON($schemaData.schema, 'schema.json');
		} else {
			console.warn('Schema data is not ready or missing.');
		}
	};
</script>

<div
	class="h-screen w-full {forceVisibleSidebar
		? 'visible '
		: ' invisible'} fixed left-0 z-50 flex md:visible md:static md:z-0"
	use:clickOutside
>
	<div class="invisible flex h-full flex-col md:visible">
		<TabContainer {endpointInfo} />
		<div class="absolute bottom-2 left-2 z-50 flex items-center gap-2 md:left-4">
			<ThemeToggle />
			<div class="tooltip tooltip-right" data-tip="Download Schema">
				<button
					class="btn btn-circle btn-ghost btn-sm"
					onclick={downloadSchema}
					aria-label="Download Schema"
				>
					<i class="bi bi-download"></i>
				</button>
			</div>
		</div>
	</div>
</div>
{#if forceVisibleSidebar}
	<div
		class=" fixed top-0 z-50 h-screen w-screen bg-base-100/50 md:hidden"
		in:fade|global={{ duration: 300 }}
		out:fade|global={{ duration: 300 }}
	></div>
	<div
		class="fixed top-0 z-50 md:hidden"
		in:fly|global={{ x: -300, duration: 300 }}
		out:fly|global={{ x: -350, duration: 300 }}
	>
		<TabContainer
			{endpointInfo}
			onHideSidebar={() => {
				if (forceVisibleSidebar) {
					forceVisibleSidebar = false;
				}
			}}
		/>
	</div>
{/if}
