<script lang="ts">
	import { getRootType } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	interface Props {
		setNotInUseIfNotValid?: boolean;
		setNotInUseIfNotValidAndENUM?: boolean;
		parentNode?: any;
		node?: any;
		prefix?: string;
		QMSInfo: any;
	}

	let {
		setNotInUseIfNotValid = true,
		setNotInUseIfNotValidAndENUM = true,
		parentNode,
		node,
		prefix = '',
		QMSInfo
	}: Props = $props();
	let mainWraperContext = getContext(`${prefix}QMSMainWraperContext`) as any;
	const schemaData = mainWraperContext?.schemaData;
	const nodeRootType = getRootType(null, QMSInfo.dd_rootName, schemaData);
	const descriptionNeedsSeparator = QMSInfo?.description && nodeRootType?.description;
</script>

{#if nodeRootType?.description || QMSInfo?.description}
	<div class="text-md mt-2 alert py-2 alert-info shadow-lg">
		<div class="flex space-x-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="my-auto h-6 w-6 flex-shrink-0 stroke-current"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<ul class=" space-y-2">
				{#if nodeRootType?.description}
					<li class="">
						{nodeRootType?.description}
					</li>
				{/if}

				{#if QMSInfo?.description}
					<li class="">{QMSInfo?.description}</li>
				{/if}
			</ul>
		</div>
	</div>
{/if}
