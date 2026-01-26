<script lang="ts">
	import { run } from 'svelte/legacy';

	import { setValueAtPath } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	interface Props {
		prefix?: string;
		QMSWraperCtxDataCurrent: any;
	}

	let { prefix = '', QMSWraperCtxDataCurrent }: Props = $props();
	/////////////////
	import type { QMSWraperContext } from '$lib/types/index';

	const { finalGqlArgObj_Store, stepsOfFields, paginationState_derived } = QMSWraperCtxDataCurrent;
	const OutermostQMSWraperContext = getContext(
		`${prefix}OutermostQMSWraperContext`
	) as QMSWraperContext;
	const { mergedChildren_finalGqlArgObj_Store } = OutermostQMSWraperContext;
	/////////////////
	let QMSarguments = $state();
	/////////////////
	run(() => {
		if ($finalGqlArgObj_Store && $finalGqlArgObj_Store.final_canRunQuery) {
			QMSarguments = { ...$finalGqlArgObj_Store.finalGqlArgObj, ...$paginationState_derived };
		}
	});

	run(() => {
		if (QMSarguments || $paginationState_derived) {
			mergedChildren_finalGqlArgObj_Store.update((value: Record<string, unknown>) => {
				return setValueAtPath(value, [...stepsOfFields, 'QMSarguments'], QMSarguments) as Record<
					string,
					unknown
				>;
			});
		}
	});
</script>
