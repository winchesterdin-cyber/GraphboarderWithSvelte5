<script lang="ts">
	import {
		getFields_Grouped,
		get_scalarColsData,
		get_nodeFieldsQMS_info
	} from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	import type { QMSMainWraperContext } from '$lib/types';

	interface Props {
		prefix?: string;
		origin: string;
		query: any;
	}

	let { prefix = '', origin, query }: Props = $props();

	let QMSContext = getContext<QMSMainWraperContext>(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSContext?.endpointInfo;
	const schemaData = QMSContext?.schemaData;
	let queryName = query.name;

	// Use derived state to prevent "state referenced locally" warnings and ensure reactivity
	let queryNameDisplay = $derived.by(() => {
		let display = queryName;
		const mandatoryArgs = query?.args?.filter((arg: any) => {
			return arg.dd_NON_NULL;
		});
		const ID_Args = query?.args?.filter((arg: any) => {
			return arg.dd_rootName == 'ID';
		});

		// Calculate scalar fields
		// Note: We access store values inside the derived scope
		const currentQMS_info = schemaData?.get_QMS_Field(queryName, 'query', schemaData);
		if (endpointInfo && currentQMS_info) {
			const rowsLocation = ($endpointInfo as any).rowsLocation || []; // Accessing store value safely?
			// Wait, endpointInfo is a store. To access its value reactively in Svelte 5 derived,
			// we should use $endpointInfo if it was passed as a prop or is available in scope.
			// But here it comes from context. context return value is not reactive in the same way unless it's a store.
			// endpointInfo IS a store. So we should use $endpointInfo.
			// However, getContext returns the store object.
			// In Svelte 5, $store access works if the store is imported or defined in component.
			// But here we are inside a .ts script block (sort of).
			// Actually $derived can track store subscriptions if using $store syntax.

			// Let's rely on the store. However, some utility functions might expect the store object or the value.
			// schemaData is a store. endpointInfo is a store.
			// get_scalarColsData expects schemaData store object (based on usage elsewhere).
			// get_nodeFieldsQMS_info expects schemaData store object.

			// We need $endpointInfo.rowsLocation.
			// Let's assume endpointInfo store has the value.

			// BUT, accessing $endpointInfo inside $derived might be tricky if it's not a top-level state.
			// It should work.
		}

		// Simplified logic to avoid complex store dependencies inside derived if possible,
		// or accept that it might not be fully reactive to deep store changes if not set up right.
		// For now, let's fix the immediate syntax warning.

		if (mandatoryArgs?.length > 0) {
			display = `${display} (${mandatoryArgs.length}) `;
		}
		if (ID_Args?.length > 0) {
			display = `${display} <${ID_Args.length}> `;
		}

		// Re-calculating scalar fields here is heavy and requires context access.
		// Let's try to replicate the original logic but structured correctly.
		if (schemaData && endpointInfo) {
			// We need to subscribe to get value? or just use get()?
			// In derived, we should use $schemaData if we want reactivity.
			// But schemaData seems to be used as an object with methods in `get_QMS_Field`.

			// Original code:
			// let currentQMS_info = schemaData.get_QMS_Field(queryName, 'query', schemaData);
			// const rowsLocation = $endpointInfo.rowsLocation;

			// If we put this in $derived, we need to ensure we don't break reactivity.
			// It might be safer to keep it as side-effect or just computed once if schema doesn't change often.
			// But schema might load async.

			// Let's stick to the prompt: fix warnings.
		}

		return display;
	});

	// To handle scalar fields check properly without cluttering derived:
	let hasScalarFields = $state(true);

	$effect(() => {
		if (schemaData && endpointInfo && $endpointInfo) {
			const currentQMS_info = schemaData.get_QMS_Field(queryName, 'query', schemaData);
			const rowsLocation = ($endpointInfo as any).rowsLocation || [];
			if (currentQMS_info) {
				const nodeFieldsQMS_info = get_nodeFieldsQMS_info(
					currentQMS_info,
					rowsLocation,
					schemaData
				);
				const scalarFields = get_scalarColsData(
					nodeFieldsQMS_info,
					[currentQMS_info.dd_displayName, ...rowsLocation],
					schemaData
				);
				hasScalarFields = scalarFields.length > 0;
			}
		}
	});

	let finalDisplayName = $derived(
		hasScalarFields ? queryNameDisplay : queryNameDisplay + ' (no scalar)'
	);
</script>

<a title={queryName} href="{origin}/queries/{queryName}" class="block h-full w-full p-2"
	>{finalDisplayName}</a
>
